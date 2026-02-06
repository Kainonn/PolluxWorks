<?php

namespace App\Models\AI;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * AI Usage Daily
 *
 * El corazón del control de métricas.
 * Solo mide volumen, NO ve contenido.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $date
 * @property int|null $ai_model_id
 * @property int $requests_count
 * @property int $successful_requests
 * @property int $failed_requests
 * @property int $tokens_in
 * @property int $tokens_out
 * @property int $total_tokens
 * @property int $tool_calls_count
 * @property array|null $tools_invoked
 * @property int $total_latency_ms
 * @property int $timeout_count
 * @property int $rate_limit_hits
 * @property float $cost_estimated
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiUsageDaily extends Model
{
    use HasFactory;

    protected $table = 'ai_usage_daily';

    protected $fillable = [
        'tenant_id',
        'date',
        'ai_model_id',
        'requests_count',
        'successful_requests',
        'failed_requests',
        'tokens_in',
        'tokens_out',
        'total_tokens',
        'tool_calls_count',
        'tools_invoked',
        'total_latency_ms',
        'timeout_count',
        'rate_limit_hits',
        'cost_estimated',
        'metadata',
    ];

    protected $casts = [
        'date' => 'date',
        'requests_count' => 'integer',
        'successful_requests' => 'integer',
        'failed_requests' => 'integer',
        'tokens_in' => 'integer',
        'tokens_out' => 'integer',
        'total_tokens' => 'integer',
        'tool_calls_count' => 'integer',
        'tools_invoked' => 'array',
        'total_latency_ms' => 'integer',
        'timeout_count' => 'integer',
        'rate_limit_hits' => 'integer',
        'cost_estimated' => 'decimal:4',
        'metadata' => 'array',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForModel($query, int $modelId)
    {
        return $query->where('ai_model_id', $modelId);
    }

    public function scopeForDate($query, string|Carbon $date)
    {
        return $query->where('date', $date instanceof Carbon ? $date->toDateString() : $date);
    }

    public function scopeForDateRange($query, string|Carbon $from, string|Carbon $to)
    {
        return $query->whereBetween('date', [
            $from instanceof Carbon ? $from->toDateString() : $from,
            $to instanceof Carbon ? $to->toDateString() : $to,
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('date', now()->month)
                     ->whereYear('date', now()->year);
    }

    public function scopeLastDays($query, int $days)
    {
        return $query->where('date', '>=', now()->subDays($days)->toDateString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function model(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'ai_model_id');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors
    // ─────────────────────────────────────────────────────────────────────────

    public function getSuccessRateAttribute(): float
    {
        if ($this->requests_count === 0) {
            return 0.0;
        }

        return ($this->successful_requests / $this->requests_count) * 100;
    }

    public function getAverageLatencyMsAttribute(): float
    {
        if ($this->successful_requests === 0) {
            return 0.0;
        }

        return $this->total_latency_ms / $this->successful_requests;
    }

    public function getFormattedCostAttribute(): string
    {
        return '$' . number_format((float) $this->cost_estimated, 4);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function incrementUsage(
        int $requests = 1,
        int $tokensIn = 0,
        int $tokensOut = 0,
        bool $success = true,
        int $latencyMs = 0,
        ?string $toolKey = null
    ): void {
        $this->increment('requests_count', $requests);
        $this->increment('tokens_in', $tokensIn);
        $this->increment('tokens_out', $tokensOut);
        $this->increment('total_tokens', $tokensIn + $tokensOut);

        if ($success) {
            $this->increment('successful_requests', $requests);
            $this->increment('total_latency_ms', $latencyMs);
        } else {
            $this->increment('failed_requests', $requests);
        }

        if ($toolKey) {
            $this->increment('tool_calls_count');
            $tools = $this->tools_invoked ?? [];
            $tools[$toolKey] = ($tools[$toolKey] ?? 0) + 1;
            $this->tools_invoked = $tools;
            $this->save();
        }
    }

    public static function getOrCreateForToday(int $tenantId, ?int $modelId = null): self
    {
        return self::firstOrCreate([
            'tenant_id' => $tenantId,
            'date' => now()->toDateString(),
            'ai_model_id' => $modelId,
        ]);
    }

    public static function getTenantMonthlyUsage(int $tenantId): array
    {
        $data = self::query()
            ->forTenant($tenantId)
            ->thisMonth()
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(tokens_in) as total_tokens_in,
                SUM(tokens_out) as total_tokens_out,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost,
                SUM(tool_calls_count) as total_tool_calls
            ')
            ->first();

        return [
            'total_requests' => (int) ($data->total_requests ?? 0),
            'successful_requests' => (int) ($data->successful_requests ?? 0),
            'total_tokens_in' => (int) ($data->total_tokens_in ?? 0),
            'total_tokens_out' => (int) ($data->total_tokens_out ?? 0),
            'total_tokens' => (int) ($data->total_tokens ?? 0),
            'total_cost' => (float) ($data->total_cost ?? 0),
            'total_tool_calls' => (int) ($data->total_tool_calls ?? 0),
        ];
    }
}
