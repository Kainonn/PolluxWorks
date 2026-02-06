<?php

namespace App\Models\Billing;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invoice_id
 * @property int $tenant_id
 * @property string $description
 * @property string|null $sku
 * @property int $quantity
 * @property float $unit_price
 * @property float $amount
 * @property float $discount
 * @property float $tax
 * @property string|null $period_start
 * @property string|null $period_end
 * @property string $type
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Invoice $invoice
 * @property-read Tenant $tenant
 */
class InvoiceItem extends Model
{
    use HasFactory;

    /**
     * Type constants
     */
    public const TYPE_SUBSCRIPTION = 'subscription';
    public const TYPE_PRORATION = 'proration';
    public const TYPE_ADDON = 'addon';
    public const TYPE_USAGE = 'usage';
    public const TYPE_FEE = 'fee';
    public const TYPE_CREDIT = 'credit';
    public const TYPE_OTHER = 'other';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'invoice_id',
        'tenant_id',
        'description',
        'sku',
        'quantity',
        'unit_price',
        'amount',
        'discount',
        'tax',
        'period_start',
        'period_end',
        'type',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'metadata' => 'array',
    ];

    /**
     * Get the invoice that this item belongs to.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the tenant that owns this item.
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
     * Get the net amount (amount - discount).
     */
    public function getNetAmountAttribute(): float
    {
        return $this->amount - $this->discount;
    }

    /**
     * Get the total amount (net + tax).
     */
    public function getTotalAmountAttribute(): float
    {
        return $this->net_amount + $this->tax;
    }

    /**
     * Get type label for display.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_SUBSCRIPTION => 'Subscription',
            self::TYPE_PRORATION => 'Proration',
            self::TYPE_ADDON => 'Add-on',
            self::TYPE_USAGE => 'Usage',
            self::TYPE_FEE => 'Fee',
            self::TYPE_CREDIT => 'Credit',
            self::TYPE_OTHER => 'Other',
            default => ucfirst($this->type),
        };
    }

    /**
     * Get all available types.
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_SUBSCRIPTION,
            self::TYPE_PRORATION,
            self::TYPE_ADDON,
            self::TYPE_USAGE,
            self::TYPE_FEE,
            self::TYPE_CREDIT,
            self::TYPE_OTHER,
        ];
    }
}
