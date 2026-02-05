<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantRole;
use App\Models\Tenant\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class TenantUserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $users = TenantUser::query()
            ->with('roles:id,name,display_name')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('roles', fn($q) => $q->where('name', $role));
            })
            ->when($request->has('active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('active'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        $roles = TenantRole::select('id', 'name', 'display_name')->get();

        return Inertia::render('tenant/users/index', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role', 'active', 'per_page']),
            'limits' => [
                'seats_used' => $tenant->seats_used,
                'seats_limit' => $tenant->effective_seats_limit,
                'can_create' => $tenant->effective_seats_limit === -1 || $tenant->seats_used < $tenant->effective_seats_limit,
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $tenant = app('tenant');

        // Check seat limit
        if ($tenant->effective_seats_limit !== -1 && $tenant->seats_used >= $tenant->effective_seats_limit) {
            return redirect()->route('tenant.users.index')
                ->with('error', 'You have reached your user limit. Please upgrade your plan.');
        }

        $roles = TenantRole::select('id', 'name', 'display_name')->get();

        return Inertia::render('tenant/users/create', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        // Check seat limit
        if ($tenant->effective_seats_limit !== -1 && $tenant->seats_used >= $tenant->effective_seats_limit) {
            return back()->with('error', 'You have reached your user limit.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tenant.users', 'email')],
            'password' => ['required', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'roles' => ['array'],
            'roles.*' => ['exists:tenant.roles,id'],
            'send_invite' => ['boolean'],
        ]);

        $user = TenantUser::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'department' => $validated['department'] ?? null,
            'is_active' => true,
            'email_verified_at' => now(), // Auto-verify for now
        ]);

        if (!empty($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        // Update tenant seat count
        $tenant->increment('seats_used');

        // TODO: Send invite email if requested
        if ($request->boolean('send_invite')) {
            // Mail::to($user)->send(new WelcomeEmail($user, $validated['password']));
        }

        return redirect()->route('tenant.users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Display the specified user.
     */
    public function show(int $id)
    {
        $tenant = app('tenant');
        $user = TenantUser::with('roles.permissions')->findOrFail($id);

        return Inertia::render('tenant/users/show', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(int $id)
    {
        $tenant = app('tenant');
        $user = TenantUser::with('roles:id')->findOrFail($id);
        $roles = TenantRole::select('id', 'name', 'display_name')->get();

        return Inertia::render('tenant/users/edit', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, int $id)
    {
        $user = TenantUser::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tenant.users', 'email')->ignore($id)],
            'password' => ['nullable', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'roles' => ['array'],
            'roles.*' => ['exists:tenant.roles,id'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'department' => $validated['department'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        if (isset($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        return redirect()->route('tenant.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(int $id)
    {
        $tenant = app('tenant');
        $user = TenantUser::findOrFail($id);

        // Prevent deleting self
        if ($user->id === auth('tenant')->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        // Update tenant seat count
        $tenant->decrement('seats_used');

        return redirect()->route('tenant.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(int $id)
    {
        $user = TenantUser::findOrFail($id);

        // Prevent deactivating self
        if ($user->id === auth('tenant')->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', $user->is_active ? 'User activated.' : 'User deactivated.');
    }
}
