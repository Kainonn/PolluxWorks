<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiFallbackRule;
use App\Models\AI\AiModel;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AiFallbackRuleController extends Controller
{
    /**
     * Display a listing of fallback rules.
     */
    public function index(Request $request)
    {
        $rules = AiFallbackRule::query()
            ->with(['primaryModel', 'fallbackModel', 'plan', 'tenant'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->status !== null && $request->status !== 'all', function ($query) use ($request) {
                $query->where('is_enabled', $request->status === 'enabled');
            })
            ->orderBy('priority')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master/ai/fallback-rules/index', [
            'rules' => $rules,
            'filters' => $request->only(['search', 'status']),
            'triggerTypes' => AiFallbackRule::getTriggerTypes(),
        ]);
    }

    /**
     * Show the form for creating a new fallback rule.
     */
    public function create()
    {
        $models = AiModel::active()->ordered()->get(['id', 'key', 'name', 'provider']);
        $plans = Plan::active()->orderBy('name')->get(['id', 'name']);
        $tenants = Tenant::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('master/ai/fallback-rules/create', [
            'models' => $models,
            'plans' => $plans,
            'tenants' => $tenants,
            'triggerTypes' => AiFallbackRule::getTriggerTypes(),
        ]);
    }

    /**
     * Store a newly created fallback rule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'primary_model_id' => ['required', 'exists:ai_models,id'],
            'fallback_model_id' => ['required', 'exists:ai_models,id', 'different:primary_model_id'],
            'trigger_on' => ['nullable', 'array'],
            'trigger_on.*' => [Rule::in(array_keys(AiFallbackRule::getTriggerTypes()))],
            'timeout_threshold_ms' => ['nullable', 'integer', 'min:100'],
            'error_rate_threshold' => ['nullable', 'integer', 'min:1', 'max:100'],
            'retry_count' => ['required', 'integer', 'min:0', 'max:5'],
            'retry_delay_ms' => ['required', 'integer', 'min:100', 'max:30000'],
            'preserve_context' => ['boolean'],
            'plan_id' => ['nullable', 'exists:plans,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'is_enabled' => ['boolean'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $rule = AiFallbackRule::create($validated);

        return redirect()->route('master.ai.fallback-rules.show', $rule)
            ->with('success', 'Fallback Rule created successfully.');
    }

    /**
     * Display the specified fallback rule.
     */
    public function show(AiFallbackRule $fallbackRule)
    {
        $fallbackRule->load(['primaryModel', 'fallbackModel', 'plan', 'tenant']);

        return Inertia::render('master/ai/fallback-rules/show', [
            'rule' => $fallbackRule,
            'triggerTypes' => AiFallbackRule::getTriggerTypes(),
        ]);
    }

    /**
     * Show the form for editing the specified fallback rule.
     */
    public function edit(AiFallbackRule $fallbackRule)
    {
        $models = AiModel::active()->ordered()->get(['id', 'key', 'name', 'provider']);
        $plans = Plan::active()->orderBy('name')->get(['id', 'name']);
        $tenants = Tenant::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('master/ai/fallback-rules/edit', [
            'rule' => $fallbackRule,
            'models' => $models,
            'plans' => $plans,
            'tenants' => $tenants,
            'triggerTypes' => AiFallbackRule::getTriggerTypes(),
        ]);
    }

    /**
     * Update the specified fallback rule.
     */
    public function update(Request $request, AiFallbackRule $fallbackRule)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'primary_model_id' => ['required', 'exists:ai_models,id'],
            'fallback_model_id' => ['required', 'exists:ai_models,id', 'different:primary_model_id'],
            'trigger_on' => ['nullable', 'array'],
            'trigger_on.*' => [Rule::in(array_keys(AiFallbackRule::getTriggerTypes()))],
            'timeout_threshold_ms' => ['nullable', 'integer', 'min:100'],
            'error_rate_threshold' => ['nullable', 'integer', 'min:1', 'max:100'],
            'retry_count' => ['required', 'integer', 'min:0', 'max:5'],
            'retry_delay_ms' => ['required', 'integer', 'min:100', 'max:30000'],
            'preserve_context' => ['boolean'],
            'plan_id' => ['nullable', 'exists:plans,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'is_enabled' => ['boolean'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $fallbackRule->update($validated);

        return redirect()->route('master.ai.fallback-rules.show', $fallbackRule)
            ->with('success', 'Fallback Rule updated successfully.');
    }

    /**
     * Remove the specified fallback rule.
     */
    public function destroy(AiFallbackRule $fallbackRule)
    {
        $fallbackRule->delete();

        return redirect()->route('master.ai.fallback-rules.index')
            ->with('success', 'Fallback Rule deleted successfully.');
    }

    /**
     * Toggle rule enabled status.
     */
    public function toggle(AiFallbackRule $fallbackRule)
    {
        $fallbackRule->update(['is_enabled' => !$fallbackRule->is_enabled]);

        $status = $fallbackRule->is_enabled ? 'enabled' : 'disabled';

        return back()->with('success', "Fallback Rule {$status} successfully.");
    }
}
