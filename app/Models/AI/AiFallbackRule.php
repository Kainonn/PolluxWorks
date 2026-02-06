<?php

namespace App\Models\AI;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AI Fallback Rules
 *
 * Cuando algo falla, la IA no se cae.
 * Define reglas de fallback entre modelos.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $primary_model_id
 * @property int $fallback_model_id
 * @property array|null $trigger_on
 * @property int|null $timeout_threshold_ms
 * @property int|null $error_rate_threshold
 * @property int $retry_count
 * @property int $retry_delay_ms
 * @property bool $preserve_context
 * @property int|null $plan_id
 * @property int|null $tenant_id
 * @property bool $is_enabled
 * @property int $priority
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiFallbackRule extends Model
{
    use HasFactory;

    protected $table = 'ai_fallback_rules';

    public const TRIGGER_TIMEOUT = 'timeout';
    public const TRIGGER_RATE_LIMIT = 'rate_limit';
    public const TRIGGER_ERROR_5XX = 'error_5xx';
    public const TRIGGER_MODEL_UNAVAILABLE = 'model_unavailable';
    public const TRIGGER_QUOTA_EXCEEDED = 'quota_exceeded';

    protected $fillable = [
        'name',
        'description',
        'primary_model_id',
        'fallback_model_id',
        'trigger_on',
        'timeout_threshold_ms',
        'error_rate_threshold',
        'retry_count',
        'retry_delay_ms',
        'preserve_context',
        'plan_id',
        'tenant_id',
        'is_enabled',
        'priority',
    ];

    protected $casts = [
        'trigger_on' => 'array',
        'timeout_threshold_ms' => 'integer',
        'error_rate_threshold' => 'integer',
        'retry_count' => 'integer',
        'retry_delay_ms' => 'integer',
        'preserve_context' => 'boolean',
        'is_enabled' => 'boolean',
        'priority' => 'integer',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeGlobal($query)
    {
        return $query->whereNull('plan_id')->whereNull('tenant_id');
    }

    public function scopeForPlan($query, int $planId)
    {
        return $query->where(function ($q) use ($planId) {
            $q->where('plan_id', $planId)
              ->orWhereNull('plan_id');
        });
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)
              ->orWhereNull('tenant_id');
        });
    }

    public function scopeForPrimaryModel($query, int $modelId)
    {
        return $query->where('primary_model_id', $modelId);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

    public function primaryModel(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'primary_model_id');
    }

    public function fallbackModel(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'fallback_model_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors
    // ─────────────────────────────────────────────────────────────────────────

    public function getScopeDisplayAttribute(): string
    {
        if ($this->tenant_id) {
            return 'Tenant #' . $this->tenant_id;
        }

        if ($this->plan_id) {
            return 'Plan: ' . ($this->plan?->name ?? '#' . $this->plan_id);
        }

        return 'Global';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function shouldTrigger(string $event): bool
    {
        if (empty($this->trigger_on)) {
            return true; // Trigger on any event if no specific triggers
        }

        return in_array($event, $this->trigger_on, true);
    }

    public function shouldTriggerOnTimeout(int $latencyMs): bool
    {
        if (!$this->shouldTrigger(self::TRIGGER_TIMEOUT)) {
            return false;
        }

        if (!$this->timeout_threshold_ms) {
            return false;
        }

        return $latencyMs >= $this->timeout_threshold_ms;
    }

    public function shouldTriggerOnErrorRate(float $errorRate): bool
    {
        if (!$this->error_rate_threshold) {
            return false;
        }

        return $errorRate >= $this->error_rate_threshold;
    }

    public static function findApplicableRule(
        int $primaryModelId,
        ?int $planId = null,
        ?int $tenantId = null
    ): ?self {
        return self::query()
            ->enabled()
            ->forPrimaryModel($primaryModelId)
            ->when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->when($planId, fn($q) => $q->forPlan($planId))
            ->ordered()
            ->first();
    }

    public static function getTriggerTypes(): array
    {
        return [
            self::TRIGGER_TIMEOUT => 'Timeout',
            self::TRIGGER_RATE_LIMIT => 'Rate Limit',
            self::TRIGGER_ERROR_5XX => 'Server Error (5xx)',
            self::TRIGGER_MODEL_UNAVAILABLE => 'Model Unavailable',
            self::TRIGGER_QUOTA_EXCEEDED => 'Quota Exceeded',
        ];
    }
}
