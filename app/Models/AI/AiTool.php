<?php

namespace App\Models\AI;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * AI Tools Registry
 *
 * Catálogo de tools disponibles para la IA.
 * NO ejecuta la tool, NO ve payloads.
 *
 * @property int $id
 * @property string $key
 * @property string $name
 * @property string|null $description
 * @property string $type
 * @property string $risk_level
 * @property array|null $required_roles
 * @property array|null $required_permissions
 * @property bool $is_enabled
 * @property bool $is_beta
 * @property array|null $parameters_schema
 * @property array|null $response_schema
 * @property string|null $category
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiTool extends Model
{
    use HasFactory;

    protected $table = 'ai_tools';

    public const TYPE_READ = 'read';
    public const TYPE_WRITE = 'write';
    public const TYPE_ACTION = 'action';

    public const RISK_LOW = 'low';
    public const RISK_MEDIUM = 'medium';
    public const RISK_HIGH = 'high';
    public const RISK_CRITICAL = 'critical';

    protected $fillable = [
        'key',
        'name',
        'description',
        'type',
        'risk_level',
        'required_roles',
        'required_permissions',
        'is_enabled',
        'is_beta',
        'parameters_schema',
        'response_schema',
        'category',
        'metadata',
    ];

    protected $casts = [
        'required_roles' => 'array',
        'required_permissions' => 'array',
        'is_enabled' => 'boolean',
        'is_beta' => 'boolean',
        'parameters_schema' => 'array',
        'response_schema' => 'array',
        'metadata' => 'array',
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

    public function scopeByRisk($query, string $riskLevel)
    {
        return $query->where('risk_level', $riskLevel);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeStable($query)
    {
        return $query->where('is_beta', false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────────────────

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'ai_plan_tools')
            ->withPivot(['max_calls_per_day', 'max_calls_per_request'])
            ->withTimestamps();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessors
    // ─────────────────────────────────────────────────────────────────────────

    public function getDisplayRiskAttribute(): string
    {
        return match ($this->risk_level) {
            self::RISK_LOW => 'Low',
            self::RISK_MEDIUM => 'Medium',
            self::RISK_HIGH => 'High',
            self::RISK_CRITICAL => 'Critical',
            default => ucfirst($this->risk_level),
        };
    }

    public function getRiskColorAttribute(): string
    {
        return match ($this->risk_level) {
            self::RISK_LOW => 'green',
            self::RISK_MEDIUM => 'yellow',
            self::RISK_HIGH => 'orange',
            self::RISK_CRITICAL => 'red',
            default => 'gray',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public function requiresRole(string $role): bool
    {
        if (empty($this->required_roles)) {
            return false;
        }

        return in_array($role, $this->required_roles, true);
    }

    public function requiresPermission(string $permission): bool
    {
        if (empty($this->required_permissions)) {
            return false;
        }

        return in_array($permission, $this->required_permissions, true);
    }

    public function isHighRisk(): bool
    {
        return in_array($this->risk_level, [self::RISK_HIGH, self::RISK_CRITICAL], true);
    }

    public static function getTypes(): array
    {
        return [
            self::TYPE_READ => 'Read',
            self::TYPE_WRITE => 'Write',
            self::TYPE_ACTION => 'Action',
        ];
    }

    public static function getRiskLevels(): array
    {
        return [
            self::RISK_LOW => 'Low',
            self::RISK_MEDIUM => 'Medium',
            self::RISK_HIGH => 'High',
            self::RISK_CRITICAL => 'Critical',
        ];
    }

    public static function getCategories(): array
    {
        return [
            'quotes' => 'Quotes',
            'clients' => 'Clients',
            'analytics' => 'Analytics',
            'inventory' => 'Inventory',
            'billing' => 'Billing',
            'reporting' => 'Reporting',
            'system' => 'System',
            'utility' => 'Utility',
        ];
    }

    public static function getAccessLevels(): array
    {
        return [
            'all' => 'All Users',
            'authenticated' => 'Authenticated Users',
            'admin' => 'Administrators Only',
            'superadmin' => 'Super Administrators Only',
        ];
    }

    public static function getAuditLevels(): array
    {
        return [
            'none' => 'None',
            'basic' => 'Basic',
            'detailed' => 'Detailed',
            'full' => 'Full',
        ];
    }
}
