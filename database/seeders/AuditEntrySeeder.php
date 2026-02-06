<?php

namespace Database\Seeders;

use App\Models\AuditEntry;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AuditEntrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $tenants = Tenant::all();
        $plans = Plan::all();

        if ($users->isEmpty() || $tenants->isEmpty()) {
            $this->command->warn('No users or tenants found. Please run UserSeeder and TenantSeeder first.');
            return;
        }

        $entries = [];
        $correlationId = Str::uuid()->toString();

        // Tenant creation audit
        foreach ($tenants->take(3) as $index => $tenant) {
            $user = $users->random();
            $occurredAt = now()->subDays(rand(30, 60))->subHours(rand(1, 23));

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $user->id,
                'actor_email' => $user->email,
                'action' => AuditEntry::ACTION_CREATED,
                'entity_type' => AuditEntry::ENTITY_TENANT,
                'entity_id' => $tenant->id,
                'entity_label' => $tenant->name,
                'tenant_id' => $tenant->id,
                'ip' => '192.168.1.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'reason' => 'Nuevo cliente registrado a través del portal',
                'before' => null,
                'after' => json_encode([
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => 'active',
                    'plan_id' => $tenant->plan_id,
                ]),
                'changes' => null,
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_CREATED,
                    'entity_type' => AuditEntry::ENTITY_TENANT,
                    'entity_id' => $tenant->id,
                ])),
                'correlation_id' => $index === 0 ? $correlationId : Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // Plan changes
        foreach ($tenants->take(5) as $tenant) {
            $user = $users->random();
            $oldPlan = $plans->random();
            $newPlan = $plans->where('id', '!=', $oldPlan->id)->random();
            $occurredAt = now()->subDays(rand(5, 25))->subHours(rand(1, 23));

            $changes = [
                ['field' => 'plan_id', 'old' => $oldPlan->id, 'new' => $newPlan->id],
                ['field' => 'plan_name', 'old' => $oldPlan->name ?? 'Basic', 'new' => $newPlan->name ?? 'Enterprise'],
            ];

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $user->id,
                'actor_email' => $user->email,
                'action' => AuditEntry::ACTION_PLAN_CHANGED,
                'entity_type' => AuditEntry::ENTITY_TENANT,
                'entity_id' => $tenant->id,
                'entity_label' => $tenant->name,
                'tenant_id' => $tenant->id,
                'ip' => '10.0.0.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/537.36',
                'reason' => 'Upgrade solicitado por el cliente',
                'before' => json_encode(['plan_id' => $oldPlan->id, 'plan_name' => $oldPlan->name ?? 'Basic']),
                'after' => json_encode(['plan_id' => $newPlan->id, 'plan_name' => $newPlan->name ?? 'Enterprise']),
                'changes' => json_encode($changes),
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_PLAN_CHANGED,
                    'entity_type' => AuditEntry::ENTITY_TENANT,
                    'entity_id' => $tenant->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // Tenant suspensions
        foreach ($tenants->take(2) as $tenant) {
            $user = $users->random();
            $occurredAt = now()->subDays(rand(1, 10))->subHours(rand(1, 23));

            $changes = [
                ['field' => 'status', 'old' => 'active', 'new' => 'suspended'],
            ];

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $user->id,
                'actor_email' => $user->email,
                'action' => AuditEntry::ACTION_SUSPENDED,
                'entity_type' => AuditEntry::ENTITY_TENANT,
                'entity_id' => $tenant->id,
                'entity_label' => $tenant->name,
                'tenant_id' => $tenant->id,
                'ip' => '172.16.0.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
                'reason' => 'Falta de pago - 3 facturas vencidas',
                'before' => json_encode(['status' => 'active']),
                'after' => json_encode(['status' => 'suspended']),
                'changes' => json_encode($changes),
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_SUSPENDED,
                    'entity_type' => AuditEntry::ENTITY_TENANT,
                    'entity_id' => $tenant->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // User role assignments
        foreach ($users->take(5) as $user) {
            $admin = $users->where('id', '!=', $user->id)->random();
            $occurredAt = now()->subDays(rand(10, 40))->subHours(rand(1, 23));

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $admin->id,
                'actor_email' => $admin->email,
                'action' => AuditEntry::ACTION_ROLE_ASSIGNED,
                'entity_type' => AuditEntry::ENTITY_USER,
                'entity_id' => $user->id,
                'entity_label' => $user->name,
                'tenant_id' => null,
                'ip' => '192.168.10.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0',
                'reason' => 'Asignación de rol admin por aprobación de gerencia',
                'before' => json_encode(['roles' => ['viewer']]),
                'after' => json_encode(['roles' => ['viewer', 'admin']]),
                'changes' => json_encode([
                    ['field' => 'roles', 'old' => ['viewer'], 'new' => ['viewer', 'admin']],
                ]),
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_ROLE_ASSIGNED,
                    'entity_type' => AuditEntry::ENTITY_USER,
                    'entity_id' => $user->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // MFA changes
        foreach ($users->take(3) as $user) {
            $occurredAt = now()->subDays(rand(5, 20))->subHours(rand(1, 23));

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $user->id,
                'actor_email' => $user->email,
                'action' => AuditEntry::ACTION_MFA_ENABLED,
                'entity_type' => AuditEntry::ENTITY_USER,
                'entity_id' => $user->id,
                'entity_label' => $user->name,
                'tenant_id' => null,
                'ip' => '203.0.113.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
                'reason' => null,
                'before' => json_encode(['two_factor_enabled' => false]),
                'after' => json_encode(['two_factor_enabled' => true]),
                'changes' => json_encode([
                    ['field' => 'two_factor_enabled', 'old' => false, 'new' => true],
                ]),
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_MFA_ENABLED,
                    'entity_type' => AuditEntry::ENTITY_USER,
                    'entity_id' => $user->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // System actions
        $systemActions = [
            [
                'action' => AuditEntry::ACTION_CANCELLED,
                'entity_type' => AuditEntry::ENTITY_SUBSCRIPTION,
                'reason' => 'Cancelación automática por no renovación',
            ],
            [
                'action' => AuditEntry::ACTION_TRIAL_EXTENDED,
                'entity_type' => AuditEntry::ENTITY_TENANT,
                'reason' => 'Extensión de trial aprobada por soporte',
            ],
            [
                'action' => AuditEntry::ACTION_KEY_ROTATED,
                'entity_type' => AuditEntry::ENTITY_API_TOKEN,
                'reason' => 'Rotación de claves programada por políticas de seguridad',
            ],
        ];

        foreach ($systemActions as $systemAction) {
            $tenant = $tenants->random();
            $occurredAt = now()->subDays(rand(1, 15))->subHours(rand(1, 23));

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_SYSTEM,
                'actor_id' => null,
                'actor_email' => null,
                'action' => $systemAction['action'],
                'entity_type' => $systemAction['entity_type'],
                'entity_id' => $tenant->id,
                'entity_label' => $tenant->name,
                'tenant_id' => $tenant->id,
                'ip' => null,
                'user_agent' => null,
                'reason' => $systemAction['reason'],
                'before' => null,
                'after' => null,
                'changes' => null,
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => $systemAction['action'],
                    'entity_type' => $systemAction['entity_type'],
                    'entity_id' => $tenant->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // User updates
        foreach ($users->take(4) as $user) {
            $admin = $users->where('id', '!=', $user->id)->random();
            $occurredAt = now()->subDays(rand(2, 12))->subHours(rand(1, 23));

            $changes = [
                ['field' => 'name', 'old' => 'Old Name', 'new' => $user->name],
                ['field' => 'email', 'old' => 'old@example.com', 'new' => $user->email],
            ];

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $admin->id,
                'actor_email' => $admin->email,
                'action' => AuditEntry::ACTION_UPDATED,
                'entity_type' => AuditEntry::ENTITY_USER,
                'entity_id' => $user->id,
                'entity_label' => $user->name,
                'tenant_id' => null,
                'ip' => '10.10.10.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
                'reason' => 'Actualización de datos de contacto',
                'before' => json_encode(['name' => 'Old Name', 'email' => 'old@example.com']),
                'after' => json_encode(['name' => $user->name, 'email' => $user->email]),
                'changes' => json_encode($changes),
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_UPDATED,
                    'entity_type' => AuditEntry::ENTITY_USER,
                    'entity_id' => $user->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // API token generation audits
        foreach ($tenants->take(3) as $tenant) {
            $user = $users->random();
            $occurredAt = now()->subDays(rand(1, 20))->subHours(rand(1, 23));

            $entries[] = [
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'actor_type' => AuditEntry::ACTOR_USER,
                'actor_id' => $user->id,
                'actor_email' => $user->email,
                'action' => AuditEntry::ACTION_CREATED,
                'entity_type' => AuditEntry::ENTITY_API_TOKEN,
                'entity_id' => Str::uuid()->toString(),
                'entity_label' => 'Production API Key',
                'tenant_id' => $tenant->id,
                'ip' => '192.168.50.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
                'reason' => 'Generación de token para integración con sistema externo',
                'before' => null,
                'after' => json_encode(['token_name' => 'Production API Key', 'abilities' => ['read', 'write']]),
                'changes' => null,
                'request_id' => Str::uuid()->toString(),
                'metadata' => null,
                'checksum' => hash('sha256', json_encode([
                    'occurred_at' => $occurredAt->toISOString(),
                    'action' => AuditEntry::ACTION_CREATED,
                    'entity_type' => AuditEntry::ENTITY_API_TOKEN,
                    'entity_id' => $tenant->id,
                ])),
                'correlation_id' => Str::uuid()->toString(),
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ];
        }

        // Insert all entries
        foreach ($entries as $entry) {
            AuditEntry::create($entry);
        }

        $this->command->info('Created ' . count($entries) . ' audit entries.');
    }
}
