<?php

namespace App\Models\Billing;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $billing_customer_id
 * @property int|null $payment_method_id
 * @property string $provider
 * @property string|null $provider_payment_id
 * @property string|null $provider_charge_id
 * @property float $amount
 * @property float $amount_refunded
 * @property string $currency
 * @property string $status
 * @property string|null $description
 * @property string|null $reference
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \Illuminate\Support\Carbon|null $failed_at
 * @property \Illuminate\Support\Carbon|null $refunded_at
 * @property string|null $failure_code
 * @property string|null $failure_reason
 * @property int|null $invoice_id
 * @property array|null $metadata
 * @property array|null $provider_response
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read BillingCustomer|null $billingCustomer
 * @property-read PaymentMethod|null $paymentMethod
 * @property-read Invoice|null $invoice
 */
class Payment extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SUCCEEDED = 'succeeded';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_PARTIAL_REFUND = 'partial_refund';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'billing_customer_id',
        'payment_method_id',
        'provider',
        'provider_payment_id',
        'provider_charge_id',
        'amount',
        'amount_refunded',
        'currency',
        'status',
        'description',
        'reference',
        'paid_at',
        'failed_at',
        'refunded_at',
        'failure_code',
        'failure_reason',
        'invoice_id',
        'metadata',
        'provider_response',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'amount_refunded' => 'decimal:2',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'metadata' => 'array',
        'provider_response' => 'array',
    ];

    /**
     * Get the tenant that owns this payment.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the billing customer.
     */
    public function billingCustomer(): BelongsTo
    {
        return $this->belongsTo(BillingCustomer::class);
    }

    /**
     * Get the payment method used.
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Get the associated invoice.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include successful payments.
     */
    public function scopeSucceeded($query)
    {
        return $query->where('status', self::STATUS_SUCCEEDED);
    }

    /**
     * Scope a query to only include failed payments.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope a query to only include pending payments.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope a query to filter by provider.
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Check if the payment was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCEEDED;
    }

    /**
     * Check if the payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if the payment is pending.
     */
    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    /**
     * Check if the payment was refunded.
     */
    public function isRefunded(): bool
    {
        return in_array($this->status, [self::STATUS_REFUNDED, self::STATUS_PARTIAL_REFUND]);
    }

    /**
     * Get the net amount (amount - refunded).
     */
    public function getNetAmountAttribute(): float
    {
        return $this->amount - $this->amount_refunded;
    }

    /**
     * Get formatted amount with currency.
     */
    public function getFormattedAmountAttribute(): string
    {
        return sprintf('%s %s', strtoupper($this->currency), number_format($this->amount, 2));
    }

    /**
     * Get status label for display.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_SUCCEEDED => 'Succeeded',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_REFUNDED => 'Refunded',
            self::STATUS_PARTIAL_REFUND => 'Partial Refund',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get all available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_PROCESSING,
            self::STATUS_SUCCEEDED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
            self::STATUS_REFUNDED,
            self::STATUS_PARTIAL_REFUND,
        ];
    }
}
