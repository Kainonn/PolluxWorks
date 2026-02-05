<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin user
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@polluxworks.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Assign super_admin role
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole) {
            $superAdmin->roles()->syncWithoutDetaching([$superAdminRole->id]);
        }

        // Create Platform Admin user
        $platformAdmin = User::updateOrCreate(
            ['email' => 'platform@polluxworks.com'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $platformAdminRole = Role::where('name', 'platform_admin')->first();
        if ($platformAdminRole) {
            $platformAdmin->roles()->syncWithoutDetaching([$platformAdminRole->id]);
        }

        // Create Billing Admin user
        $billingAdmin = User::updateOrCreate(
            ['email' => 'billing@polluxworks.com'],
            [
                'name' => 'Billing Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $billingAdminRole = Role::where('name', 'billing_admin')->first();
        if ($billingAdminRole) {
            $billingAdmin->roles()->syncWithoutDetaching([$billingAdminRole->id]);
        }

        // Create Support Admin user
        $supportAdmin = User::updateOrCreate(
            ['email' => 'support@polluxworks.com'],
            [
                'name' => 'Support Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $supportAdminRole = Role::where('name', 'support_admin')->first();
        if ($supportAdminRole) {
            $supportAdmin->roles()->syncWithoutDetaching([$supportAdminRole->id]);
        }

        // Create AI Admin user
        $aiAdmin = User::updateOrCreate(
            ['email' => 'ai@polluxworks.com'],
            [
                'name' => 'AI Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $aiAdminRole = Role::where('name', 'ai_admin')->first();
        if ($aiAdminRole) {
            $aiAdmin->roles()->syncWithoutDetaching([$aiAdminRole->id]);
        }

        // Create Auditor user
        $auditor = User::updateOrCreate(
            ['email' => 'auditor@polluxworks.com'],
            [
                'name' => 'Auditor',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $auditorRole = Role::where('name', 'auditor')->first();
        if ($auditorRole) {
            $auditor->roles()->syncWithoutDetaching([$auditorRole->id]);
        }

        // Create Read Only user
        $readOnly = User::updateOrCreate(
            ['email' => 'viewer@polluxworks.com'],
            [
                'name' => 'Read Only User',
                'password' => Hash::make('password'),
                'email_verified_at' => null, // Unverified for testing
            ]
        );

        $readOnlyRole = Role::where('name', 'read_only')->first();
        if ($readOnlyRole) {
            $readOnly->roles()->syncWithoutDetaching([$readOnlyRole->id]);
        }
    }
}
