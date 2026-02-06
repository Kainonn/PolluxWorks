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
        Schema::create('audit_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamp('occurred_at')->useCurrent()->index();

            // Actor information (who made the change)
            $table->enum('actor_type', ['user', 'system', 'api', 'webhook', 'scheduler'])->default('system');
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('actor_email', 255)->nullable(); // Snapshot for audit permanence

            // Action performed
            $table->string('action', 50)->index(); // created, updated, deleted, status_changed, assigned, revoked

            // Entity affected
            $table->string('entity_type', 100)->index(); // Tenant, Subscription, User, Plan, Role, etc.
            $table->string('entity_id', 100)->index();
            $table->string('entity_label', 255)->nullable(); // Human-readable label snapshot

            // Optional tenant context
            $table->unsignedBigInteger('tenant_id')->nullable()->index();

            // Request metadata
            $table->string('ip', 45)->nullable(); // IPv6 compatible
            $table->text('user_agent')->nullable();
            $table->uuid('request_id')->nullable();
            $table->uuid('correlation_id')->nullable()->index();

            // Reason/justification (for compliance)
            $table->text('reason')->nullable();

            // Change data (the core of audit)
            $table->json('changes')->nullable(); // Structured diff: {"field": {"from": x, "to": y}}
            $table->json('before')->nullable(); // Full sanitized snapshot before change
            $table->json('after')->nullable(); // Full sanitized snapshot after change

            // Integrity verification (optional but pro)
            $table->string('checksum', 64)->nullable(); // SHA-256 hash for immutability verification

            // Metadata
            $table->json('metadata')->nullable(); // Additional context (tags, source, etc.)

            // Timestamps (created_at only matters, no updates allowed)
            $table->timestamps();

            // Composite indexes for common queries
            $table->index(['entity_type', 'entity_id']);
            $table->index(['occurred_at', 'entity_type']);
            $table->index(['actor_type', 'actor_id']);
            $table->index('created_at');

            // Foreign keys (soft - audit records must persist)
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
        Schema::dropIfExists('audit_entries');
    }
};
