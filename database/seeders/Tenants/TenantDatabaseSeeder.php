<?php

namespace Database\Seeders\Tenants;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TenantDatabaseSeeder extends Seeder
{
    /**
     * Seed the tenant's database.
     *
     * This seeder is run when a new tenant is provisioned.
     */
    public function run(): void
    {
        // Create default roles
        $this->seedRoles();

        // Create default permissions
        $this->seedPermissions();

        // Assign permissions to roles
        $this->seedRolePermissions();

        // Create default settings
        $this->seedSettings();
    }

    /**
     * Seed default roles.
     */
    protected function seedRoles(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full access to all features',
                'is_system' => true,
            ],
            [
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Can manage most resources except system settings',
                'is_system' => true,
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Standard user with basic permissions',
                'is_system' => true,
            ],
            [
                'name' => 'viewer',
                'display_name' => 'Viewer',
                'description' => 'Read-only access',
                'is_system' => true,
            ],
        ];

        foreach ($roles as $role) {
            DB::connection('tenant')->table('roles')->updateOrInsert(
                ['name' => $role['name']],
                [...$role, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Seed default permissions.
     */
    protected function seedPermissions(): void
    {
        $permissions = [
            // Users
            ['name' => 'users.view', 'display_name' => 'View Users', 'group' => 'Users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'group' => 'Users'],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'group' => 'Users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'Users'],

            // Roles
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'group' => 'Roles'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'group' => 'Roles'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Roles', 'group' => 'Roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'group' => 'Roles'],

            // Settings
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'group' => 'Settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'group' => 'Settings'],

            // Reports
            ['name' => 'reports.view', 'display_name' => 'View Reports', 'group' => 'Reports'],
            ['name' => 'reports.export', 'display_name' => 'Export Reports', 'group' => 'Reports'],
        ];

        foreach ($permissions as $permission) {
            DB::connection('tenant')->table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                [...$permission, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Assign permissions to roles.
     */
    protected function seedRolePermissions(): void
    {
        // Get role IDs
        $adminRole = DB::connection('tenant')->table('roles')->where('name', 'admin')->first();
        $managerRole = DB::connection('tenant')->table('roles')->where('name', 'manager')->first();
        $userRole = DB::connection('tenant')->table('roles')->where('name', 'user')->first();
        $viewerRole = DB::connection('tenant')->table('roles')->where('name', 'viewer')->first();

        // Get all permissions
        $allPermissions = DB::connection('tenant')->table('permissions')->pluck('id')->toArray();
        $viewPermissions = DB::connection('tenant')->table('permissions')->where('name', 'like', '%.view')->pluck('id')->toArray();
        $managerPermissions = DB::connection('tenant')->table('permissions')
            ->where('name', 'not like', 'settings.%')
            ->pluck('id')->toArray();

        // Admin gets all permissions
        if ($adminRole) {
            foreach ($allPermissions as $permissionId) {
                DB::connection('tenant')->table('role_permissions')->updateOrInsert([
                    'role_id' => $adminRole->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }

        // Manager gets all except settings
        if ($managerRole) {
            foreach ($managerPermissions as $permissionId) {
                DB::connection('tenant')->table('role_permissions')->updateOrInsert([
                    'role_id' => $managerRole->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }

        // Viewer gets only view permissions
        if ($viewerRole) {
            foreach ($viewPermissions as $permissionId) {
                DB::connection('tenant')->table('role_permissions')->updateOrInsert([
                    'role_id' => $viewerRole->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    /**
     * Seed default settings.
     */
    protected function seedSettings(): void
    {
        $settings = [
            // General
            ['group' => 'general', 'key' => 'company_name', 'value' => '', 'is_public' => true],
            ['group' => 'general', 'key' => 'company_logo', 'value' => '', 'is_public' => true],
            ['group' => 'general', 'key' => 'primary_color', 'value' => '#3b82f6', 'is_public' => true],

            // Notifications
            ['group' => 'notifications', 'key' => 'email_notifications', 'value' => 'true', 'is_public' => false],
            ['group' => 'notifications', 'key' => 'digest_frequency', 'value' => 'daily', 'is_public' => false],

            // Security
            ['group' => 'security', 'key' => 'password_min_length', 'value' => '8', 'is_public' => false],
            ['group' => 'security', 'key' => 'require_mfa', 'value' => 'false', 'is_public' => false],
            ['group' => 'security', 'key' => 'session_lifetime', 'value' => '120', 'is_public' => false],
        ];

        foreach ($settings as $setting) {
            DB::connection('tenant')->table('settings')->updateOrInsert(
                ['group' => $setting['group'], 'key' => $setting['key']],
                [...$setting, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
