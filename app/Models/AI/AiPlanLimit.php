<?php

namespace App\Models\AI;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AI Plan Limits
 *
 * Define cuánta IA puede usar cada plan.
 * Subscriptions consulta esto, no lo decide.
 *
 * @property int $id
 * @property int $plan_id
 * @property int $max_requests_per_month
 * @property int|null $max_requests_per_day
 * @property int|null $max_requests_per_hour
 * @property int $max_tokens_per_month
 * @property int $max_tokens_per_request
 * @property int|null $max_input_tokens_per_request
 * @property int|null $max_output_tokens_per_request
 * @property int $max_tool_calls_per_request
 * @property int $queue_priority
 * @property bool $allow_overage
 * @property float|null $overage_cost_per_1k_tokens
 * @property float|null $overage_cost_per_request
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiPlanLimit extends Model
{
    use HasFactory;

    protected $table = 'ai_plan_limits';

    protected $fillable = [
        'plan_id',
        'max_requests_per_month',
        'max_requests_per_day',
        'max_requests_per_hour',
        'max_tokens_per_month',
        'max_tokens_per_request',
        'max_input_tokens_per_request',
        'max_output_tokens_per_request',
        'max_tool_calls_per_request',
        'queue_priority',
        'allow_overage',
        'overage_cost_per_1k_tokens',
        'overage_cost_per_request',
        'metadata',
    ];

    protected $casts = [
        'max_requests_per_month' => 'integer',
        'max_requests_per_day' => 'integer',
        'max_requests_per_hour' => 'integer',
        'max_tokens_per_month' => 'integer',
        'max_tokens_per_request' => 'integer',
        'max_input_tokens_per_request' => 'integer',
        'max_output_tokens_per_request' => 'integer',
        'max_tool_calls_per_request' => 'integer',
        'queue_priority' => 'integer',
        'allow_overage' => 'boolean',
        'overage_cost_per_1k_tokens' => 'decimal:4',
        'overage_cost_per_request' => 'decimal:4',
        'metadata' => 'array',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors
    // ─────────────────────────────────────────────────────────────────────────

    public function getIsUnlimitedRequestsAttribute(): bool
    {
        return $this->max_requests_per_month === -1;
    }

    public function getIsUnlimitedTokensAttribute(): bool
    {
        return $this->max_tokens_per_month === -1;
    }

    public function getFormattedRequestsLimitAttribute(): string
    {
        if ($this->is_unlimited_requests) {
            return 'Unlimited';
        }

        return number_format($this->max_requests_per_month);
    }

    public function getFormattedTokensLimitAttribute(): string
    {
        if ($this->is_unlimited_tokens) {
            return 'Unlimited';
        }

        if ($this->max_tokens_per_month >= 1000000) {
            return number_format($this->max_tokens_per_month / 1000000, 1) . 'M';
        }

        if ($this->max_tokens_per_month >= 1000) {
            return number_format($this->max_tokens_per_month / 1000) . 'K';
        }

        return number_format($this->max_tokens_per_month);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function isWithinRequestLimit(int $currentRequests): bool
    {
        if ($this->is_unlimited_requests) {
            return true;
        }

        return $currentRequests < $this->max_requests_per_month;
    }

    public function isWithinTokenLimit(int $currentTokens): bool
    {
        if ($this->is_unlimited_tokens) {
            return true;
        }

        return $currentTokens < $this->max_tokens_per_month;
    }

    public function canProcessRequest(int $currentRequests, int $currentTokens, int $estimatedTokens): bool
    {
        if (!$this->isWithinRequestLimit($currentRequests)) {
            return $this->allow_overage;
        }

        if (!$this->isWithinTokenLimit($currentTokens + $estimatedTokens)) {
            return $this->allow_overage;
        }

        return true;
    }

    public function calculateOverageCost(int $extraRequests, int $extraTokens): float
    {
        $cost = 0.0;

        if ($extraRequests > 0 && $this->overage_cost_per_request) {
            $cost += $extraRequests * (float) $this->overage_cost_per_request;
        }

        if ($extraTokens > 0 && $this->overage_cost_per_1k_tokens) {
            $cost += ($extraTokens / 1000) * (float) $this->overage_cost_per_1k_tokens;
        }

        return $cost;
    }
}
