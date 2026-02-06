<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * Platform Notification - Created by Master for all tenants
 *
 * @property int $id
 * @property string $title
 * @property string $body
 * @property string $category (maintenance, release, incident, announcement)
 * @property string $severity (info, warning, critical)
 * @property string|null $cta_label
 * @property string|null $cta_url
 * @property \Illuminate\Support\Carbon|null $starts_at
 * @property \Illuminate\Support\Carbon|null $ends_at
 * @property bool $is_active
 * @property bool $is_sticky
 * @property array|null $targeting
 * @property array|null $channels
 * @property int $views_count
 * @property int $reads_count
 * @property int $clicks_count
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
class PlatformNotification extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Categories
     */
    public const CATEGORY_MAINTENANCE = 'maintenance';
    public const CATEGORY_RELEASE = 'release';
    public const CATEGORY_INCIDENT = 'incident';
    public const CATEGORY_ANNOUNCEMENT = 'announcement';

    /**
     * Severities
     */
    public const SEVERITY_INFO = 'info';
    public const SEVERITY_WARNING = 'warning';
    public const SEVERITY_CRITICAL = 'critical';

    /**
     * Default channel
     */
    public const CHANNEL_IN_APP = 'in_app';
    public const CHANNEL_EMAIL = 'email';

    protected $fillable = [
        'title',
        'body',
        'category',
        'severity',
        'cta_label',
        'cta_url',
        'starts_at',
        'ends_at',
        'is_active',
        'is_sticky',
        'targeting',
        'channels',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
            'is_sticky' => 'boolean',
            'targeting' => 'array',
            'channels' => 'array',
            'views_count' => 'integer',
            'reads_count' => 'integer',
            'clicks_count' => 'integer',
        ];
    }

    /**
     * Boot the model
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (Auth::check() && !$model->created_by) {
                $model->created_by = Auth::id();
            }
            // Default channels if not set
            if (!$model->channels) {
                $model->channels = [self::CHANNEL_IN_APP];
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /**
     * Get the user who created this notification.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this notification.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope: Only active notifications
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Only currently valid (within time window)
     */
    public function scopeCurrentlyValid($query)
    {
        $now = now();

        return $query->where(function ($q) use ($now) {
            $q->whereNull('starts_at')
              ->orWhere('starts_at', '<=', $now);
        })->where(function ($q) use ($now) {
            $q->whereNull('ends_at')
              ->orWhere('ends_at', '>=', $now);
        });
    }

    /**
     * Scope: Filter by category
     */
    public function scopeOfCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Filter by severity
     */
    public function scopeOfSeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope: Notifications that target a specific tenant
     */
    public function scopeForTenant($query, ?int $tenantId = null, ?int $planId = null)
    {
        return $query->where(function ($q) use ($tenantId, $planId) {
            // All tenants (global)
            $q->whereJsonContains('targeting->all', true);

            // Or specifically targeted tenant
            if ($tenantId) {
                $q->orWhereJsonContains('targeting->tenants', $tenantId);
            }

            // Or tenant's plan is targeted
            if ($planId) {
                $q->orWhereJsonContains('targeting->plans', $planId);
            }

            // Or no targeting at all (defaults to all)
            $q->orWhereNull('targeting');
        });
    }

    /**
     * Check if notification is currently active and valid
     */
    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();

        if ($this->starts_at && $this->starts_at->isAfter($now)) {
            return false;
        }

        if ($this->ends_at && $this->ends_at->isBefore($now)) {
            return false;
        }

        return true;
    }

    /**
     * Check if notification targets a specific tenant
     */
    public function targetsEntity(int $tenantId, ?int $planId = null, ?array $userRoles = null): bool
    {
        $targeting = $this->targeting;

        // No targeting = everyone
        if (empty($targeting)) {
            return true;
        }

        // All tenants
        if (!empty($targeting['all']) && $targeting['all'] === true) {
            return true;
        }

        // Specific tenants
        if (!empty($targeting['tenants']) && in_array($tenantId, $targeting['tenants'])) {
            return true;
        }

        // By plan
        if (!empty($targeting['plans']) && $planId && in_array($planId, $targeting['plans'])) {
            return true;
        }

        // By role
        if (!empty($targeting['roles']) && $userRoles) {
            $targetedRoles = $targeting['roles'];
            foreach ($userRoles as $role) {
                if (in_array($role, $targetedRoles)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Increment view count
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment read count
     */
    public function incrementReads(): void
    {
        $this->increment('reads_count');
    }

    /**
     * Increment click count
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks_count');
    }

    /**
     * Get available categories
     */
    public static function categories(): array
    {
        return [
            self::CATEGORY_MAINTENANCE,
            self::CATEGORY_RELEASE,
            self::CATEGORY_INCIDENT,
            self::CATEGORY_ANNOUNCEMENT,
        ];
    }

    /**
     * Get available severities
     */
    public static function severities(): array
    {
        return [
            self::SEVERITY_INFO,
            self::SEVERITY_WARNING,
            self::SEVERITY_CRITICAL,
        ];
    }

    /**
     * Get human-readable category label
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_MAINTENANCE => 'Maintenance',
            self::CATEGORY_RELEASE => 'Release',
            self::CATEGORY_INCIDENT => 'Incident',
            self::CATEGORY_ANNOUNCEMENT => 'Announcement',
            default => ucfirst($this->category),
        };
    }

    /**
     * Get human-readable severity label
     */
    public function getSeverityLabelAttribute(): string
    {
        return match ($this->severity) {
            self::SEVERITY_INFO => 'Info',
            self::SEVERITY_WARNING => 'Warning',
            self::SEVERITY_CRITICAL => 'Critical',
            default => ucfirst($this->severity),
        };
    }
}
