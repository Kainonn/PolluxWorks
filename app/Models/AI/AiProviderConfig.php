<?php

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * AI Provider Configs
 *
 * Configuración de proveedores de IA (solo master).
 * Gestiona conexiones a OpenAI, Anthropic, Ollama, etc.
 *
 * @property int $id
 * @property string $provider
 * @property string $name
 * @property bool $is_enabled
 * @property string $status
 * @property string|null $api_endpoint
 * @property string|null $api_key_encrypted
 * @property string|null $api_version
 * @property int|null $rate_limit_rpm
 * @property int|null $rate_limit_tpm
 * @property \Illuminate\Support\Carbon|null $last_health_check
 * @property float|null $avg_latency_ms
 * @property float|null $error_rate
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiProviderConfig extends Model
{
    use HasFactory;

    protected $table = 'ai_provider_configs';

    public const STATUS_OPERATIONAL = 'operational';
    public const STATUS_DEGRADED = 'degraded';
    public const STATUS_DOWN = 'down';
    public const STATUS_MAINTENANCE = 'maintenance';

    protected $fillable = [
        'provider',
        'name',
        'is_enabled',
        'status',
        'api_endpoint',
        'api_key_encrypted',
        'api_version',
        'rate_limit_rpm',
        'rate_limit_tpm',
        'last_health_check',
        'avg_latency_ms',
        'error_rate',
        'metadata',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'rate_limit_rpm' => 'integer',
        'rate_limit_tpm' => 'integer',
        'last_health_check' => 'datetime',
        'avg_latency_ms' => 'decimal:2',
        'error_rate' => 'decimal:2',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'api_key_encrypted',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeOperational($query)
    {
        return $query->where('status', self::STATUS_OPERATIONAL);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_enabled', true)
                     ->whereIn('status', [self::STATUS_OPERATIONAL, self::STATUS_DEGRADED]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors & Mutators
    // ─────────────────────────────────────────────────────────────────────────

    public function setApiKeyAttribute(?string $value): void
    {
        if ($value === null) {
            $this->attributes['api_key_encrypted'] = null;
            return;
        }

        $this->attributes['api_key_encrypted'] = Crypt::encryptString($value);
    }

    public function getApiKeyAttribute(): ?string
    {
        if (empty($this->api_key_encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($this->api_key_encrypted);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getStatusDisplayAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPERATIONAL => 'Operational',
            self::STATUS_DEGRADED => 'Degraded',
            self::STATUS_DOWN => 'Down',
            self::STATUS_MAINTENANCE => 'Maintenance',
            default => ucfirst($this->status),
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPERATIONAL => 'green',
            self::STATUS_DEGRADED => 'yellow',
            self::STATUS_DOWN => 'red',
            self::STATUS_MAINTENANCE => 'blue',
            default => 'gray',
        };
    }

    public function getHasApiKeyAttribute(): bool
    {
        return !empty($this->api_key_encrypted);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function isAvailable(): bool
    {
        return $this->is_enabled && in_array($this->status, [
            self::STATUS_OPERATIONAL,
            self::STATUS_DEGRADED,
        ]);
    }

    public function isHealthy(): bool
    {
        return $this->status === self::STATUS_OPERATIONAL
            && ($this->error_rate === null || $this->error_rate < 5);
    }

    public function updateHealthMetrics(float $latencyMs, bool $success): void
    {
        // Simple moving average calculation
        $currentAvg = $this->avg_latency_ms ?? $latencyMs;
        $this->avg_latency_ms = ($currentAvg * 0.9) + ($latencyMs * 0.1);

        $currentRate = $this->error_rate ?? 0;
        $errorValue = $success ? 0 : 100;
        $this->error_rate = ($currentRate * 0.9) + ($errorValue * 0.1);

        $this->last_health_check = now();
        $this->save();
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_OPERATIONAL => 'Operational',
            self::STATUS_DEGRADED => 'Degraded',
            self::STATUS_DOWN => 'Down',
            self::STATUS_MAINTENANCE => 'Maintenance',
        ];
    }

    public static function getProviderTypes(): array
    {
        return [
            'openai' => 'OpenAI',
            'anthropic' => 'Anthropic',
            'azure_openai' => 'Azure OpenAI',
            'google' => 'Google AI',
            'ollama' => 'Ollama (Local)',
            'custom' => 'Custom Provider',
        ];
    }

    public static function getByProvider(string $provider): ?self
    {
        return self::where('provider', $provider)->first();
    }
}
