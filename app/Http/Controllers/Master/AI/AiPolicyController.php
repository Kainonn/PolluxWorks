<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiPolicy;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AiPolicyController extends Controller
{
    /**
     * Display a listing of AI policies.
     */
    public function index(Request $request)
    {
        $policies = AiPolicy::query()
            ->with(['plan', 'tenant'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('key', 'like', "%{$search}%");
                });
            })
            ->when($request->type && $request->type !== 'all', function ($query) use ($request) {
                $query->where('type', $request->type);
            })
            ->when($request->status !== null && $request->status !== 'all', function ($query) use ($request) {
                $query->where('is_enabled', $request->status === 'enabled');
            })
            ->orderBy('priority')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master/ai/policies/index', [
            'policies' => $policies,
            'filters' => $request->only(['search', 'type', 'status']),
            'types' => AiPolicy::getTypes(),
            'actions' => AiPolicy::getActions(),
        ]);
    }

    /**
     * Show the form for creating a new AI policy.
     */
    public function create()
    {
        $plans = Plan::active()->orderBy('name')->get(['id', 'name']);
        $tenants = Tenant::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('master/ai/policies/create', [
            'plans' => $plans,
            'tenants' => $tenants,
            'types' => AiPolicy::getTypes(),
            'actions' => AiPolicy::getActions(),
        ]);
    }

    /**
     * Store a newly created AI policy.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:ai_policies'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', Rule::in(array_keys(AiPolicy::getTypes()))],
            'config' => ['nullable', 'array'],
            'action' => ['required', Rule::in(array_keys(AiPolicy::getActions()))],
            'error_message' => ['nullable', 'string', 'max:500'],
            'plan_id' => ['nullable', 'exists:plans,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'is_enabled' => ['boolean'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $policy = AiPolicy::create($validated);

        return redirect()->route('master.ai.policies.show', $policy)
            ->with('success', 'AI Policy created successfully.');
    }

    /**
     * Display the specified AI policy.
     */
    public function show(AiPolicy $policy)
    {
        $policy->load(['plan', 'tenant']);

        return Inertia::render('master/ai/policies/show', [
            'policy' => $policy,
            'types' => AiPolicy::getTypes(),
            'actions' => AiPolicy::getActions(),
        ]);
    }

    /**
     * Show the form for editing the specified AI policy.
     */
    public function edit(AiPolicy $policy)
    {
        $plans = Plan::active()->orderBy('name')->get(['id', 'name']);
        $tenants = Tenant::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('master/ai/policies/edit', [
            'policy' => $policy,
            'plans' => $plans,
            'tenants' => $tenants,
            'types' => AiPolicy::getTypes(),
            'actions' => AiPolicy::getActions(),
        ]);
    }

    /**
     * Update the specified AI policy.
     */
    public function update(Request $request, AiPolicy $policy)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', Rule::unique('ai_policies')->ignore($policy->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', Rule::in(array_keys(AiPolicy::getTypes()))],
            'config' => ['nullable', 'array'],
            'action' => ['required', Rule::in(array_keys(AiPolicy::getActions()))],
            'error_message' => ['nullable', 'string', 'max:500'],
            'plan_id' => ['nullable', 'exists:plans,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'is_enabled' => ['boolean'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $policy->update($validated);

        return redirect()->route('master.ai.policies.show', $policy)
            ->with('success', 'AI Policy updated successfully.');
    }

    /**
     * Remove the specified AI policy.
     */
    public function destroy(AiPolicy $policy)
    {
        if ($policy->is_system) {
            return back()->with('error', 'System policies cannot be deleted.');
        }

        $policy->delete();

        return redirect()->route('master.ai.policies.index')
            ->with('success', 'AI Policy deleted successfully.');
    }

    /**
     * Toggle policy enabled status.
     */
    public function toggle(AiPolicy $policy)
    {
        $policy->update(['is_enabled' => !$policy->is_enabled]);

        $status = $policy->is_enabled ? 'enabled' : 'disabled';

        return back()->with('success', "AI Policy {$status} successfully.");
    }
}
