<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $status
 * @property int $plan_id
 * @property \Illuminate\Support\Carbon|null $trial_ends_at
 * @property \Illuminate\Support\Carbon|null $next_billing_at
 * @property string|null $primary_domain
 * @property array|null $custom_domains
 * @property array|null $domain_status
 * @property string $provisioning_status
 * @property string|null $provisioning_error
 * @property \Illuminate\Support\Carbon|null $provisioned_at
 * @property string|null $db_name
 * @property string|null $db_host
 * @property string|null $db_port
 * @property string|null $db_username
 * @property string|null $db_password
 * @property \Illuminate\Support\Carbon|null $last_heartbeat_at
 * @property string|null $app_version
 * @property array|null $health_data
 * @property int|null $seats_limit
 * @property int|null $storage_limit_mb
 * @property int|null $ai_requests_limit
 * @property int $seats_used
 * @property int $storage_used_mb
 * @property int $ai_requests_used_month
 * @property array|null $enabled_modules
 * @property string $timezone
 * @property string $locale
 * @property string|null $region
 * @property string|null $industry_type
 * @property \Illuminate\Support\Carbon|null $suspended_at
 * @property string|null $suspended_reason
 * @property int|null $suspended_by
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property string|null $cancelled_reason
 * @property int|null $cancelled_by
 * @property int|null $admin_user_id
 * @property int|null $created_by
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Plan $plan
 * @property-read User|null $creator
 * @property-read User|null $suspendedByUser
 * @property-read User|null $cancelledByUser
 * @property-read \Illuminate\Database\Eloquent\Collection|TenantActivityLog[] $activityLogs
 * @property-read \Illuminate\Database\Eloquent\Collection|TenantHeartbeat[] $heartbeats
 * @property-read \Illuminate\Database\Eloquent\Collection|TenantApiToken[] $apiTokens
 */
class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    public const STATUS_TRIAL = 'trial';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Provisioning status constants
     */
    public const PROVISIONING_PENDING = 'pending';
    public const PROVISIONING_RUNNING = 'running';
    public const PROVISIONING_READY = 'ready';
    public const PROVISIONING_FAILED = 'failed';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'status',
        'plan_id',
        'trial_ends_at',
        'next_billing_at',
        'primary_domain',
        'custom_domains',
        'domain_status',
        'provisioning_status',
        'provisioning_error',
        'provisioned_at',
        'db_name',
        'db_host',
        'db_port',
        'db_username',
        'db_password',
        'last_heartbeat_at',
        'app_version',
        'health_data',
        'seats_limit',
        'storage_limit_mb',
        'ai_requests_limit',
        'seats_used',
        'storage_used_mb',
        'ai_requests_used_month',
        'enabled_modules',
        'timezone',
        'locale',
        'region',
        'industry_type',
        'suspended_at',
        'suspended_reason',
        'suspended_by',
        'cancelled_at',
        'cancelled_reason',
        'cancelled_by',
        'admin_user_id',
        'created_by',
        'metadata',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'db_password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'next_billing_at' => 'datetime',
            'provisioned_at' => 'datetime',
            'last_heartbeat_at' => 'datetime',
            'suspended_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'custom_domains' => 'array',
            'domain_status' => 'array',
            'health_data' => 'array',
            'enabled_modules' => 'array',
            'metadata' => 'array',
            'db_password' => 'encrypted',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Tenant $tenant) {
            if (empty($tenant->slug)) {
                $tenant->slug = Str::slug($tenant->name);
            }
        });
    }

    // ==========================================
    // Relationships
    // ==========================================

    /**
     * Get the plan associated with the tenant.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Get the user who created this tenant.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who suspended this tenant.
     */
    public function suspendedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by');
    }

    /**
     * Get the user who cancelled this tenant.
     */
    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Get the activity logs for the tenant.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(TenantActivityLog::class);
    }

    /**
     * Get the heartbeats for the tenant.
     */
    public function heartbeats(): HasMany
    {
        return $this->hasMany(TenantHeartbeat::class);
    }

    /**
     * Get the API tokens for the tenant.
     */
    public function apiTokens(): HasMany
    {
        return $this->hasMany(TenantApiToken::class);
    }

    // ==========================================
    // Accessors & Computed Properties
    // ==========================================

    /**
     * Get the full subdomain URL.
     */
    public function getSubdomainUrlAttribute(): string
    {
        $baseDomain = config('app.tenant_domain', 'polluxworks.com');
        return "https://{$this->slug}.{$baseDomain}";
    }

    /**
     * Get all domains for this tenant.
     */
    public function getAllDomainsAttribute(): array
    {
        $domains = ["{$this->slug}." . config('app.tenant_domain', 'polluxworks.com')];

        if ($this->primary_domain) {
            $domains[] = $this->primary_domain;
        }

        if ($this->custom_domains) {
            $domains = array_merge($domains, $this->custom_domains);
        }

        return array_unique($domains);
    }

    /**
     * Check if tenant is online (heartbeat within last 5 minutes).
     */
    public function getIsOnlineAttribute(): bool
    {
        if (!$this->last_heartbeat_at) {
            return false;
        }

        return $this->last_heartbeat_at->isAfter(now()->subMinutes(5));
    }

    /**
     * Check if trial has expired.
     */
    public function getIsTrialExpiredAttribute(): bool
    {
        if ($this->status !== self::STATUS_TRIAL || !$this->trial_ends_at) {
            return false;
        }

        return $this->trial_ends_at->isPast();
    }

    /**
     * Get days remaining in trial.
     */
    public function getTrialDaysRemainingAttribute(): ?int
    {
        if ($this->status !== self::STATUS_TRIAL || !$this->trial_ends_at) {
            return null;
        }

        $days = now()->diffInDays($this->trial_ends_at, false);
        return max(0, $days);
    }

    /**
     * Get the effective seats limit (tenant override or plan default).
     */
    public function getEffectiveSeatsLimitAttribute(): int
    {
        return $this->seats_limit ?? $this->plan?->max_users ?? 1;
    }

    /**
     * Get the effective storage limit (tenant override or plan default).
     */
    public function getEffectiveStorageLimitAttribute(): int
    {
        return $this->storage_limit_mb ?? $this->plan?->max_storage_mb ?? 100;
    }

    /**
     * Get the effective AI requests limit (tenant override or plan default).
     */
    public function getEffectiveAiLimitAttribute(): int
    {
        return $this->ai_requests_limit ?? $this->plan?->max_ai_requests ?? 0;
    }

    /**
     * Get seats usage percentage.
     */
    public function getSeatsUsagePercentAttribute(): float
    {
        $limit = $this->effective_seats_limit;
        if ($limit <= 0 || $limit === -1) {
            return 0;
        }
        return min(100, ($this->seats_used / $limit) * 100);
    }

    /**
     * Get storage usage percentage.
     */
    public function getStorageUsagePercentAttribute(): float
    {
        $limit = $this->effective_storage_limit;
        if ($limit <= 0 || $limit === -1) {
            return 0;
        }
        return min(100, ($this->storage_used_mb / $limit) * 100);
    }

    // ==========================================
    // Query Scopes
    // ==========================================

    /**
     * Scope to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter active tenants.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to filter by plan.
     */
    public function scopeWithPlan($query, int $planId)
    {
        return $query->where('plan_id', $planId);
    }

    /**
     * Scope to filter by provisioning status.
     */
    public function scopeProvisioned($query)
    {
        return $query->where('provisioning_status', self::PROVISIONING_READY);
    }

    /**
     * Scope to filter online tenants.
     */
    public function scopeOnline($query)
    {
        return $query->where('last_heartbeat_at', '>=', now()->subMinutes(5));
    }

    /**
     * Scope to filter offline tenants.
     */
    public function scopeOffline($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('last_heartbeat_at')
              ->orWhere('last_heartbeat_at', '<', now()->subMinutes(5));
        });
    }

    // ==========================================
    // Actions
    // ==========================================

    /**
     * Suspend the tenant.
     */
    public function suspend(string $reason, ?User $by = null): void
    {
        $this->update([
            'status' => self::STATUS_SUSPENDED,
            'suspended_at' => now(),
            'suspended_reason' => $reason,
            'suspended_by' => $by?->id,
        ]);
    }

    /**
     * Reactivate the tenant.
     */
    public function reactivate(): void
    {
        $previousStatus = $this->trial_ends_at && $this->trial_ends_at->isFuture()
            ? self::STATUS_TRIAL
            : self::STATUS_ACTIVE;

        $this->update([
            'status' => $previousStatus,
            'suspended_at' => null,
            'suspended_reason' => null,
            'suspended_by' => null,
        ]);
    }

    /**
     * Cancel the tenant.
     */
    public function cancel(string $reason, ?User $by = null): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancelled_reason' => $reason,
            'cancelled_by' => $by?->id,
        ]);
    }

    /**
     * Update heartbeat data.
     */
    public function recordHeartbeat(array $data): void
    {
        $this->update([
            'last_heartbeat_at' => now(),
            'app_version' => $data['app_version'] ?? $this->app_version,
            'health_data' => array_merge($this->health_data ?? [], $data),
        ]);
    }

    /**
     * Log an activity.
     */
    public function logActivity(string $action, ?string $description = null, array $oldValues = [], array $newValues = [], ?User $user = null): TenantActivityLog
    {
        return $this->activityLogs()->create([
            'user_id' => $user?->id ?? Auth::id(),
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Generate a new API token.
     */
    public function createApiToken(string $name, array $abilities = ['*'], ?\DateTimeInterface $expiresAt = null): TenantApiToken
    {
        return $this->apiTokens()->create([
            'name' => $name,
            'token' => Str::random(64),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
        ]);
    }
}
