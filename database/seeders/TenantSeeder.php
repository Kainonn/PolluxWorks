<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Tenant;
use App\Services\Tenant\TenantProvisioningService;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $starterPlan = Plan::where('slug', 'starter')->first();
        $proPlan = Plan::where('slug', 'pro')->first();
        $enterprisePlan = Plan::where('slug', 'enterprise')->first();

        if (!$starterPlan || !$proPlan) {
            $this->command->warn('Plans not found. Please run PlanSeeder first.');
            return;
        }

        $tenants = [
            [
                'name' => 'Acme Corporation',
                'slug' => 'acme',
                'plan_id' => $proPlan->id,
                'status' => Tenant::STATUS_ACTIVE,
                'timezone' => 'America/New_York',
                'locale' => 'en-US',
                'industry_type' => 'manufacturing',
            ],
            [
                'name' => 'TechStart Inc',
                'slug' => 'techstart',
                'plan_id' => $starterPlan->id,
                'status' => Tenant::STATUS_TRIAL,
                'trial_ends_at' => now()->addDays(14),
                'timezone' => 'America/Los_Angeles',
                'locale' => 'en-US',
                'industry_type' => 'technology',
            ],
            [
                'name' => 'Global Enterprises',
                'slug' => 'global-ent',
                'plan_id' => $enterprisePlan?->id ?? $proPlan->id,
                'status' => Tenant::STATUS_ACTIVE,
                'timezone' => 'Europe/London',
                'locale' => 'en-GB',
                'industry_type' => 'finance',
            ],
            [
                'name' => 'Industrias MX',
                'slug' => 'industriasmx',
                'plan_id' => $proPlan->id,
                'status' => Tenant::STATUS_ACTIVE,
                'timezone' => 'America/Mexico_City',
                'locale' => 'es-MX',
                'region' => 'Latin America',
                'industry_type' => 'manufacturing',
            ],
        ];

        foreach ($tenants as $tenantData) {
            // Check if tenant already exists
            if (Tenant::where('slug', $tenantData['slug'])->exists()) {
                $this->command->info("Tenant '{$tenantData['name']}' already exists, skipping.");
                continue;
            }

            // Create tenant record without full provisioning (for seeding purposes)
            $tenant = Tenant::create([
                ...$tenantData,
                'provisioning_status' => Tenant::PROVISIONING_READY, // Skip provisioning for seeds
                'provisioned_at' => now(),
                'seats_used' => rand(1, 10),
                'storage_used_mb' => rand(10, 500),
                'ai_requests_used_month' => rand(0, 100),
                'last_heartbeat_at' => now()->subMinutes(rand(1, 60)),
            ]);

            // Log creation
            $tenant->logActivity('seeded', 'Tenant created via seeder');

            // Create a default API token
            $tenant->createApiToken('default', ['heartbeat', 'sync']);

            $this->command->info("Created tenant: {$tenant->name} ({$tenant->slug})");
        }
    }
}
