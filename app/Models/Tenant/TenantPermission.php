<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class TenantPermission extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'tenant';

    /**
     * The table associated with the model.
     */
    protected $table = 'permissions';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'display_name',
        'group',
        'description',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles()
    {
        return $this->belongsToMany(TenantRole::class, 'role_permissions', 'permission_id', 'role_id');
    }

    /**
     * Scope by group.
     */
    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }
}
