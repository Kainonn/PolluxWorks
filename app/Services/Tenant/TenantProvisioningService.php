<?php

namespace App\Services\Tenant;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantActivityLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TenantProvisioningService
{
    /**
     * Create and provision a new tenant.
     */
    public function createTenant(array $data, ?int $createdBy = null): Tenant
    {
        // First, create the tenant record in a transaction
        $tenant = DB::transaction(function () use ($data, $createdBy) {
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'status' => Tenant::STATUS_TRIAL,
                'plan_id' => $data['plan_id'],
                'trial_ends_at' => $this->calculateTrialEnd($data['plan_id'], $data['trial_days'] ?? null),
                'timezone' => $data['timezone'] ?? 'UTC',
                'locale' => $data['locale'] ?? 'en-US',
                'region' => $data['region'] ?? null,
                'industry_type' => $data['industry_type'] ?? null,
                'seats_limit' => $data['seats_limit'] ?? null,
                'storage_limit_mb' => $data['storage_limit_mb'] ?? null,
                'ai_requests_limit' => $data['ai_requests_limit'] ?? null,
                'enabled_modules' => $data['enabled_modules'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'provisioning_status' => Tenant::PROVISIONING_PENDING,
                'created_by' => $createdBy ?? Auth::id(),
            ]);

            // Log creation
            $tenant->logActivity('created', "Tenant '{$tenant->name}' was created");

            return $tenant;
        });

        // Start provisioning OUTSIDE the transaction (it operates on different DB)
        $this->startProvisioning($tenant, $data['admin'] ?? null);

        return $tenant->fresh();
    }

    /**
     * Calculate trial end date.
     */
    protected function calculateTrialEnd(int $planId, ?int $customTrialDays = null): ?\DateTimeInterface
    {
        $plan = Plan::find($planId);
        $trialDays = $customTrialDays ?? $plan?->trial_days ?? 0;

        if ($trialDays <= 0) {
            return null;
        }

        return now()->addDays($trialDays);
    }

    /**
     * Start the provisioning process.
     */
    public function startProvisioning(Tenant $tenant, ?array $adminData = null): void
    {
        try {
            $tenant->update(['provisioning_status' => Tenant::PROVISIONING_RUNNING]);
            $tenant->logActivity('provisioning_started', 'Provisioning process started');

            // Create database
            $this->createTenantDatabase($tenant);

            // Run tenant migrations
            $this->runTenantMigrations($tenant);

            // Create admin user if provided
            if ($adminData) {
                $this->createAdminUser($tenant, $adminData);
            }

            // Seed initial data
            $this->seedTenantData($tenant);

            // Generate API token
            $this->generateInitialApiToken($tenant);

            // Mark as ready
            $tenant->update([
                'provisioning_status' => Tenant::PROVISIONING_READY,
                'provisioned_at' => now(),
            ]);
            $tenant->logActivity('provisioning_completed', 'Provisioning completed successfully');

        } catch (\Exception $e) {
            Log::error("Tenant provisioning failed for {$tenant->id}: " . $e->getMessage());

            $tenant->update([
                'provisioning_status' => Tenant::PROVISIONING_FAILED,
                'provisioning_error' => $e->getMessage(),
            ]);
            $tenant->logActivity('provisioning_failed', "Provisioning failed: {$e->getMessage()}");

            throw $e;
        }
    }

    /**
     * Create database for tenant.
     */
    protected function createTenantDatabase(Tenant $tenant): void
    {
        $dbName = 'tenant_' . $tenant->slug;
        $dbUser = 'tenant_' . $tenant->slug;
        $dbPassword = Str::random(32);

        // For local development, we'll use SQLite or same MySQL server
        // In production, you might want to use separate DB servers

        if (config('database.default') === 'sqlite') {
            // SQLite: Create a separate file
            $dbPath = database_path("tenants/{$tenant->slug}.sqlite");

            // Ensure directory exists
            if (!is_dir(dirname($dbPath))) {
                mkdir(dirname($dbPath), 0755, true);
            }

            touch($dbPath);

            $tenant->update([
                'db_name' => $dbPath,
                'db_host' => null,
                'db_port' => null,
                'db_username' => null,
                'db_password' => null,
            ]);
        } else {
            // MySQL/PostgreSQL: Create database and user
            $connection = DB::connection();
            $driver = $connection->getDriverName();

            if ($driver === 'mysql') {
                DB::statement("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

                // Create user with limited privileges (production)
                // DB::statement("CREATE USER IF NOT EXISTS '{$dbUser}'@'%' IDENTIFIED BY '{$dbPassword}'");
                // DB::statement("GRANT ALL PRIVILEGES ON `{$dbName}`.* TO '{$dbUser}'@'%'");
                // DB::statement("FLUSH PRIVILEGES");
            } elseif ($driver === 'pgsql') {
                DB::statement("CREATE DATABASE \"{$dbName}\"");
            }

            $tenant->update([
                'db_name' => $dbName,
                'db_host' => config('database.connections.' . config('database.default') . '.host'),
                'db_port' => config('database.connections.' . config('database.default') . '.port'),
                'db_username' => config('database.connections.' . config('database.default') . '.username'), // Use same user for dev
                'db_password' => config('database.connections.' . config('database.default') . '.password'), // Use same password for dev
            ]);
        }
    }

    /**
     * Run migrations on tenant database.
     */
    protected function runTenantMigrations(Tenant $tenant): void
    {
        // Get tenant connection
        $this->configureTenantConnection($tenant);

        // Run tenant-specific migrations
        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations/tenants',
            '--force' => true,
        ]);
    }

    /**
     * Configure dynamic tenant database connection.
     */
    public function configureTenantConnection(Tenant $tenant): void
    {
        if (config('database.default') === 'sqlite') {
            config([
                'database.connections.tenant' => [
                    'driver' => 'sqlite',
                    'database' => $tenant->db_name,
                    'prefix' => '',
                    'foreign_key_constraints' => true,
                ],
            ]);
        } else {
            config([
                'database.connections.tenant' => [
                    'driver' => config('database.default'),
                    'host' => $tenant->db_host,
                    'port' => $tenant->db_port,
                    'database' => $tenant->db_name,
                    'username' => $tenant->db_username,
                    'password' => $tenant->db_password,
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                ],
            ]);
        }

        // Purge and reconnect
        DB::purge('tenant');
    }

    /**
     * Create admin user in tenant database.
     */
    protected function createAdminUser(Tenant $tenant, array $adminData): void
    {
        $this->configureTenantConnection($tenant);

        // Check if user already exists
        $existingUser = DB::connection('tenant')
            ->table('users')
            ->where('email', $adminData['email'])
            ->first();

        if ($existingUser) {
            $tenant->update(['admin_user_id' => $existingUser->id]);
            return;
        }

        // Insert admin user into tenant's users table
        $adminId = DB::connection('tenant')->table('users')->insertGetId([
            'name' => $adminData['name'],
            'email' => $adminData['email'],
            'password' => bcrypt($adminData['password'] ?? Str::random(16)),
            'email_verified_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Assign admin role if exists
        $adminRole = DB::connection('tenant')
            ->table('roles')
            ->where('name', 'admin')
            ->first();

        if ($adminRole) {
            DB::connection('tenant')->table('user_roles')->insert([
                'user_id' => $adminId,
                'role_id' => $adminRole->id,
            ]);
        }

        $tenant->update(['admin_user_id' => $adminId]);
    }

    /**
     * Seed initial data for tenant.
     */
    protected function seedTenantData(Tenant $tenant): void
    {
        $this->configureTenantConnection($tenant);

        // Create default permissions
        $permissions = [
            // Users
            ['name' => 'users.view', 'display_name' => 'View Users', 'group' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'group' => 'users'],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'group' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'users'],

            // Roles
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'group' => 'roles'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'group' => 'roles'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Roles', 'group' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'group' => 'roles'],

            // Settings
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'group' => 'settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'group' => 'settings'],

            // Reports
            ['name' => 'reports.view', 'display_name' => 'View Reports', 'group' => 'reports'],
            ['name' => 'reports.export', 'display_name' => 'Export Reports', 'group' => 'reports'],
        ];

        $permissionIds = [];
        foreach ($permissions as $permission) {
            $id = DB::connection('tenant')->table('permissions')->insertGetId([
                'name' => $permission['name'],
                'display_name' => $permission['display_name'],
                'group' => $permission['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $permissionIds[$permission['name']] = $id;
        }

        // Create default roles
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full access to all features',
                'is_system' => true,
                'permissions' => array_keys($permissionIds), // All permissions
            ],
            [
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Can manage users and view reports',
                'is_system' => true,
                'permissions' => ['users.view', 'users.create', 'users.edit', 'roles.view', 'settings.view', 'reports.view', 'reports.export'],
            ],
            [
                'name' => 'member',
                'display_name' => 'Member',
                'description' => 'Basic access to the platform',
                'is_system' => true,
                'permissions' => ['reports.view'],
            ],
        ];

        foreach ($roles as $roleData) {
            $roleId = DB::connection('tenant')->table('roles')->insertGetId([
                'name' => $roleData['name'],
                'display_name' => $roleData['display_name'],
                'description' => $roleData['description'],
                'is_system' => $roleData['is_system'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign permissions to role
            foreach ($roleData['permissions'] as $permissionName) {
                if (isset($permissionIds[$permissionName])) {
                    DB::connection('tenant')->table('role_permissions')->insert([
                        'role_id' => $roleId,
                        'permission_id' => $permissionIds[$permissionName],
                    ]);
                }
            }
        }

        // Create default settings
        $settings = [
            ['key' => 'company_name', 'value' => $tenant->name, 'group' => 'general'],
            ['key' => 'timezone', 'value' => $tenant->timezone ?? 'UTC', 'group' => 'general'],
            ['key' => 'date_format', 'value' => 'Y-m-d', 'group' => 'general'],
            ['key' => 'time_format', 'value' => 'H:i', 'group' => 'general'],
            ['key' => 'primary_color', 'value' => '#3b82f6', 'group' => 'branding'],
            ['key' => 'email_notifications', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'password_min_length', 'value' => '8', 'group' => 'security'],
            ['key' => 'session_timeout', 'value' => '60', 'group' => 'security'],
        ];

        foreach ($settings as $setting) {
            DB::connection('tenant')->table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'group' => $setting['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Generate initial API token for tenant.
     */
    protected function generateInitialApiToken(Tenant $tenant): void
    {
        $tenant->createApiToken('default', ['heartbeat', 'sync']);
    }

    /**
     * Re-run provisioning for a failed tenant.
     */
    public function retryProvisioning(Tenant $tenant): void
    {
        if ($tenant->provisioning_status !== Tenant::PROVISIONING_FAILED) {
            throw new \Exception('Can only retry provisioning for failed tenants');
        }

        $tenant->update([
            'provisioning_error' => null,
        ]);

        $this->startProvisioning($tenant);
    }

    /**
     * Delete tenant and its database.
     */
    public function deleteTenant(Tenant $tenant): void
    {
        DB::transaction(function () use ($tenant) {
            // Drop tenant database
            $this->dropTenantDatabase($tenant);

            // Delete tenant record (soft delete by default)
            $tenant->delete();
        });
    }

    /**
     * Drop tenant database.
     */
    protected function dropTenantDatabase(Tenant $tenant): void
    {
        if (!$tenant->db_name) {
            return;
        }

        if (config('database.default') === 'sqlite') {
            if (file_exists($tenant->db_name)) {
                unlink($tenant->db_name);
            }
        } else {
            $driver = DB::connection()->getDriverName();
            $dbName = $tenant->db_name;

            if ($driver === 'mysql') {
                DB::statement("DROP DATABASE IF EXISTS `{$dbName}`");
            } elseif ($driver === 'pgsql') {
                DB::statement("DROP DATABASE IF EXISTS \"{$dbName}\"");
            }
        }
    }
}
