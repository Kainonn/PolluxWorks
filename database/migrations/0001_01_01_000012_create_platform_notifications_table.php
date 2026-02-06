<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Platform Notifications are created by Master and delivered to tenants.
     * This is the source of truth for all platform-wide notifications.
     */
    public function up(): void
    {
        Schema::create('platform_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');

            // Classification
            $table->enum('category', ['maintenance', 'release', 'incident', 'announcement'])
                ->default('announcement');
            $table->enum('severity', ['info', 'warning', 'critical'])
                ->default('info');

            // Call to action (optional)
            $table->string('cta_label')->nullable();
            $table->string('cta_url')->nullable();

            // Scheduling / Validity window
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_sticky')->default(false); // Cannot be dismissed until read

            // Targeting (JSON for flexible segmentation)
            // Example: {"all": true} or {"plans": [1,2], "tenants": [5,9], "roles": ["tenant_admin"]}
            $table->json('targeting')->nullable();

            // Channels (for future expansion: email, push, etc.)
            $table->json('channels')->nullable(); // ["in_app"], ["in_app", "email"]

            // Metrics (denormalized for quick access)
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('reads_count')->default(0);
            $table->unsignedInteger('clicks_count')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for efficient querying
            $table->index('category');
            $table->index('severity');
            $table->index('is_active');
            $table->index(['starts_at', 'ends_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_notifications');
    }
};
