<?php

namespace App\Models\Billing;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $billing_customer_id
 * @property int $tenant_id
 * @property string $provider
 * @property string $provider_payment_method_id
 * @property string $type
 * @property string|null $last4
 * @property string|null $brand
 * @property string|null $bank_name
 * @property string|null $wallet_type
 * @property string|null $exp_month
 * @property string|null $exp_year
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property string|null $holder_name
 * @property bool $is_default
 * @property bool $is_active
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read BillingCustomer $billingCustomer
 * @property-read Tenant $tenant
 */
class PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Type constants
     */
    public const TYPE_CARD = 'card';
    public const TYPE_BANK = 'bank';
    public const TYPE_WALLET = 'wallet';
    public const TYPE_OTHER = 'other';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'billing_customer_id',
        'tenant_id',
        'provider',
        'provider_payment_method_id',
        'type',
        'last4',
        'brand',
        'bank_name',
        'wallet_type',
        'exp_month',
        'exp_year',
        'expires_at',
        'holder_name',
        'is_default',
        'is_active',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Get the billing customer that owns this payment method.
     */
    public function billingCustomer(): BelongsTo
    {
        return $this->belongsTo(BillingCustomer::class);
    }

    /**
     * Get the tenant that owns this payment method.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include default methods.
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope a query to only include active methods.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if the payment method is expired.
     */
    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * Check if the payment method will expire soon.
     */
    public function willExpireSoon(int $days = 30): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->expires_at->between(now(), now()->addDays($days));
    }

    /**
     * Get display name for the payment method.
     */
    public function getDisplayNameAttribute(): string
    {
        return match($this->type) {
            self::TYPE_CARD => sprintf('%s •••• %s', ucfirst($this->brand ?? 'Card'), $this->last4),
            self::TYPE_BANK => sprintf('%s •••• %s', $this->bank_name ?? 'Bank', $this->last4),
            self::TYPE_WALLET => ucfirst($this->wallet_type ?? 'Wallet'),
            default => 'Payment Method',
        };
    }

    /**
     * Get all available types.
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_CARD,
            self::TYPE_BANK,
            self::TYPE_WALLET,
            self::TYPE_OTHER,
        ];
    }
}
