<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit Entry Model - Immutable by design
 *
 * @property string $id
 * @property \Illuminate\Support\Carbon $occurred_at
 * @property string $actor_type
 * @property int|null $actor_id
 * @property string|null $actor_email
 * @property string $action
 * @property string $entity_type
 * @property string $entity_id
 * @property string|null $entity_label
 * @property int|null $tenant_id
 * @property string|null $ip
 * @property string|null $user_agent
 * @property string|null $request_id
 * @property string|null $correlation_id
 * @property string|null $reason
 * @property array|null $changes
 * @property array|null $before
 * @property array|null $after
 * @property string|null $checksum
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read User|null $actor
 * @property-read Tenant|null $tenant
 */
class AuditEntry extends Model
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
     * Actor types
     */
    public const ACTOR_USER = 'user';
    public const ACTOR_SYSTEM = 'system';
    public const ACTOR_API = 'api';
    public const ACTOR_WEBHOOK = 'webhook';
    public const ACTOR_SCHEDULER = 'scheduler';

    /**
     * Action types
     */
    public const ACTION_CREATED = 'created';
    public const ACTION_UPDATED = 'updated';
    public const ACTION_DELETED = 'deleted';
    public const ACTION_STATUS_CHANGED = 'status_changed';
    public const ACTION_ASSIGNED = 'assigned';
    public const ACTION_REVOKED = 'revoked';
    public const ACTION_SUSPENDED = 'suspended';
    public const ACTION_REACTIVATED = 'reactivated';
    public const ACTION_CANCELLED = 'cancelled';
    public const ACTION_PLAN_CHANGED = 'plan_changed';
    public const ACTION_TRIAL_EXTENDED = 'trial_extended';
    public const ACTION_PROVISIONED = 'provisioned';
    public const ACTION_DOMAIN_ADDED = 'domain_added';
    public const ACTION_DOMAIN_REMOVED = 'domain_removed';
    public const ACTION_ROLE_ASSIGNED = 'role_assigned';
    public const ACTION_ROLE_REMOVED = 'role_removed';
    public const ACTION_MFA_ENABLED = 'mfa_enabled';
    public const ACTION_MFA_DISABLED = 'mfa_disabled';
    public const ACTION_SESSION_REVOKED = 'session_revoked';
    public const ACTION_KEY_ROTATED = 'key_rotated';
    public const ACTION_REFUNDED = 'refunded';

    /**
     * Entity types
     */
    public const ENTITY_TENANT = 'Tenant';
    public const ENTITY_SUBSCRIPTION = 'Subscription';
    public const ENTITY_USER = 'User';
    public const ENTITY_PLAN = 'Plan';
    public const ENTITY_ROLE = 'Role';
    public const ENTITY_INVOICE = 'Invoice';
    public const ENTITY_PAYMENT = 'Payment';
    public const ENTITY_PAYMENT_METHOD = 'PaymentMethod';
    public const ENTITY_BILLING_CUSTOMER = 'BillingCustomer';
    public const ENTITY_WEBHOOK_ENDPOINT = 'WebhookEndpoint';
    public const ENTITY_API_TOKEN = 'ApiToken';
    public const ENTITY_PLATFORM_SETTINGS = 'PlatformSettings';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'occurred_at',
        'actor_type',
        'actor_id',
        'actor_email',
        'action',
        'entity_type',
        'entity_id',
        'entity_label',
        'tenant_id',
        'ip',
        'user_agent',
        'request_id',
        'correlation_id',
        'reason',
        'changes',
        'before',
        'after',
        'checksum',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'occurred_at' => 'datetime',
        'changes' => 'array',
        'before' => 'array',
        'after' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Boot method - enforce immutability
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates (read-only after creation)
        static::updating(function ($model) {
            throw new \RuntimeException('Audit entries are immutable and cannot be updated.');
        });

        // Prevent deletes
        static::deleting(function ($model) {
            throw new \RuntimeException('Audit entries are immutable and cannot be deleted.');
        });
    }

    /**
     * Get the actor (user) that made the change.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Get the tenant associated with the entry.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get available actions.
     */
    public static function getActions(): array
    {
        return [
            self::ACTION_CREATED,
            self::ACTION_UPDATED,
            self::ACTION_DELETED,
            self::ACTION_STATUS_CHANGED,
            self::ACTION_ASSIGNED,
            self::ACTION_REVOKED,
            self::ACTION_SUSPENDED,
            self::ACTION_REACTIVATED,
            self::ACTION_CANCELLED,
            self::ACTION_PLAN_CHANGED,
            self::ACTION_TRIAL_EXTENDED,
            self::ACTION_PROVISIONED,
            self::ACTION_DOMAIN_ADDED,
            self::ACTION_DOMAIN_REMOVED,
            self::ACTION_ROLE_ASSIGNED,
            self::ACTION_ROLE_REMOVED,
            self::ACTION_MFA_ENABLED,
            self::ACTION_MFA_DISABLED,
            self::ACTION_SESSION_REVOKED,
            self::ACTION_KEY_ROTATED,
            self::ACTION_REFUNDED,
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
     * Get available entity types.
     */
    public static function getEntityTypes(): array
    {
        return [
            self::ENTITY_TENANT,
            self::ENTITY_SUBSCRIPTION,
            self::ENTITY_USER,
            self::ENTITY_PLAN,
            self::ENTITY_ROLE,
            self::ENTITY_INVOICE,
            self::ENTITY_PAYMENT,
            self::ENTITY_PAYMENT_METHOD,
            self::ENTITY_BILLING_CUSTOMER,
            self::ENTITY_WEBHOOK_ENDPOINT,
            self::ENTITY_API_TOKEN,
            self::ENTITY_PLATFORM_SETTINGS,
        ];
    }

    /**
     * Scope: filter by entity type.
     */
    public function scopeForEntity($query, string $entityType, ?string $entityId = null)
    {
        $query->where('entity_type', $entityType);

        if ($entityId) {
            $query->where('entity_id', $entityId);
        }

        return $query;
    }

    /**
     * Scope: filter by action.
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: filter by actor.
     */
    public function scopeByActor($query, int $actorId)
    {
        return $query->where('actor_id', $actorId);
    }

    /**
     * Scope: filter by date range.
     */
    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('occurred_at', '>=', $from . ' 00:00:00');
        }
        if ($to) {
            $query->where('occurred_at', '<=', $to . ' 23:59:59');
        }
        return $query;
    }

    /**
     * Scope: filter by tenant.
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Get a human-readable action label.
     */
    public function getActionLabelAttribute(): string
    {
        $labels = [
            self::ACTION_CREATED => 'Created',
            self::ACTION_UPDATED => 'Updated',
            self::ACTION_DELETED => 'Deleted',
            self::ACTION_STATUS_CHANGED => 'Status Changed',
            self::ACTION_ASSIGNED => 'Assigned',
            self::ACTION_REVOKED => 'Revoked',
            self::ACTION_SUSPENDED => 'Suspended',
            self::ACTION_REACTIVATED => 'Reactivated',
            self::ACTION_CANCELLED => 'Cancelled',
            self::ACTION_PLAN_CHANGED => 'Plan Changed',
            self::ACTION_TRIAL_EXTENDED => 'Trial Extended',
            self::ACTION_PROVISIONED => 'Provisioned',
            self::ACTION_DOMAIN_ADDED => 'Domain Added',
            self::ACTION_DOMAIN_REMOVED => 'Domain Removed',
            self::ACTION_ROLE_ASSIGNED => 'Role Assigned',
            self::ACTION_ROLE_REMOVED => 'Role Removed',
            self::ACTION_MFA_ENABLED => 'MFA Enabled',
            self::ACTION_MFA_DISABLED => 'MFA Disabled',
            self::ACTION_SESSION_REVOKED => 'Session Revoked',
            self::ACTION_KEY_ROTATED => 'Key Rotated',
            self::ACTION_REFUNDED => 'Refunded',
        ];

        return $labels[$this->action] ?? ucfirst(str_replace('_', ' ', $this->action));
    }

    /**
     * Check if the entry has diff changes.
     */
    public function hasAuditChanges(): bool
    {
        return !empty($this->changes);
    }

    /**
     * Get the number of fields changed.
     */
    public function getChangesCountAttribute(): int
    {
        return is_array($this->changes) ? count($this->changes) : 0;
    }

    /**
     * Verify the integrity of the entry using checksum.
     */
    public function verifyIntegrity(): bool
    {
        if (!$this->checksum) {
            return true; // No checksum to verify
        }

        $computed = $this->computeChecksum();
        return hash_equals($this->checksum, $computed);
    }

    /**
     * Compute checksum for integrity verification.
     */
    public function computeChecksum(): string
    {
        $data = [
            'id' => $this->id,
            'occurred_at' => $this->occurred_at?->toISOString(),
            'actor_type' => $this->actor_type,
            'actor_id' => $this->actor_id,
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'changes' => $this->changes,
        ];

        $sorted = self::sortKeysRecursive($data);

        return hash('sha256', json_encode($sorted));
    }

    /**
     * Recursively sort array keys to ensure stable checksums.
     */
    private static function sortKeysRecursive(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::sortKeysRecursive($value);
            }
        }

        ksort($data);

        return $data;
    }

    /**
     * Get the target entity model if it exists.
     */
    public function getEntity(): ?Model
    {
        $modelMap = [
            self::ENTITY_TENANT => Tenant::class,
            self::ENTITY_SUBSCRIPTION => Subscription::class,
            self::ENTITY_USER => User::class,
            self::ENTITY_PLAN => Plan::class,
            self::ENTITY_ROLE => Role::class,
        ];

        $modelClass = $modelMap[$this->entity_type] ?? null;

        if (!$modelClass) {
            return null;
        }

        return $modelClass::find($this->entity_id);
    }

    /**
     * Get all audit entries for the same entity.
     */
    public function getEntityHistory()
    {
        return static::where('entity_type', $this->entity_type)
            ->where('entity_id', $this->entity_id)
            ->orderBy('occurred_at', 'desc')
            ->get();
    }
}
