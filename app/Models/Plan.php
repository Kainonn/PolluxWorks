<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property float $price_monthly
 * @property float $price_yearly
 * @property string $currency
 * @property int $max_users
 * @property int $max_modules
 * @property int $max_ai_requests
 * @property int $max_storage_mb
 * @property int $trial_days
 * @property array|null $features
 * @property bool $is_active
 * @property bool $is_featured
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Plan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'currency',
        'max_users',
        'max_modules',
        'max_ai_requests',
        'max_storage_mb',
        'trial_days',
        'features',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'max_users' => 'integer',
        'max_modules' => 'integer',
        'max_ai_requests' => 'integer',
        'max_storage_mb' => 'integer',
        'trial_days' => 'integer',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Plan $plan) {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });

        static::updating(function (Plan $plan) {
            if ($plan->isDirty('name') && !$plan->isDirty('slug')) {
                $plan->slug = Str::slug($plan->name);
            }
        });
    }

    /**
     * Scope a query to only include active plans.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price_monthly');
    }

    /**
     * Check if the plan has unlimited users.
     */
    public function hasUnlimitedUsers(): bool
    {
        return $this->max_users === -1;
    }

    /**
     * Check if the plan has unlimited modules.
     */
    public function hasUnlimitedModules(): bool
    {
        return $this->max_modules === -1;
    }

    /**
     * Check if the plan has unlimited AI requests.
     */
    public function hasUnlimitedAiRequests(): bool
    {
        return $this->max_ai_requests === -1;
    }

    /**
     * Check if the plan has unlimited storage.
     */
    public function hasUnlimitedStorage(): bool
    {
        return $this->max_storage_mb === -1;
    }

    /**
     * Check if the plan has a trial period.
     */
    public function hasTrial(): bool
    {
        return $this->trial_days > 0;
    }

    /**
     * Check if a specific feature is enabled.
     */
    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    /**
     * Get the yearly discount percentage.
     */
    public function getYearlyDiscountPercentage(): float
    {
        if ($this->price_monthly <= 0) {
            return 0;
        }

        $yearlyIfMonthly = $this->price_monthly * 12;
        $discount = (($yearlyIfMonthly - $this->price_yearly) / $yearlyIfMonthly) * 100;

        return round($discount, 0);
    }

    /**
     * Format storage for display.
     */
    public function getFormattedStorage(): string
    {
        if ($this->hasUnlimitedStorage()) {
            return 'Unlimited';
        }

        if ($this->max_storage_mb >= 1024) {
            return round($this->max_storage_mb / 1024, 1) . ' GB';
        }

        return $this->max_storage_mb . ' MB';
    }
}
