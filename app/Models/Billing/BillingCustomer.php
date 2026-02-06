<?php

namespace App\Models\Billing;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $provider
 * @property string $provider_customer_id
 * @property string|null $email
 * @property string|null $name
 * @property string|null $phone
 * @property array|null $metadata
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read \Illuminate\Database\Eloquent\Collection|PaymentMethod[] $paymentMethods
 * @property-read \Illuminate\Database\Eloquent\Collection|Payment[] $payments
 * @property-read \Illuminate\Database\Eloquent\Collection|Invoice[] $invoices
 */
class BillingCustomer extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Provider constants
     */
    public const PROVIDER_STRIPE = 'stripe';
    public const PROVIDER_OPENPAY = 'openpay';
    public const PROVIDER_PAYPAL = 'paypal';
    public const PROVIDER_INTERNAL = 'internal';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'provider',
        'provider_customer_id',
        'email',
        'name',
        'phone',
        'metadata',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the tenant that owns this billing customer.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the payment methods for this customer.
     */
    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    /**
     * Get the payments for this customer.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the invoices for this customer.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get the default payment method.
     */
    public function defaultPaymentMethod(): ?PaymentMethod
    {
        return $this->paymentMethods()->where('is_default', true)->first();
    }

    /**
     * Scope a query to filter by provider.
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope a query to only include active customers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get all available providers.
     */
    public static function getProviders(): array
    {
        return [
            self::PROVIDER_STRIPE,
            self::PROVIDER_OPENPAY,
            self::PROVIDER_PAYPAL,
            self::PROVIDER_INTERNAL,
        ];
    }
}
