<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string|null $app_version
 * @property int|null $uptime_seconds
 * @property int|null $queue_depth
 * @property int|null $active_users
 * @property float|null $error_rate
 * @property float|null $response_time_ms
 * @property array|null $extra_data
 * @property \Illuminate\Support\Carbon $created_at
 * @property-read Tenant $tenant
 */
class TenantHeartbeat extends Model
{
    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'app_version',
        'uptime_seconds',
        'queue_depth',
        'active_users',
        'error_rate',
        'response_time_ms',
        'extra_data',
        'created_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'extra_data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (TenantHeartbeat $heartbeat) {
            $heartbeat->created_at = $heartbeat->created_at ?? now();
        });
    }

    /**
     * Get the tenant this heartbeat belongs to.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
