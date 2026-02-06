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
        Schema::create('system_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamp('occurred_at')->useCurrent();

            // Event classification
            $table->string('event_type', 100)->index(); // e.g., auth.login.success, tenant.created
            $table->enum('severity', ['info', 'warning', 'error', 'critical'])->default('info')->index();
            $table->enum('status', ['success', 'failed'])->default('success')->index();

            // Actor information (who triggered the event)
            $table->enum('actor_type', ['user', 'system', 'api', 'webhook', 'scheduler'])->default('system');
            $table->unsignedBigInteger('actor_id')->nullable()->index();

            // Target information (what was affected)
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('target_type', 50)->nullable(); // e.g., tenant, subscription, user, payment, ai
            $table->string('target_id', 100)->nullable();

            // Request metadata
            $table->string('ip', 45)->nullable(); // IPv6 compatible
            $table->text('user_agent')->nullable();
            $table->uuid('correlation_id')->nullable()->index(); // For tracking related events
            $table->uuid('request_id')->nullable(); // Unique request identifier

            // Event details
            $table->string('message', 500); // Human-readable summary
            $table->json('context')->nullable(); // Detailed metadata (sanitized)

            // Timestamps
            $table->timestamps();

            // Indexes for common queries
            $table->index(['occurred_at', 'event_type']);
            $table->index(['actor_type', 'actor_id']);
            $table->index(['target_type', 'target_id']);
            $table->index('created_at');

            // Foreign keys (soft - logs should persist even if related records are deleted)
            $table->foreign('actor_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
