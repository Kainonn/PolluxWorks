<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $plans = Plan::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->status !== null && $request->status !== 'all', function ($query) use ($request) {
                $query->where('is_active', $request->status === 'active');
            })
            ->orderBy('sort_order')
            ->orderBy('price_monthly')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('master/plans/index', [
            'plans' => $plans,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('master/plans/create', [
            'availableFeatures' => $this->getAvailableFeatures(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:plans'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:plans'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_monthly' => ['required', 'numeric', 'min:0'],
            'price_yearly' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'max_users' => ['required', 'integer', 'min:-1'],
            'max_modules' => ['required', 'integer', 'min:-1'],
            'max_ai_requests' => ['required', 'integer', 'min:-1'],
            'max_storage_mb' => ['required', 'integer', 'min:-1'],
            'trial_days' => ['required', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $plan = Plan::create($validated);

        return redirect()->route('plans.show', $plan)
            ->with('success', 'Plan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Plan $plan)
    {
        return Inertia::render('master/plans/show', [
            'plan' => $plan,
            'availableFeatures' => $this->getAvailableFeatures(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Plan $plan)
    {
        return Inertia::render('master/plans/edit', [
            'plan' => $plan,
            'availableFeatures' => $this->getAvailableFeatures(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('plans')->ignore($plan->id)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('plans')->ignore($plan->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_monthly' => ['required', 'numeric', 'min:0'],
            'price_yearly' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'max_users' => ['required', 'integer', 'min:-1'],
            'max_modules' => ['required', 'integer', 'min:-1'],
            'max_ai_requests' => ['required', 'integer', 'min:-1'],
            'max_storage_mb' => ['required', 'integer', 'min:-1'],
            'trial_days' => ['required', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $plan->update($validated);

        return redirect()->route('plans.show', $plan)
            ->with('success', 'Plan updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Plan $plan)
    {
        $plan->delete();

        return redirect()->route('plans.index')
            ->with('success', 'Plan deleted successfully.');
    }

    /**
     * Get the list of available features that can be assigned to plans.
     */
    private function getAvailableFeatures(): array
    {
        return [
            'api_access' => 'API Access',
            'priority_support' => 'Priority Support',
            'custom_branding' => 'Custom Branding',
            'advanced_analytics' => 'Advanced Analytics',
            'export_data' => 'Export Data',
            'import_data' => 'Import Data',
            'webhooks' => 'Webhooks',
            'sso' => 'Single Sign-On (SSO)',
            'audit_logs' => 'Audit Logs',
            'custom_roles' => 'Custom Roles',
            'multi_language' => 'Multi-Language Support',
            'white_label' => 'White Label',
            'dedicated_support' => 'Dedicated Support',
            'sla_guarantee' => 'SLA Guarantee',
            'custom_integrations' => 'Custom Integrations',
        ];
    }
}
