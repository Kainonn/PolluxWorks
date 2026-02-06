<?php

namespace App\Models\Billing;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $billing_customer_id
 * @property int|null $subscription_id
 * @property string|null $provider
 * @property string|null $provider_invoice_id
 * @property string $number
 * @property string|null $series
 * @property float $subtotal
 * @property float $tax
 * @property float $tax_rate
 * @property float $discount
 * @property float $amount_due
 * @property float $amount_paid
 * @property float $amount_remaining
 * @property string $currency
 * @property string $status
 * @property \Illuminate\Support\Carbon|string $invoice_date
 * @property \Illuminate\Support\Carbon|null $due_date
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \Illuminate\Support\Carbon|null $voided_at
 * @property string|null $period_start
 * @property string|null $period_end
 * @property string|null $billing_name
 * @property string|null $billing_email
 * @property string|null $billing_address
 * @property string|null $tax_id
 * @property string|null $pdf_url
 * @property string|null $hosted_url
 * @property string|null $notes
 * @property string|null $footer
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read BillingCustomer|null $billingCustomer
 * @property-read Subscription|null $subscription
 * @property-read \Illuminate\Database\Eloquent\Collection|InvoiceItem[] $items
 * @property-read \Illuminate\Database\Eloquent\Collection|Payment[] $payments
 */
class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_OPEN = 'open';
    public const STATUS_PAID = 'paid';
    public const STATUS_VOID = 'void';
    public const STATUS_UNCOLLECTIBLE = 'uncollectible';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'billing_customer_id',
        'subscription_id',
        'provider',
        'provider_invoice_id',
        'number',
        'series',
        'subtotal',
        'tax',
        'tax_rate',
        'discount',
        'amount_due',
        'amount_paid',
        'amount_remaining',
        'currency',
        'status',
        'invoice_date',
        'due_date',
        'paid_at',
        'voided_at',
        'period_start',
        'period_end',
        'billing_name',
        'billing_email',
        'billing_address',
        'tax_id',
        'pdf_url',
        'hosted_url',
        'notes',
        'footer',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_remaining' => 'decimal:2',
        'invoice_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
        'period_start' => 'date',
        'period_end' => 'date',
        'metadata' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Invoice $invoice) {
            if (empty($invoice->number)) {
                $invoice->number = self::generateInvoiceNumber($invoice->series);
            }
        });
    }

    /**
     * Generate a unique invoice number.
     */
    public static function generateInvoiceNumber(?string $series = null): string
    {
        $prefix = $series ? "{$series}-" : 'INV-';
        $year = now()->format('Y');
        $month = now()->format('m');

        $lastInvoice = self::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderByDesc('id')
            ->first();

        $sequence = $lastInvoice ? ((int) Str::afterLast($lastInvoice->number, '-') + 1) : 1;

        return sprintf('%s%s%s-%04d', $prefix, $year, $month, $sequence);
    }

    /**
     * Get the tenant that owns this invoice.
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
     * Get the subscription.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Get the invoice items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Get the payments for this invoice.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include paid invoices.
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    /**
     * Scope a query to only include open invoices.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    /**
     * Scope a query to only include overdue invoices.
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', self::STATUS_OPEN)
                     ->where('due_date', '<', now());
    }

    /**
     * Check if the invoice is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Check if the invoice is open.
     */
    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    /**
     * Check if the invoice is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OPEN
            && $this->due_date instanceof \Illuminate\Support\Carbon
            && $this->due_date->isPast();
    }

    /**
     * Check if the invoice is voided.
     */
    public function isVoided(): bool
    {
        return $this->status === self::STATUS_VOID;
    }

    /**
     * Get days until due date.
     */
    public function daysUntilDue(): ?int
    {
        if (!$this->due_date) {
            return null;
        }

        return (int) now()->diffInDays($this->due_date, false);
    }

    /**
     * Get formatted amount due.
     */
    public function getFormattedAmountDueAttribute(): string
    {
        return sprintf('%s %s', strtoupper($this->currency), number_format($this->amount_due, 2));
    }

    /**
     * Get status label for display.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_OPEN => 'Open',
            self::STATUS_PAID => 'Paid',
            self::STATUS_VOID => 'Void',
            self::STATUS_UNCOLLECTIBLE => 'Uncollectible',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get all available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_OPEN,
            self::STATUS_PAID,
            self::STATUS_VOID,
            self::STATUS_UNCOLLECTIBLE,
        ];
    }
}
