<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiModel;
use App\Models\AI\AiPlanLimit;
use App\Models\AI\AiTool;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AiPlanLimitController extends Controller
{
    /**
     * Display a listing of AI plan limits.
     */
    public function index(Request $request)
    {
        $limits = AiPlanLimit::query()
            ->with('plan')
            ->when($request->search, function ($query, $search) {
                $query->whereHas('plan', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->orderBy('plan_id')
            ->paginate(15)
            ->withQueryString();

        // Get plans without AI limits configured
        $plansWithoutLimits = Plan::whereDoesntHave('aiLimit')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('master/ai/plan-limits/index', [
            'limits' => $limits,
            'filters' => $request->only(['search']),
            'plansWithoutLimits' => $plansWithoutLimits,
        ]);
    }

    /**
     * Show the form for creating a new AI plan limit.
     */
    public function create(Request $request)
    {
        $plans = Plan::whereDoesntHave('aiLimit')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $models = AiModel::active()->ordered()->get(['id', 'key', 'name', 'provider']);
        $tools = AiTool::enabled()->orderBy('name')->get(['id', 'key', 'name', 'category']);

        return Inertia::render('master/ai/plan-limits/create', [
            'plans' => $plans,
            'models' => $models,
            'tools' => $tools,
            'selectedPlanId' => $request->plan_id,
        ]);
    }

    /**
     * Store a newly created AI plan limit.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id', 'unique:ai_plan_limits'],
            'max_requests_per_month' => ['required', 'integer', 'min:-1'],
            'max_requests_per_day' => ['nullable', 'integer', 'min:-1'],
            'max_requests_per_hour' => ['nullable', 'integer', 'min:-1'],
            'max_tokens_per_month' => ['required', 'integer', 'min:-1'],
            'max_tokens_per_request' => ['required', 'integer', 'min:1'],
            'max_input_tokens_per_request' => ['nullable', 'integer', 'min:1'],
            'max_output_tokens_per_request' => ['nullable', 'integer', 'min:1'],
            'max_tool_calls_per_request' => ['required', 'integer', 'min:0'],
            'queue_priority' => ['required', 'integer', 'min:1', 'max:10'],
            'allow_overage' => ['boolean'],
            'overage_cost_per_1k_tokens' => ['nullable', 'numeric', 'min:0'],
            'overage_cost_per_request' => ['nullable', 'numeric', 'min:0'],
            // Models and tools
            'allowed_models' => ['nullable', 'array'],
            'allowed_models.*' => ['exists:ai_models,id'],
            'allowed_tools' => ['nullable', 'array'],
            'allowed_tools.*' => ['exists:ai_tools,id'],
        ]);

        DB::transaction(function () use ($validated) {
            // Create the plan limit
            $limit = AiPlanLimit::create([
                'plan_id' => $validated['plan_id'],
                'max_requests_per_month' => $validated['max_requests_per_month'],
                'max_requests_per_day' => $validated['max_requests_per_day'],
                'max_requests_per_hour' => $validated['max_requests_per_hour'],
                'max_tokens_per_month' => $validated['max_tokens_per_month'],
                'max_tokens_per_request' => $validated['max_tokens_per_request'],
                'max_input_tokens_per_request' => $validated['max_input_tokens_per_request'],
                'max_output_tokens_per_request' => $validated['max_output_tokens_per_request'],
                'max_tool_calls_per_request' => $validated['max_tool_calls_per_request'],
                'queue_priority' => $validated['queue_priority'],
                'allow_overage' => $validated['allow_overage'] ?? false,
                'overage_cost_per_1k_tokens' => $validated['overage_cost_per_1k_tokens'],
                'overage_cost_per_request' => $validated['overage_cost_per_request'],
            ]);

            // Sync allowed models
            if (!empty($validated['allowed_models'])) {
                $plan = Plan::find($validated['plan_id']);
                $plan->aiModels()->sync($validated['allowed_models']);
            }

            // Sync allowed tools
            if (!empty($validated['allowed_tools'])) {
                $plan = Plan::find($validated['plan_id']);
                $plan->aiTools()->sync($validated['allowed_tools']);
            }
        });

        return redirect()->route('master.ai.plan-limits.index')
            ->with('success', 'AI Plan Limits created successfully.');
    }

    /**
     * Display the specified AI plan limit.
     */
    public function show(AiPlanLimit $planLimit)
    {
        $planLimit->load(['plan.aiModels', 'plan.aiTools']);

        return Inertia::render('master/ai/plan-limits/show', [
            'limit' => $planLimit,
        ]);
    }

    /**
     * Show the form for editing the specified AI plan limit.
     */
    public function edit(AiPlanLimit $planLimit)
    {
        $planLimit->load(['plan.aiModels', 'plan.aiTools']);

        $models = AiModel::active()->ordered()->get(['id', 'key', 'name', 'provider']);
        $tools = AiTool::enabled()->orderBy('name')->get(['id', 'key', 'name', 'category']);

        return Inertia::render('master/ai/plan-limits/edit', [
            'limit' => $planLimit,
            'models' => $models,
            'tools' => $tools,
        ]);
    }

    /**
     * Update the specified AI plan limit.
     */
    public function update(Request $request, AiPlanLimit $planLimit)
    {
        $validated = $request->validate([
            'max_requests_per_month' => ['required', 'integer', 'min:-1'],
            'max_requests_per_day' => ['nullable', 'integer', 'min:-1'],
            'max_requests_per_hour' => ['nullable', 'integer', 'min:-1'],
            'max_tokens_per_month' => ['required', 'integer', 'min:-1'],
            'max_tokens_per_request' => ['required', 'integer', 'min:1'],
            'max_input_tokens_per_request' => ['nullable', 'integer', 'min:1'],
            'max_output_tokens_per_request' => ['nullable', 'integer', 'min:1'],
            'max_tool_calls_per_request' => ['required', 'integer', 'min:0'],
            'queue_priority' => ['required', 'integer', 'min:1', 'max:10'],
            'allow_overage' => ['boolean'],
            'overage_cost_per_1k_tokens' => ['nullable', 'numeric', 'min:0'],
            'overage_cost_per_request' => ['nullable', 'numeric', 'min:0'],
            // Models and tools
            'allowed_models' => ['nullable', 'array'],
            'allowed_models.*' => ['exists:ai_models,id'],
            'allowed_tools' => ['nullable', 'array'],
            'allowed_tools.*' => ['exists:ai_tools,id'],
        ]);

        DB::transaction(function () use ($validated, $planLimit) {
            $planLimit->update([
                'max_requests_per_month' => $validated['max_requests_per_month'],
                'max_requests_per_day' => $validated['max_requests_per_day'],
                'max_requests_per_hour' => $validated['max_requests_per_hour'],
                'max_tokens_per_month' => $validated['max_tokens_per_month'],
                'max_tokens_per_request' => $validated['max_tokens_per_request'],
                'max_input_tokens_per_request' => $validated['max_input_tokens_per_request'],
                'max_output_tokens_per_request' => $validated['max_output_tokens_per_request'],
                'max_tool_calls_per_request' => $validated['max_tool_calls_per_request'],
                'queue_priority' => $validated['queue_priority'],
                'allow_overage' => $validated['allow_overage'] ?? false,
                'overage_cost_per_1k_tokens' => $validated['overage_cost_per_1k_tokens'],
                'overage_cost_per_request' => $validated['overage_cost_per_request'],
            ]);

            // Sync allowed models
            $planLimit->plan->aiModels()->sync($validated['allowed_models'] ?? []);

            // Sync allowed tools
            $planLimit->plan->aiTools()->sync($validated['allowed_tools'] ?? []);
        });

        return redirect()->route('master.ai.plan-limits.show', $planLimit)
            ->with('success', 'AI Plan Limits updated successfully.');
    }

    /**
     * Remove the specified AI plan limit.
     */
    public function destroy(AiPlanLimit $planLimit)
    {
        DB::transaction(function () use ($planLimit) {
            // Remove related model and tool associations
            $planLimit->plan->aiModels()->detach();
            $planLimit->plan->aiTools()->detach();
            $planLimit->delete();
        });

        return redirect()->route('master.ai.plan-limits.index')
            ->with('success', 'AI Plan Limits deleted successfully.');
    }
}
