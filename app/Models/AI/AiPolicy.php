<?php

namespace App\Models\AI;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AI Policies & Guardrails
 *
 * Reglas de control sin ver contenido.
 * NO analiza texto, NO guarda prompts.
 *
 * @property int $id
 * @property string $key
 * @property string $name
 * @property string|null $description
 * @property string $type
 * @property array|null $config
 * @property string $action
 * @property string|null $error_message
 * @property int|null $plan_id
 * @property int|null $tenant_id
 * @property bool $is_enabled
 * @property bool $is_system
 * @property int $priority
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiPolicy extends Model
{
    use HasFactory;

    protected $table = 'ai_policies';

    public const TYPE_RATE_LIMIT = 'rate_limit';
    public const TYPE_ACCESS_CONTROL = 'access_control';
    public const TYPE_RESOURCE_LIMIT = 'resource_limit';
    public const TYPE_SECURITY = 'security';
    public const TYPE_COMPLIANCE = 'compliance';

    public const ACTION_BLOCK = 'block';
    public const ACTION_WARN = 'warn';
    public const ACTION_LOG = 'log';
    public const ACTION_THROTTLE = 'throttle';

    protected $fillable = [
        'key',
        'name',
        'description',
        'type',
        'config',
        'action',
        'error_message',
        'plan_id',
        'tenant_id',
        'is_enabled',
        'is_system',
        'priority',
    ];

    protected $casts = [
        'config' => 'array',
        'is_enabled' => 'boolean',
        'is_system' => 'boolean',
        'priority' => 'integer',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
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

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

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

    public function getTypeDisplayAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_RATE_LIMIT => 'Rate Limit',
            self::TYPE_ACCESS_CONTROL => 'Access Control',
            self::TYPE_RESOURCE_LIMIT => 'Resource Limit',
            self::TYPE_SECURITY => 'Security',
            self::TYPE_COMPLIANCE => 'Compliance',
            default => ucfirst($this->type),
        };
    }

    public function getActionDisplayAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_BLOCK => 'Block',
            self::ACTION_WARN => 'Warn',
            self::ACTION_LOG => 'Log',
            self::ACTION_THROTTLE => 'Throttle',
            default => ucfirst($this->action),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function getConfigValue(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    public function shouldBlock(): bool
    {
        return $this->action === self::ACTION_BLOCK;
    }

    public function canDelete(): bool
    {
        return !$this->is_system;
    }

    public static function getTypes(): array
    {
        return [
            self::TYPE_RATE_LIMIT => 'Rate Limit',
            self::TYPE_ACCESS_CONTROL => 'Access Control',
            self::TYPE_RESOURCE_LIMIT => 'Resource Limit',
            self::TYPE_SECURITY => 'Security',
            self::TYPE_COMPLIANCE => 'Compliance',
        ];
    }

    public static function getActions(): array
    {
        return [
            self::ACTION_BLOCK => 'Block',
            self::ACTION_WARN => 'Warn',
            self::ACTION_LOG => 'Log Only',
            self::ACTION_THROTTLE => 'Throttle',
        ];
    }

    public static function getApplicablePolicies(?int $planId = null, ?int $tenantId = null): \Illuminate\Database\Eloquent\Collection
    {
        return self::query()
            ->enabled()
            ->when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->when($planId, fn($q) => $q->forPlan($planId))
            ->ordered()
            ->get();
    }
}
