<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table tracks which platform notifications have been read by each user
     * in the tenant. The notification_id references the master platform_notifications table.
     */
    public function up(): void
    {
        if (Schema::hasTable('platform_notification_reads')) {
            return;
        }

        Schema::create('platform_notification_reads', function (Blueprint $table) {
            $table->id();

            // Reference to master notification (not a FK since it's in different DB)
            $table->unsignedBigInteger('notification_id');

            // Local user reference
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Timestamps for different actions
            $table->timestamp('viewed_at')->nullable(); // First time seen
            $table->timestamp('read_at')->nullable();   // Marked as read
            $table->timestamp('dismissed_at')->nullable(); // Explicitly dismissed
            $table->timestamp('clicked_at')->nullable(); // Clicked CTA

            $table->timestamps();

            // Unique constraint: one record per notification per user
            $table->unique(['notification_id', 'user_id']);

            // Index for efficient unread count queries
            $table->index(['user_id', 'read_at']);
            $table->index('notification_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_notification_reads');
    }
};
