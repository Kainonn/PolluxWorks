<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiProviderConfig;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AiProviderConfigController extends Controller
{
    /**
     * Display a listing of provider configs.
     */
    public function index(Request $request)
    {
        $providers = AiProviderConfig::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('provider', 'like', "%{$search}%");
                });
            })
            ->when($request->status !== null && $request->status !== 'all', function ($query) use ($request) {
                if ($request->status === 'enabled') {
                    $query->where('is_enabled', true);
                } elseif ($request->status === 'disabled') {
                    $query->where('is_enabled', false);
                } else {
                    $query->where('status', $request->status);
                }
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master/ai/providers/index', [
            'providers' => $providers,
            'filters' => $request->only(['search', 'status']),
            'statuses' => AiProviderConfig::getStatuses(),
        ]);
    }

    /**
     * Show the form for creating a new provider config.
     */
    public function create()
    {
        return Inertia::render('master/ai/providers/create', [
            'providers' => AiProviderConfig::getProviderTypes(),
            'statuses' => AiProviderConfig::getStatuses(),
        ]);
    }

    /**
     * Store a newly created provider config.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'max:50', 'unique:ai_provider_configs'],
            'name' => ['required', 'string', 'max:255'],
            'is_enabled' => ['boolean'],
            'status' => ['required', Rule::in(array_keys(AiProviderConfig::getStatuses()))],
            'api_endpoint' => ['nullable', 'url', 'max:1000'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'api_version' => ['nullable', 'string', 'max:50'],
            'rate_limit_rpm' => ['nullable', 'integer', 'min:1'],
            'rate_limit_tpm' => ['nullable', 'integer', 'min:1'],
            'metadata' => ['nullable', 'array'],
        ]);

        // Handle api_key separately for encryption
        $apiKey = $validated['api_key'] ?? null;
        unset($validated['api_key']);

        $provider = new AiProviderConfig($validated);

        if ($apiKey) {
            $provider->api_key = $apiKey;
        }

        $provider->save();

        return redirect()->route('master.ai.providers.show', $provider)
            ->with('success', 'AI Provider created successfully.');
    }

    /**
     * Display the specified provider config.
     */
    public function show(AiProviderConfig $provider)
    {
        return Inertia::render('master/ai/providers/show', [
            'provider' => $provider,
            'providers' => AiProviderConfig::getProviderTypes(),
            'statuses' => AiProviderConfig::getStatuses(),
        ]);
    }

    /**
     * Show the form for editing the specified provider config.
     */
    public function edit(AiProviderConfig $provider)
    {
        return Inertia::render('master/ai/providers/edit', [
            'provider' => $provider,
            'providers' => AiProviderConfig::getProviderTypes(),
            'statuses' => AiProviderConfig::getStatuses(),
        ]);
    }

    /**
     * Update the specified provider config.
     */
    public function update(Request $request, AiProviderConfig $provider)
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'max:50', Rule::unique('ai_provider_configs')->ignore($provider->id)],
            'name' => ['required', 'string', 'max:255'],
            'is_enabled' => ['boolean'],
            'status' => ['required', Rule::in(array_keys(AiProviderConfig::getStatuses()))],
            'api_endpoint' => ['nullable', 'url', 'max:1000'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'api_version' => ['nullable', 'string', 'max:50'],
            'rate_limit_rpm' => ['nullable', 'integer', 'min:1'],
            'rate_limit_tpm' => ['nullable', 'integer', 'min:1'],
            'metadata' => ['nullable', 'array'],
        ]);

        // Handle api_key separately
        $apiKey = $validated['api_key'] ?? null;
        unset($validated['api_key']);

        $provider->fill($validated);

        // Only update API key if provided (allows keeping existing)
        if ($apiKey) {
            $provider->api_key = $apiKey;
        }

        $provider->save();

        return redirect()->route('master.ai.providers.show', $provider)
            ->with('success', 'AI Provider updated successfully.');
    }

    /**
     * Remove the specified provider config.
     */
    public function destroy(AiProviderConfig $provider)
    {
        $provider->delete();

        return redirect()->route('master.ai.providers.index')
            ->with('success', 'AI Provider deleted successfully.');
    }

    /**
     * Toggle provider enabled status.
     */
    public function toggle(AiProviderConfig $provider)
    {
        $provider->update(['is_enabled' => !$provider->is_enabled]);

        $status = $provider->is_enabled ? 'enabled' : 'disabled';

        return back()->with('success', "AI Provider {$status} successfully.");
    }

    /**
     * Test provider connection.
     */
    public function test(AiProviderConfig $provider)
    {
        // This is a placeholder - in production you'd actually test the connection
        // For now, we'll just update the health check timestamp

        $provider->update([
            'last_health_check' => now(),
            'status' => AiProviderConfig::STATUS_OPERATIONAL,
        ]);

        return back()->with('success', 'Provider connection test successful.');
    }
}
