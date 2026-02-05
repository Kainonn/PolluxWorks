<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Starter, Pro, Enterprise
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // Pricing
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            // Limits
            $table->integer('max_users')->default(1); // -1 for unlimited
            $table->integer('max_modules')->default(1); // -1 for unlimited
            $table->integer('max_ai_requests')->default(0); // -1 for unlimited
            $table->integer('max_storage_mb')->default(100); // -1 for unlimited

            // Trial
            $table->integer('trial_days')->default(0);

            // Feature flags (JSON)
            $table->json('features')->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
