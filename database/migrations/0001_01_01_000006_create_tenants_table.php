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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Company/Tenant name
            $table->string('slug')->unique(); // Subdomain: acme -> acme.polluxworks.com

            // Status: trial | active | suspended | overdue | cancelled
            $table->enum('status', ['trial', 'active', 'suspended', 'overdue', 'cancelled'])->default('trial');

            // Plan relationship
            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();

            // Trial and billing dates
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('next_billing_at')->nullable();

            // Domains
            $table->string('primary_domain')->nullable(); // Custom domain if any
            $table->json('custom_domains')->nullable(); // Array of additional domains

            // DNS/SSL Status per domain
            $table->json('domain_status')->nullable(); // { "domain": { "dns": "pending|active|error", "ssl": "pending|active|error" } }

            // Provisioning
            $table->enum('provisioning_status', ['pending', 'running', 'ready', 'failed'])->default('pending');
            $table->text('provisioning_error')->nullable();
            $table->timestamp('provisioned_at')->nullable();

            // Database connection info (encrypted)
            $table->string('db_name')->nullable();
            $table->string('db_host')->nullable();
            $table->string('db_port')->nullable();
            $table->string('db_username')->nullable();
            $table->text('db_password')->nullable(); // Encrypted

            // Heartbeat / Monitoring
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->string('app_version')->nullable();
            $table->json('health_data')->nullable(); // { uptime, queue_depth, error_rate, etc }

            // Limits (overrides plan if set)
            $table->integer('seats_limit')->nullable(); // null = use plan limit
            $table->integer('storage_limit_mb')->nullable(); // null = use plan limit
            $table->integer('ai_requests_limit')->nullable(); // null = use plan limit

            // Usage metrics (synced periodically)
            $table->integer('seats_used')->default(0);
            $table->integer('storage_used_mb')->default(0);
            $table->integer('ai_requests_used_month')->default(0);

            // Feature flags (overrides plan if set)
            $table->json('enabled_modules')->nullable();

            // Localization
            $table->string('timezone')->default('UTC');
            $table->string('locale')->default('en-US');
            $table->string('region')->nullable();
            $table->string('industry_type')->nullable();

            // Suspension info
            $table->timestamp('suspended_at')->nullable();
            $table->string('suspended_reason')->nullable();
            $table->foreignId('suspended_by')->nullable()->constrained('users')->nullOnDelete();

            // Cancellation info
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            // Admin user (initial admin created during provisioning)
            $table->foreignId('admin_user_id')->nullable(); // Points to tenant's admin in tenant DB (not master)

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable(); // Extra data, notes, etc.

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('provisioning_status');
            $table->index('last_heartbeat_at');
            $table->index('trial_ends_at');
        });

        // Tenant activity log (audit trail)
        Schema::create('tenant_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // created, suspended, reactivated, plan_changed, etc.
            $table->text('description')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });

        // Tenant heartbeats history
        Schema::create('tenant_heartbeats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('app_version')->nullable();
            $table->integer('uptime_seconds')->nullable();
            $table->integer('queue_depth')->nullable();
            $table->integer('active_users')->nullable();
            $table->float('error_rate')->nullable();
            $table->float('response_time_ms')->nullable();
            $table->json('extra_data')->nullable();
            $table->timestamp('created_at');

            $table->index(['tenant_id', 'created_at']);
        });

        // Tenant API tokens (for service-to-service communication)
        Schema::create('tenant_api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->json('abilities')->nullable(); // ['heartbeat', 'sync', etc.]
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_api_tokens');
        Schema::dropIfExists('tenant_heartbeats');
        Schema::dropIfExists('tenant_activity_logs');
        Schema::dropIfExists('tenants');
    }
};
