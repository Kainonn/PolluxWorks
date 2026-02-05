<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'description' => 'Full system access with all permissions. Can manage all aspects of the platform.',
            ],
            [
                'name' => 'platform_admin',
                'description' => 'Platform administration access. Can manage users, roles, and system settings.',
            ],
            [
                'name' => 'billing_admin',
                'description' => 'Billing and financial administration. Can manage invoices, payments, and subscriptions.',
            ],
            [
                'name' => 'support_admin',
                'description' => 'Customer support administration. Can manage tickets, user issues, and support resources.',
            ],
            [
                'name' => 'ai_admin',
                'description' => 'AI services administration. Can manage AI models, configurations, and integrations.',
            ],
            [
                'name' => 'auditor',
                'description' => 'Audit access. Can view logs, reports, and system activity for compliance purposes.',
            ],
            [
                'name' => 'read_only',
                'description' => 'Read-only access. Can view data but cannot make any modifications.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
