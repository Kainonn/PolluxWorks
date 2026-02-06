<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $plan_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $trial_ends_at
 * @property \Illuminate\Support\Carbon|null $current_period_start
 * @property \Illuminate\Support\Carbon|null $current_period_end
 * @property bool $auto_renew
 * @property int|null $pending_plan_id
 * @property \Illuminate\Support\Carbon|null $change_effective_at
 * @property string|null $change_type
 * @property string|null $cancellation_reason
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property int|null $cancelled_by
 * @property string|null $admin_notes
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read Plan $plan
 * @property-read Plan|null $pendingPlan
 * @property-read User|null $cancelledByUser
 * @property-read \Illuminate\Database\Eloquent\Collection|SubscriptionHistory[] $history
 */
class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    public const STATUS_TRIAL = 'trial';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Change type constants
     */
    public const CHANGE_IMMEDIATE = 'immediate';
    public const CHANGE_NEXT_PERIOD = 'next_period';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'started_at',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'auto_renew',
        'pending_plan_id',
        'change_effective_at',
        'change_type',
        'cancellation_reason',
        'cancelled_at',
        'cancelled_by',
        'admin_notes',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'started_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'auto_renew' => 'boolean',
        'change_effective_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get the tenant that owns this subscription.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the plan for this subscription.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Get the pending plan (if upgrade/downgrade is scheduled).
     */
    public function pendingPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'pending_plan_id');
    }

    /**
     * Get the user who cancelled this subscription.
     */
    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Get the subscription history.
     */
    public function history(): HasMany
    {
        return $this->hasMany(SubscriptionHistory::class)->orderByDesc('created_at');
    }

    /**
     * Scope a query to only include subscriptions with a specific status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include active subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope a query to only include trial subscriptions.
     */
    public function scopeTrial($query)
    {
        return $query->where('status', self::STATUS_TRIAL);
    }

    /**
     * Scope a query to only include overdue subscriptions.
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', self::STATUS_OVERDUE);
    }

    /**
     * Scope a query to only include subscriptions expiring soon.
     */
    public function scopeExpiringSoon($query, int $days = 7)
    {
        return $query->where('current_period_end', '<=', now()->addDays($days))
                     ->where('current_period_end', '>', now())
                     ->where('auto_renew', false);
    }

    /**
     * Scope a query to only include subscriptions with pending changes.
     */
    public function scopeWithPendingChanges($query)
    {
        return $query->whereNotNull('pending_plan_id');
    }

    /**
     * Check if the subscription is on trial.
     */
    public function onTrial(): bool
    {
        return $this->status === self::STATUS_TRIAL &&
               $this->trial_ends_at &&
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if the subscription is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if the subscription is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE;
    }

    /**
     * Check if the subscription is expired.
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    /**
     * Check if the subscription is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Check if there's a pending plan change.
     */
    public function hasPendingChange(): bool
    {
        return $this->pending_plan_id !== null;
    }

    /**
     * Check if the subscription can be renewed.
     */
    public function canRenew(): bool
    {
        return in_array($this->status, [
            self::STATUS_ACTIVE,
            self::STATUS_OVERDUE,
            self::STATUS_EXPIRED,
        ]);
    }

    /**
     * Get the number of days until trial ends.
     */
    public function daysUntilTrialEnds(): ?int
    {
        if (!$this->trial_ends_at) {
            return null;
        }

        return (int) now()->diffInDays($this->trial_ends_at, false);
    }

    /**
     * Get the number of days until period ends.
     */
    public function daysUntilPeriodEnds(): ?int
    {
        if (!$this->current_period_end) {
            return null;
        }

        return (int) now()->diffInDays($this->current_period_end, false);
    }

    /**
     * Get all available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_TRIAL,
            self::STATUS_ACTIVE,
            self::STATUS_OVERDUE,
            self::STATUS_EXPIRED,
            self::STATUS_CANCELLED,
        ];
    }

    /**
     * Get status label for display.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_TRIAL => 'Trial',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_OVERDUE => 'Overdue',
            self::STATUS_EXPIRED => 'Expired',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst($this->status),
        };
    }
}
