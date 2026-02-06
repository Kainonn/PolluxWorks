<?php

namespace App\Models\AI;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * AI Model Registry
 *
 * Controla qué modelos de IA existen y cuáles están activos.
 * NO llama al modelo, NO ve prompts.
 *
 * @property int $id
 * @property string $key
 * @property string $name
 * @property string $provider
 * @property string $type
 * @property string $status
 * @property float $cost_per_1k_tokens_in
 * @property float $cost_per_1k_tokens_out
 * @property int $context_window
 * @property int|null $max_output_tokens
 * @property array|null $capabilities
 * @property array|null $regions
 * @property bool $is_default
 * @property int $priority
 * @property string|null $description
 * @property string|null $documentation_url
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiModel extends Model
{
    use HasFactory;

    protected $table = 'ai_models';

    public const TYPE_CHAT = 'chat';
    public const TYPE_EMBEDDINGS = 'embeddings';
    public const TYPE_VISION = 'vision';
    public const TYPE_CODE = 'code';
    public const TYPE_MULTIMODAL = 'multimodal';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_DEPRECATED = 'deprecated';
    public const STATUS_DISABLED = 'disabled';

    public const PROVIDER_OPENAI = 'openai';
    public const PROVIDER_ANTHROPIC = 'anthropic';
    public const PROVIDER_OLLAMA = 'ollama';
    public const PROVIDER_LOCAL = 'local';

    protected $fillable = [
        'key',
        'name',
        'provider',
        'type',
        'status',
        'cost_per_1k_tokens_in',
        'cost_per_1k_tokens_out',
        'context_window',
        'max_output_tokens',
        'capabilities',
        'regions',
        'is_default',
        'priority',
        'description',
        'documentation_url',
        'metadata',
    ];

    protected $casts = [
        'cost_per_1k_tokens_in' => 'decimal:6',
        'cost_per_1k_tokens_out' => 'decimal:6',
        'context_window' => 'integer',
        'max_output_tokens' => 'integer',
        'capabilities' => 'array',
        'regions' => 'array',
        'is_default' => 'boolean',
        'priority' => 'integer',
        'metadata' => 'array',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeByProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority')->orderBy('name');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'ai_plan_models')
            ->withPivot(['max_requests_per_month', 'max_tokens_per_month', 'is_default'])
            ->withTimestamps();
    }

    public function usageDaily(): HasMany
    {
        return $this->hasMany(AiUsageDaily::class, 'ai_model_id');
    }

    public function fallbackRulesAsPrimary(): HasMany
    {
        return $this->hasMany(AiFallbackRule::class, 'primary_model_id');
    }

    public function fallbackRulesAsFallback(): HasMany
    {
        return $this->hasMany(AiFallbackRule::class, 'fallback_model_id');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors
    // ─────────────────────────────────────────────────────────────────────────

    public function getCostPerRequestAttribute(): float
    {
        // Estimate average cost per request (assuming ~1k tokens avg)
        return (float) $this->cost_per_1k_tokens_in + (float) $this->cost_per_1k_tokens_out;
    }

    public function getDisplayStatusAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_DEPRECATED => 'Deprecated',
            self::STATUS_DISABLED => 'Disabled',
            default => ucfirst($this->status),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function hasCapability(string $capability): bool
    {
        return isset($this->capabilities[$capability]) && $this->capabilities[$capability] === true;
    }

    public function isAvailableInRegion(string $region): bool
    {
        if (empty($this->regions)) {
            return true; // No restrictions = available everywhere
        }

        return in_array($region, $this->regions, true);
    }

    public function calculateCost(int $tokensIn, int $tokensOut): float
    {
        return (($tokensIn / 1000) * (float) $this->cost_per_1k_tokens_in)
             + (($tokensOut / 1000) * (float) $this->cost_per_1k_tokens_out);
    }

    public static function getTypes(): array
    {
        return [
            self::TYPE_CHAT => 'Chat',
            self::TYPE_EMBEDDINGS => 'Embeddings',
            self::TYPE_VISION => 'Vision',
            self::TYPE_CODE => 'Code',
            self::TYPE_MULTIMODAL => 'Multimodal',
        ];
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_DEPRECATED => 'Deprecated',
            self::STATUS_DISABLED => 'Disabled',
        ];
    }

    public static function getProviders(): array
    {
        return [
            self::PROVIDER_OPENAI => 'OpenAI',
            self::PROVIDER_ANTHROPIC => 'Anthropic',
            self::PROVIDER_OLLAMA => 'Ollama',
            self::PROVIDER_LOCAL => 'Local',
        ];
    }
}
