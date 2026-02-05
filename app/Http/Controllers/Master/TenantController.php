<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Services\Tenant\TenantDomainService;
use App\Services\Tenant\TenantHealthService;
use App\Services\Tenant\TenantProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function __construct(
        protected TenantProvisioningService $provisioningService,
        protected TenantDomainService $domainService,
        protected TenantHealthService $healthService,
    ) {}

    /**
     * Display a listing of tenants.
     */
    public function index(Request $request)
    {
        $tenants = Tenant::query()
            ->with(['plan:id,name,slug'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('slug', 'like', "%{$search}%")
                      ->orWhere('primary_domain', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plan, function ($query, $planId) {
                $query->where('plan_id', $planId);
            })
            ->when($request->provisioning, function ($query, $provisioning) {
                $query->where('provisioning_status', $provisioning);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Add computed properties for JSON serialization
        $tenants->getCollection()->transform(function ($tenant) {
            // Force compute and append these values for the response
            $tenant->append(['is_online', 'seats_usage_percent', 'storage_usage_percent']);
            $tenant->subdomain_url = $this->domainService->getSubdomainUrl($tenant);
            return $tenant;
        });

        $plans = Plan::where('is_active', true)->select('id', 'name', 'slug')->get();
        $healthStats = $this->healthService->getOverallHealth();

        return Inertia::render('master/tenants/index', [
            'tenants' => $tenants,
            'plans' => $plans,
            'healthStats' => $healthStats,
            'filters' => $request->only(['search', 'status', 'plan', 'provisioning', 'per_page']),
            'statuses' => [
                Tenant::STATUS_TRIAL,
                Tenant::STATUS_ACTIVE,
                Tenant::STATUS_SUSPENDED,
                Tenant::STATUS_OVERDUE,
                Tenant::STATUS_CANCELLED,
            ],
            'provisioningStatuses' => [
                Tenant::PROVISIONING_PENDING,
                Tenant::PROVISIONING_RUNNING,
                Tenant::PROVISIONING_READY,
                Tenant::PROVISIONING_FAILED,
            ],
        ]);
    }

    /**
     * Show the form for creating a new tenant.
     */
    public function create()
    {
        $plans = Plan::where('is_active', true)
            ->select('id', 'name', 'slug', 'trial_days', 'max_users', 'max_storage_mb', 'max_ai_requests', 'features', 'price_monthly')
            ->orderBy('sort_order')
            ->get();

        $timezones = \DateTimeZone::listIdentifiers();
        $locales = [
            'en-US' => 'English (US)',
            'en-GB' => 'English (UK)',
            'es-MX' => 'Español (México)',
            'es-ES' => 'Español (España)',
            'fr-FR' => 'Français (France)',
            'de-DE' => 'Deutsch (Deutschland)',
            'pt-BR' => 'Português (Brasil)',
        ];

        $industries = [
            'technology' => 'Technology',
            'manufacturing' => 'Manufacturing',
            'healthcare' => 'Healthcare',
            'finance' => 'Finance',
            'retail' => 'Retail',
            'education' => 'Education',
            'government' => 'Government',
            'other' => 'Other',
        ];

        return Inertia::render('master/tenants/create', [
            'plans' => $plans,
            'timezones' => $timezones,
            'locales' => $locales,
            'industries' => $industries,
            'baseDomain' => $this->domainService->getBaseDomain(),
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Step 1: Identity
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:tenants,slug'],
            'timezone' => ['required', 'string', 'timezone'],
            'locale' => ['required', 'string', 'max:10'],
            'region' => ['nullable', 'string', 'max:100'],
            'industry_type' => ['nullable', 'string', 'max:100'],

            // Step 2: Plan & Limits
            'plan_id' => ['required', 'exists:plans,id'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'seats_limit' => ['nullable', 'integer', 'min:1'],
            'storage_limit_mb' => ['nullable', 'integer', 'min:1'],
            'ai_requests_limit' => ['nullable', 'integer', 'min:0'],
            'enabled_modules' => ['nullable', 'array'],

            // Step 3: Admin User
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['nullable', 'string', 'min:8'],
            'send_invite' => ['boolean'],
            'require_mfa' => ['boolean'],
        ]);

        // Prepare admin data
        $adminData = [
            'name' => $validated['admin_name'],
            'email' => $validated['admin_email'],
            'password' => $validated['admin_password'] ?? Str::random(16),
            'send_invite' => $validated['send_invite'] ?? true,
            'require_mfa' => $validated['require_mfa'] ?? false,
        ];

        // Create tenant
        $tenant = $this->provisioningService->createTenant([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'plan_id' => $validated['plan_id'],
            'trial_days' => $validated['trial_days'] ?? null,
            'timezone' => $validated['timezone'],
            'locale' => $validated['locale'],
            'region' => $validated['region'] ?? null,
            'industry_type' => $validated['industry_type'] ?? null,
            'seats_limit' => $validated['seats_limit'] ?? null,
            'storage_limit_mb' => $validated['storage_limit_mb'] ?? null,
            'ai_requests_limit' => $validated['ai_requests_limit'] ?? null,
            'enabled_modules' => $validated['enabled_modules'] ?? null,
            'admin' => $adminData,
        ], $request->user()?->id);

        return redirect()->route('tenants.show', $tenant)
            ->with('success', 'Tenant created successfully. Provisioning in progress...');
    }

    /**
     * Display the specified tenant.
     */
    public function show(Tenant $tenant)
    {
        $tenant->load(['plan', 'creator', 'activityLogs' => function ($q) {
            $q->with('user:id,name')->latest()->limit(20);
        }]);

        // Get computed data
        $domains = $this->domainService->getAllDomains($tenant);
        $healthCheck = $this->healthService->performHealthCheck($tenant);
        $heartbeatHistory = $this->healthService->getHeartbeatHistory($tenant, 24);

        // Get API tokens (without actual token values)
        $apiTokens = $tenant->apiTokens()
            ->select('id', 'name', 'abilities', 'last_used_at', 'expires_at', 'created_at')
            ->get();

        return Inertia::render('master/tenants/show', [
            'tenant' => $tenant,
            'domains' => $domains,
            'healthCheck' => $healthCheck,
            'heartbeatHistory' => $heartbeatHistory,
            'apiTokens' => $apiTokens,
            'baseDomain' => $this->domainService->getBaseDomain(),
        ]);
    }

    /**
     * Show the form for editing the specified tenant.
     */
    public function edit(Tenant $tenant)
    {
        $plans = Plan::where('is_active', true)
            ->select('id', 'name', 'slug', 'trial_days', 'max_users', 'max_storage_mb', 'max_ai_requests', 'features', 'price_monthly')
            ->orderBy('sort_order')
            ->get();

        $timezones = \DateTimeZone::listIdentifiers();
        $locales = [
            'en-US' => 'English (US)',
            'en-GB' => 'English (UK)',
            'es-MX' => 'Español (México)',
            'es-ES' => 'Español (España)',
            'fr-FR' => 'Français (France)',
            'de-DE' => 'Deutsch (Deutschland)',
            'pt-BR' => 'Português (Brasil)',
        ];

        return Inertia::render('master/tenants/edit', [
            'tenant' => $tenant->load('plan'),
            'plans' => $plans,
            'timezones' => $timezones,
            'locales' => $locales,
            'baseDomain' => $this->domainService->getBaseDomain(),
        ]);
    }

    /**
     * Update the specified tenant.
     */
    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'timezone' => ['required', 'string', 'timezone'],
            'locale' => ['required', 'string', 'max:10'],
            'region' => ['nullable', 'string', 'max:100'],
            'industry_type' => ['nullable', 'string', 'max:100'],
            'seats_limit' => ['nullable', 'integer', 'min:1'],
            'storage_limit_mb' => ['nullable', 'integer', 'min:1'],
            'ai_requests_limit' => ['nullable', 'integer', 'min:0'],
            'enabled_modules' => ['nullable', 'array'],
        ]);

        $oldValues = $tenant->only(array_keys($validated));

        $tenant->update($validated);

        $tenant->logActivity('updated', 'Tenant settings updated', $oldValues, $validated);

        return redirect()->route('tenants.show', $tenant)
            ->with('success', 'Tenant updated successfully.');
    }

    /**
     * Remove the specified tenant.
     */
    public function destroy(Tenant $tenant)
    {
        $tenant->logActivity('deleted', "Tenant '{$tenant->name}' was deleted");

        // Soft delete - keep data
        $tenant->delete();

        return redirect()->route('tenants.index')
            ->with('success', 'Tenant deleted successfully.');
    }

    /**
     * Change tenant plan.
     */
    public function changePlan(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $oldPlan = $tenant->plan;
        $newPlan = Plan::find($validated['plan_id']);

        $tenant->update(['plan_id' => $validated['plan_id']]);

        $tenant->logActivity(
            'plan_changed',
            "Plan changed from '{$oldPlan->name}' to '{$newPlan->name}'" .
                ($validated['reason'] ? ". Reason: {$validated['reason']}" : ''),
            ['plan_id' => $oldPlan->id, 'plan_name' => $oldPlan->name],
            ['plan_id' => $newPlan->id, 'plan_name' => $newPlan->name]
        );

        return back()->with('success', 'Plan changed successfully.');
    }

    /**
     * Suspend tenant.
     */
    public function suspend(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if ($tenant->status === Tenant::STATUS_SUSPENDED) {
            return back()->with('error', 'Tenant is already suspended.');
        }

        $tenant->suspend($validated['reason'], $request->user());

        return back()->with('success', 'Tenant suspended successfully.');
    }

    /**
     * Reactivate tenant.
     */
    public function reactivate(Tenant $tenant)
    {
        if ($tenant->status !== Tenant::STATUS_SUSPENDED) {
            return back()->with('error', 'Tenant is not suspended.');
        }

        $tenant->reactivate();
        $tenant->logActivity('reactivated', 'Tenant was reactivated');

        return back()->with('success', 'Tenant reactivated successfully.');
    }

    /**
     * Force health check.
     */
    public function healthCheck(Tenant $tenant)
    {
        $healthCheck = $this->healthService->performHealthCheck($tenant);

        $tenant->logActivity('health_check', "Health check performed. Status: {$healthCheck['overall']}");

        return back()->with([
            'success' => 'Health check completed.',
            'healthCheck' => $healthCheck,
        ]);
    }

    /**
     * Retry provisioning.
     */
    public function retryProvisioning(Tenant $tenant)
    {
        if ($tenant->provisioning_status !== Tenant::PROVISIONING_FAILED) {
            return back()->with('error', 'Can only retry provisioning for failed tenants.');
        }

        try {
            $this->provisioningService->retryProvisioning($tenant);
            return back()->with('success', 'Provisioning restarted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Provisioning failed: ' . $e->getMessage());
        }
    }

    /**
     * Regenerate API token.
     */
    public function regenerateToken(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'token_id' => ['required', 'exists:tenant_api_tokens,id'],
        ]);

        $token = $tenant->apiTokens()->findOrFail($validated['token_id']);
        $oldToken = $token->token;
        $newToken = Str::random(64);

        $token->update(['token' => $newToken]);

        $tenant->logActivity('token_regenerated', "API token '{$token->name}' was regenerated");

        return back()->with([
            'success' => 'API token regenerated successfully.',
            'newToken' => $newToken, // Show once
        ]);
    }

    /**
     * Add custom domain.
     */
    public function addDomain(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255'],
            'is_primary' => ['boolean'],
        ]);

        try {
            $this->domainService->addCustomDomain($tenant, $validated['domain']);

            if ($validated['is_primary'] ?? false) {
                $this->domainService->setPrimaryDomain($tenant, $validated['domain']);
            }

            return back()->with('success', 'Domain added successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove custom domain.
     */
    public function removeDomain(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'domain' => ['required', 'string'],
        ]);

        $this->domainService->removeCustomDomain($tenant, $validated['domain']);

        return back()->with('success', 'Domain removed successfully.');
    }

    /**
     * Verify DNS for domain.
     */
    public function verifyDns(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'domain' => ['required', 'string'],
        ]);

        $result = $this->domainService->verifyDns($tenant, $validated['domain']);

        return back()->with([
            'success' => $result['verified'] ? 'DNS verified successfully!' : 'DNS verification pending.',
            'dnsResult' => $result,
        ]);
    }

    /**
     * Check slug availability.
     */
    public function checkSlug(Request $request)
    {
        $request->validate([
            'slug' => ['required', 'string', 'max:100', 'alpha_dash'],
        ]);

        $available = $this->domainService->isSlugAvailable($request->slug);

        return response()->json([
            'available' => $available,
            'subdomain' => $request->slug . '.' . $this->domainService->getBaseDomain(),
        ]);
    }
}
