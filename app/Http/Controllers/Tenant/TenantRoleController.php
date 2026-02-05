<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantPermission;
use App\Models\Tenant\TenantRole;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TenantRoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $roles = TenantRole::query()
            ->withCount(['users', 'permissions'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('display_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        return Inertia::render('tenant/roles/index', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'roles' => $roles,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $tenant = app('tenant');

        $permissions = TenantPermission::select('id', 'name', 'display_name', 'group')
            ->orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');

        return Inertia::render('tenant/roles/create', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('tenant.roles', 'name')],
            'display_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:tenant.permissions,id'],
        ]);

        $role = TenantRole::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return redirect()->route('tenant.roles.index')
            ->with('success', 'Role created successfully.');
    }

    /**
     * Display the specified role.
     */
    public function show(int $id)
    {
        $tenant = app('tenant');
        $role = TenantRole::with(['permissions', 'users:id,name,email'])
            ->withCount('users')
            ->findOrFail($id);

        return Inertia::render('tenant/roles/show', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(int $id)
    {
        $tenant = app('tenant');
        $role = TenantRole::with('permissions:id')->findOrFail($id);

        // Prevent editing system roles
        if ($role->is_system) {
            return redirect()->route('tenant.roles.index')
                ->with('error', 'System roles cannot be edited.');
        }

        $permissions = TenantPermission::select('id', 'name', 'display_name', 'group')
            ->orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');

        return Inertia::render('tenant/roles/edit', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'role' => $role,
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, int $id)
    {
        $role = TenantRole::findOrFail($id);

        // Prevent editing system roles
        if ($role->is_system) {
            return back()->with('error', 'System roles cannot be edited.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('tenant.roles', 'name')->ignore($id)],
            'display_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:tenant.permissions,id'],
        ]);

        $role->update([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return redirect()->route('tenant.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(int $id)
    {
        $role = TenantRole::withCount('users')->findOrFail($id);

        // Prevent deleting system roles
        if ($role->is_system) {
            return back()->with('error', 'System roles cannot be deleted.');
        }

        // Prevent deleting roles with users
        if ($role->users_count > 0) {
            return back()->with('error', 'Cannot delete role with assigned users.');
        }

        $role->delete();

        return redirect()->route('tenant.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * Duplicate a role.
     */
    public function duplicate(int $id)
    {
        $sourceRole = TenantRole::with('permissions:id')->findOrFail($id);

        $newRole = TenantRole::create([
            'name' => $sourceRole->name . '_copy',
            'display_name' => $sourceRole->display_name . ' (Copy)',
            'description' => $sourceRole->description,
            'is_system' => false,
        ]);

        $newRole->permissions()->sync($sourceRole->permissions->pluck('id'));

        return redirect()->route('tenant.roles.edit', $newRole->id)
            ->with('success', 'Role duplicated successfully.');
    }
}
