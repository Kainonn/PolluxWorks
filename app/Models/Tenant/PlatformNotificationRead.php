<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Platform Notification Read status for tenant users
 *
 * This model tracks which platform notifications have been viewed/read by each user.
 * The notification_id references the master platform_notifications table.
 *
 * @property int $id
 * @property int $notification_id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon|null $viewed_at
 * @property \Illuminate\Support\Carbon|null $read_at
 * @property \Illuminate\Support\Carbon|null $dismissed_at
 * @property \Illuminate\Support\Carbon|null $clicked_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read TenantUser $user
 */
class PlatformNotificationRead extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'tenant';

    /**
     * The table associated with the model.
     */
    protected $table = 'platform_notification_reads';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'notification_id',
        'user_id',
        'viewed_at',
        'read_at',
        'dismissed_at',
        'clicked_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
            'read_at' => 'datetime',
            'dismissed_at' => 'datetime',
            'clicked_at' => 'datetime',
        ];
    }

    /**
     * Get the user that this read status belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'user_id');
    }

    /**
     * Check if notification has been viewed
     */
    public function isViewed(): bool
    {
        return $this->viewed_at !== null;
    }

    /**
     * Check if notification has been read
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Check if notification has been dismissed
     */
    public function isDismissed(): bool
    {
        return $this->dismissed_at !== null;
    }

    /**
     * Mark as viewed
     */
    public function markAsViewed(): self
    {
        if (!$this->viewed_at) {
            $this->update(['viewed_at' => now()]);
        }
        return $this;
    }

    /**
     * Mark as read
     */
    public function markAsRead(): self
    {
        $data = ['read_at' => now()];
        if (!$this->viewed_at) {
            $data['viewed_at'] = now();
        }
        $this->update($data);
        return $this;
    }

    /**
     * Mark as dismissed
     */
    public function markAsDismissed(): self
    {
        $this->update(['dismissed_at' => now()]);
        return $this;
    }

    /**
     * Mark as clicked (CTA)
     */
    public function markAsClicked(): self
    {
        $this->update(['clicked_at' => now()]);
        return $this;
    }

    /**
     * Scope: Unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope: Not dismissed
     */
    public function scopeNotDismissed($query)
    {
        return $query->whereNull('dismissed_at');
    }

    /**
     * Find or create read status for a notification
     */
    public static function findOrCreateForNotification(int $notificationId, int $userId): self
    {
        return static::firstOrCreate(
            [
                'notification_id' => $notificationId,
                'user_id' => $userId,
            ]
        );
    }
}
