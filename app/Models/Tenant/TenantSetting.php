<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class TenantSetting extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'tenant';

    /**
     * The table associated with the model.
     */
    protected $table = 'settings';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'group',
        'key',
        'value',
        'is_public',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    /**
     * Get a setting value.
     */
    public static function getValue(string $key, mixed $default = null, string $group = 'general'): mixed
    {
        $setting = static::where('group', $group)
            ->where('key', $key)
            ->first();

        if (!$setting) {
            return $default;
        }

        return $setting->value;
    }

    /**
     * Set a setting value.
     */
    public static function setValue(string $key, mixed $value, string $group = 'general', bool $isPublic = false): void
    {
        static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value, 'is_public' => $isPublic]
        );
    }

    /**
     * Get all settings for a group.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get all public settings.
     */
    public static function getPublic(): array
    {
        return static::where('is_public', true)
            ->get()
            ->mapWithKeys(fn($s) => ["{$s->group}.{$s->key}" => $s->value])
            ->toArray();
    }

    /**
     * Set multiple settings at once.
     */
    public static function setMany(array $settings, string $group = 'general'): void
    {
        foreach ($settings as $key => $value) {
            static::setValue($key, $value, $group);
        }
    }
}
