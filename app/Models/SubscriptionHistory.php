<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $subscription_id
 * @property int $tenant_id
 * @property string $event_type
 * @property int|null $from_plan_id
 * @property int|null $to_plan_id
 * @property string|null $from_status
 * @property string|null $to_status
 * @property int|null $performed_by
 * @property string $performed_by_type
 * @property string|null $reason
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property-read Subscription $subscription
 * @property-read Tenant $tenant
 * @property-read Plan|null $fromPlan
 * @property-read Plan|null $toPlan
 * @property-read User|null $performer
 */
class SubscriptionHistory extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     */
    protected $table = 'subscription_history';

    /**
     * Event type constants
     */
    public const EVENT_CREATED = 'created';
    public const EVENT_STATUS_CHANGED = 'status_changed';
    public const EVENT_PLAN_CHANGED = 'plan_changed';
    public const EVENT_RENEWED = 'renewed';
    public const EVENT_CANCELLED = 'cancelled';
    public const EVENT_REACTIVATED = 'reactivated';
    public const EVENT_TRIAL_STARTED = 'trial_started';
    public const EVENT_TRIAL_ENDED = 'trial_ended';
    public const EVENT_UPGRADE_SCHEDULED = 'upgrade_scheduled';
    public const EVENT_DOWNGRADE_SCHEDULED = 'downgrade_scheduled';

    /**
     * Performer type constants
     */
    public const PERFORMER_USER = 'user';
    public const PERFORMER_SYSTEM = 'system';
    public const PERFORMER_WEBHOOK = 'webhook';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'subscription_id',
        'tenant_id',
        'event_type',
        'from_plan_id',
        'to_plan_id',
        'from_status',
        'to_status',
        'performed_by',
        'performed_by_type',
        'reason',
        'metadata',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (SubscriptionHistory $history) {
            if (!$history->created_at) {
                $history->created_at = now();
            }
        });
    }

    /**
     * Get the subscription that this history belongs to.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Get the tenant that this history belongs to.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the previous plan.
     */
    public function fromPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'from_plan_id');
    }

    /**
     * Get the new plan.
     */
    public function toPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'to_plan_id');
    }

    /**
     * Get the user who performed this action.
     */
    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get the event type label.
     */
    public function getEventTypeLabelAttribute(): string
    {
        return match($this->event_type) {
            self::EVENT_CREATED => 'Subscription Created',
            self::EVENT_STATUS_CHANGED => 'Status Changed',
            self::EVENT_PLAN_CHANGED => 'Plan Changed',
            self::EVENT_RENEWED => 'Renewed',
            self::EVENT_CANCELLED => 'Cancelled',
            self::EVENT_REACTIVATED => 'Reactivated',
            self::EVENT_TRIAL_STARTED => 'Trial Started',
            self::EVENT_TRIAL_ENDED => 'Trial Ended',
            self::EVENT_UPGRADE_SCHEDULED => 'Upgrade Scheduled',
            self::EVENT_DOWNGRADE_SCHEDULED => 'Downgrade Scheduled',
            default => ucfirst(str_replace('_', ' ', $this->event_type)),
        };
    }

    /**
     * Get all available event types.
     */
    public static function getEventTypes(): array
    {
        return [
            self::EVENT_CREATED,
            self::EVENT_STATUS_CHANGED,
            self::EVENT_PLAN_CHANGED,
            self::EVENT_RENEWED,
            self::EVENT_CANCELLED,
            self::EVENT_REACTIVATED,
            self::EVENT_TRIAL_STARTED,
            self::EVENT_TRIAL_ENDED,
            self::EVENT_UPGRADE_SCHEDULED,
            self::EVENT_DOWNGRADE_SCHEDULED,
        ];
    }
}
