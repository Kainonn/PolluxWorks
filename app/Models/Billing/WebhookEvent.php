<?php

namespace App\Models\Billing;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $provider
 * @property string|null $provider_event_id
 * @property string $event_type
 * @property int|null $tenant_id
 * @property array $payload
 * @property array|null $headers
 * @property string $status
 * @property string|null $processing_error
 * @property array|null $processing_result
 * @property \Illuminate\Support\Carbon|null $processed_at
 * @property int $retry_count
 * @property \Illuminate\Support\Carbon|null $next_retry_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Tenant|null $tenant
 */
class WebhookEvent extends Model
{
    use HasFactory;

    /**
     * Status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_PROCESSED = 'processed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_IGNORED = 'ignored';

    /**
     * Max retry attempts
     */
    public const MAX_RETRIES = 3;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'provider',
        'provider_event_id',
        'event_type',
        'tenant_id',
        'payload',
        'headers',
        'status',
        'processing_error',
        'processing_result',
        'processed_at',
        'retry_count',
        'next_retry_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'payload' => 'array',
        'headers' => 'array',
        'processing_result' => 'array',
        'processed_at' => 'datetime',
        'next_retry_at' => 'datetime',
        'retry_count' => 'integer',
    ];

    /**
     * Get the tenant related to this webhook event.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include pending events.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope a query to only include failed events.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope a query to filter by provider.
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope a query to only include events ready for retry.
     */
    public function scopeReadyForRetry($query)
    {
        return $query->where('status', self::STATUS_FAILED)
                     ->where('retry_count', '<', self::MAX_RETRIES)
                     ->where(function ($q) {
                         $q->whereNull('next_retry_at')
                           ->orWhere('next_retry_at', '<=', now());
                     });
    }

    /**
     * Check if the event was processed successfully.
     */
    public function isProcessed(): bool
    {
        return $this->status === self::STATUS_PROCESSED;
    }

    /**
     * Check if the event failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if the event is pending.
     */
    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    /**
     * Check if the event can be retried.
     */
    public function canRetry(): bool
    {
        return $this->status === self::STATUS_FAILED && $this->retry_count < self::MAX_RETRIES;
    }

    /**
     * Mark the event as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Mark the event as processed.
     */
    public function markAsProcessed(array $result = []): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSED,
            'processed_at' => now(),
            'processing_result' => $result,
            'processing_error' => null,
        ]);
    }

    /**
     * Mark the event as failed.
     */
    public function markAsFailed(string $error): void
    {
        $nextRetry = $this->retry_count < self::MAX_RETRIES - 1
            ? now()->addMinutes(pow(2, $this->retry_count + 1) * 5)
            : null;

        $this->update([
            'status' => self::STATUS_FAILED,
            'processing_error' => $error,
            'retry_count' => $this->retry_count + 1,
            'next_retry_at' => $nextRetry,
        ]);
    }

    /**
     * Mark the event as ignored.
     */
    public function markAsIgnored(): void
    {
        $this->update([
            'status' => self::STATUS_IGNORED,
            'processed_at' => now(),
        ]);
    }

    /**
     * Get status label for display.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_PROCESSED => 'Processed',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_IGNORED => 'Ignored',
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
            self::STATUS_PROCESSED,
            self::STATUS_FAILED,
            self::STATUS_IGNORED,
        ];
    }
}
