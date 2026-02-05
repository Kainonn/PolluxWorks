<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class TenantRole extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'tenant';

    /**
     * The table associated with the model.
     */
    protected $table = 'roles';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'is_system',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    /**
     * Get the users that belong to the role.
     */
    public function users()
    {
        return $this->belongsToMany(TenantUser::class, 'user_roles', 'role_id', 'user_id');
    }

    /**
     * Get the permissions for the role.
     */
    public function permissions()
    {
        return $this->belongsToMany(TenantPermission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('name', $permission)->exists();
    }

    /**
     * Assign permission to role.
     */
    public function givePermission(string $permission): void
    {
        $perm = TenantPermission::firstOrCreate(['name' => $permission]);
        $this->permissions()->syncWithoutDetaching([$perm->id]);
    }

    /**
     * Remove permission from role.
     */
    public function revokePermission(string $permission): void
    {
        $perm = TenantPermission::where('name', $permission)->first();
        if ($perm) {
            $this->permissions()->detach($perm->id);
        }
    }

    /**
     * Sync permissions for role.
     */
    public function syncPermissions(array $permissions): void
    {
        $permIds = TenantPermission::whereIn('name', $permissions)->pluck('id');
        $this->permissions()->sync($permIds);
    }

    /**
     * Scope for non-system roles.
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope for system roles.
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }
}
