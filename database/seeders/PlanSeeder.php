<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small teams and individuals getting started.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'currency' => 'USD',
                'max_users' => 3,
                'max_modules' => 2,
                'max_ai_requests' => 100,
                'max_storage_mb' => 500,
                'trial_days' => 0,
                'features' => ['export_data', 'import_data'],
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'For growing businesses that need more power and flexibility.',
                'price_monthly' => 29.99,
                'price_yearly' => 299.90,
                'currency' => 'USD',
                'max_users' => 10,
                'max_modules' => 5,
                'max_ai_requests' => 1000,
                'max_storage_mb' => 5120,
                'trial_days' => 14,
                'features' => [
                    'api_access',
                    'priority_support',
                    'advanced_analytics',
                    'export_data',
                    'import_data',
                    'webhooks',
                    'custom_roles',
                ],
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large organizations with advanced needs and dedicated support.',
                'price_monthly' => 99.99,
                'price_yearly' => 999.90,
                'currency' => 'USD',
                'max_users' => -1,
                'max_modules' => -1,
                'max_ai_requests' => -1,
                'max_storage_mb' => -1,
                'trial_days' => 30,
                'features' => [
                    'api_access',
                    'priority_support',
                    'custom_branding',
                    'advanced_analytics',
                    'export_data',
                    'import_data',
                    'webhooks',
                    'sso',
                    'audit_logs',
                    'custom_roles',
                    'multi_language',
                    'white_label',
                    'dedicated_support',
                    'sla_guarantee',
                    'custom_integrations',
                ],
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
