<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property \Illuminate\Support\Carbon $occurred_at
 * @property string $event_type
 * @property string $severity
 * @property string $status
 * @property string $actor_type
 * @property int|null $actor_id
 * @property int|null $tenant_id
 * @property string|null $target_type
 * @property string|null $target_id
 * @property string|null $ip
 * @property string|null $user_agent
 * @property string|null $correlation_id
 * @property string|null $request_id
 * @property string $message
 * @property array|null $context
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read User|null $actor
 * @property-read Tenant|null $tenant
 */
class SystemLog extends Model
{
    use HasUuids;

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * Severity levels
     */
    public const SEVERITY_INFO = 'info';
    public const SEVERITY_WARNING = 'warning';
    public const SEVERITY_ERROR = 'error';
    public const SEVERITY_CRITICAL = 'critical';

    /**
     * Status constants
     */
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';

    /**
     * Actor types
     */
    public const ACTOR_USER = 'user';
    public const ACTOR_SYSTEM = 'system';
    public const ACTOR_API = 'api';
    public const ACTOR_WEBHOOK = 'webhook';
    public const ACTOR_SCHEDULER = 'scheduler';

    /**
     * Target types
     */
    public const TARGET_TENANT = 'tenant';
    public const TARGET_SUBSCRIPTION = 'subscription';
    public const TARGET_USER = 'user';
    public const TARGET_PAYMENT = 'payment';
    public const TARGET_INVOICE = 'invoice';
    public const TARGET_PLAN = 'plan';
    public const TARGET_ROLE = 'role';
    public const TARGET_AI = 'ai';
    public const TARGET_WEBHOOK = 'webhook';
    public const TARGET_SYSTEM = 'system';

    /**
     * Event type categories
     */
    public const CATEGORY_AUTH = 'auth';
    public const CATEGORY_TENANT = 'tenant';
    public const CATEGORY_SUBSCRIPTION = 'subscription';
    public const CATEGORY_BILLING = 'billing';
    public const CATEGORY_ADMIN = 'admin';
    public const CATEGORY_AI = 'ai';
    public const CATEGORY_SYSTEM = 'system';

    /**
     * Common event types
     */
    public const EVENT_TYPES = [
        // Authentication & Security
        'auth.login.success',
        'auth.login.failed',
        'auth.logout',
        'auth.password.reset_requested',
        'auth.password.reset_success',
        'auth.mfa.enabled',
        'auth.mfa.disabled',
        'auth.session.revoked',
        'auth.suspicious_login',

        // Tenant Management
        'tenant.created',
        'tenant.updated',
        'tenant.deleted',
        'tenant.suspended',
        'tenant.reactivated',
        'tenant.trial_extended',
        'tenant.trial_ended',
        'tenant.provisioning.started',
        'tenant.provisioning.completed',
        'tenant.provisioning.failed',

        // Plan & Subscription
        'plan.created',
        'plan.updated',
        'plan.deleted',
        'subscription.created',
        'subscription.status_changed',
        'subscription.plan_changed',
        'subscription.plan_change_scheduled',
        'subscription.plan_change_cancelled',
        'subscription.cancelled',
        'subscription.reactivated',

        // Billing
        'billing.payment.succeeded',
        'billing.payment.failed',
        'billing.payment.refunded',
        'billing.invoice.created',
        'billing.invoice.paid',
        'billing.invoice.voided',
        'billing.webhook.received',
        'billing.webhook.processed',
        'billing.webhook.failed',

        // Administration (RBAC)
        'admin.user.created',
        'admin.user.updated',
        'admin.user.deleted',
        'admin.role.created',
        'admin.role.updated',
        'admin.role.deleted',
        'admin.role.assigned',
        'admin.role.removed',
        'admin.permission.changed',
        'admin.impersonation.started',
        'admin.impersonation.ended',

        // AI
        'ai.request.executed',
        'ai.tool.called',
        'ai.request.blocked',
        'ai.request.error',
        'ai.request.timeout',
        'ai.usage_limit.reached',
        'ai.usage_limit.warning',

        // System & Infrastructure
        'system.health_check.failed',
        'system.health_check.recovered',
        'system.queue.stalled',
        'system.queue.recovered',
        'system.backup.completed',
        'system.backup.failed',
        'system.maintenance.started',
        'system.maintenance.ended',
        'system.error',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'occurred_at',
        'event_type',
        'severity',
        'status',
        'actor_type',
        'actor_id',
        'tenant_id',
        'target_type',
        'target_id',
        'ip',
        'user_agent',
        'correlation_id',
        'request_id',
        'message',
        'context',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'occurred_at' => 'datetime',
        'context' => 'array',
    ];

    /**
     * Get the actor (user) that triggered the event.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Get the tenant associated with the event.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get available severities.
     */
    public static function getSeverities(): array
    {
        return [
            self::SEVERITY_INFO,
            self::SEVERITY_WARNING,
            self::SEVERITY_ERROR,
            self::SEVERITY_CRITICAL,
        ];
    }

    /**
     * Get available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_SUCCESS,
            self::STATUS_FAILED,
        ];
    }

    /**
     * Get available actor types.
     */
    public static function getActorTypes(): array
    {
        return [
            self::ACTOR_USER,
            self::ACTOR_SYSTEM,
            self::ACTOR_API,
            self::ACTOR_WEBHOOK,
            self::ACTOR_SCHEDULER,
        ];
    }

    /**
     * Get available target types.
     */
    public static function getTargetTypes(): array
    {
        return [
            self::TARGET_TENANT,
            self::TARGET_SUBSCRIPTION,
            self::TARGET_USER,
            self::TARGET_PAYMENT,
            self::TARGET_INVOICE,
            self::TARGET_PLAN,
            self::TARGET_ROLE,
            self::TARGET_AI,
            self::TARGET_WEBHOOK,
            self::TARGET_SYSTEM,
        ];
    }

    /**
     * Get event type categories.
     */
    public static function getCategories(): array
    {
        return [
            self::CATEGORY_AUTH => 'Authentication',
            self::CATEGORY_TENANT => 'Tenant',
            self::CATEGORY_SUBSCRIPTION => 'Subscription',
            self::CATEGORY_BILLING => 'Billing',
            self::CATEGORY_ADMIN => 'Administration',
            self::CATEGORY_AI => 'AI',
            self::CATEGORY_SYSTEM => 'System',
        ];
    }

    /**
     * Scope: filter by event type category.
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('event_type', 'like', "{$category}.%");
    }

    /**
     * Scope: filter by severity.
     */
    public function scopeSeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope: filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: filter by date range.
     */
    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('occurred_at', '>=', $from);
        }
        if ($to) {
            $query->where('occurred_at', '<=', $to);
        }
        return $query;
    }

    /**
     * Scope: filter by correlation ID.
     */
    public function scopeCorrelation($query, string $correlationId)
    {
        return $query->where('correlation_id', $correlationId);
    }

    /**
     * Scope: only critical and error logs.
     */
    public function scopeCriticalOrError($query)
    {
        return $query->whereIn('severity', [self::SEVERITY_CRITICAL, self::SEVERITY_ERROR]);
    }

    /**
     * Scope: recent logs (last N hours).
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('occurred_at', '>=', now()->subHours($hours));
    }

    /**
     * Get the category of this event.
     */
    public function getCategoryAttribute(): string
    {
        return Str::before($this->event_type, '.');
    }

    /**
     * Get a human-readable label for the event type.
     */
    public function getEventLabelAttribute(): string
    {
        $parts = explode('.', $this->event_type);
        return collect($parts)->map(fn($p) => ucfirst(str_replace('_', ' ', $p)))->join(' › ');
    }

    /**
     * Check if the log is critical or error.
     */
    public function isCritical(): bool
    {
        return in_array($this->severity, [self::SEVERITY_CRITICAL, self::SEVERITY_ERROR]);
    }

    /**
     * Get the target model if available.
     */
    public function getTargetModel(): ?Model
    {
        if (!$this->target_type || !$this->target_id) {
            return null;
        }

        $modelMap = [
            self::TARGET_TENANT => Tenant::class,
            self::TARGET_SUBSCRIPTION => Subscription::class,
            self::TARGET_USER => User::class,
            self::TARGET_PLAN => Plan::class,
            self::TARGET_ROLE => Role::class,
        ];

        $modelClass = $modelMap[$this->target_type] ?? null;

        if (!$modelClass) {
            return null;
        }

        return $modelClass::find($this->target_id);
    }

    /**
     * Get all related logs by correlation ID.
     */
    public function getRelatedLogs()
    {
        if (!$this->correlation_id) {
            return collect();
        }

        return static::where('correlation_id', $this->correlation_id)
            ->where('id', '!=', $this->id)
            ->orderBy('occurred_at')
            ->get();
    }
}
