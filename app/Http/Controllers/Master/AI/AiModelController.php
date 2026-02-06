<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiModel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AiModelController extends Controller
{
    /**
     * Display a listing of AI models.
     */
    public function index(Request $request)
    {
        $models = AiModel::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('key', 'like', "%{$search}%")
                      ->orWhere('provider', 'like', "%{$search}%");
                });
            })
            ->when($request->provider && $request->provider !== 'all', function ($query) use ($request) {
                $query->where('provider', $request->provider);
            })
            ->when($request->type && $request->type !== 'all', function ($query) use ($request) {
                $query->where('type', $request->type);
            })
            ->when($request->status && $request->status !== 'all', function ($query) use ($request) {
                $query->where('status', $request->status);
            })
            ->orderBy('priority')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master/ai/models/index', [
            'models' => $models,
            'filters' => $request->only(['search', 'provider', 'type', 'status']),
            'providers' => AiModel::getProviders(),
            'types' => AiModel::getTypes(),
            'statuses' => AiModel::getStatuses(),
        ]);
    }

    /**
     * Show the form for creating a new AI model.
     */
    public function create()
    {
        return Inertia::render('master/ai/models/create', [
            'providers' => AiModel::getProviders(),
            'types' => AiModel::getTypes(),
            'statuses' => AiModel::getStatuses(),
        ]);
    }

    /**
     * Store a newly created AI model.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:ai_models'],
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:50'],
            'type' => ['required', Rule::in(array_keys(AiModel::getTypes()))],
            'status' => ['required', Rule::in(array_keys(AiModel::getStatuses()))],
            'cost_per_1k_tokens_in' => ['required', 'numeric', 'min:0'],
            'cost_per_1k_tokens_out' => ['required', 'numeric', 'min:0'],
            'context_window' => ['required', 'integer', 'min:1'],
            'max_output_tokens' => ['nullable', 'integer', 'min:1'],
            'capabilities' => ['nullable', 'array'],
            'regions' => ['nullable', 'array'],
            'is_default' => ['boolean'],
            'priority' => ['integer', 'min:0', 'max:999'],
            'description' => ['nullable', 'string', 'max:2000'],
            'documentation_url' => ['nullable', 'url', 'max:500'],
            'metadata' => ['nullable', 'array'],
        ]);

        $model = AiModel::create($validated);

        return redirect()->route('master.ai.models.show', $model)
            ->with('success', 'AI Model created successfully.');
    }

    /**
     * Display the specified AI model.
     */
    public function show(AiModel $model)
    {
        $model->load(['plans', 'fallbackRulesAsPrimary.fallbackModel', 'fallbackRulesAsFallback.primaryModel']);

        return Inertia::render('master/ai/models/show', [
            'model' => $model,
            'providers' => AiModel::getProviders(),
            'types' => AiModel::getTypes(),
            'statuses' => AiModel::getStatuses(),
        ]);
    }

    /**
     * Show the form for editing the specified AI model.
     */
    public function edit(AiModel $model)
    {
        return Inertia::render('master/ai/models/edit', [
            'model' => $model,
            'providers' => AiModel::getProviders(),
            'types' => AiModel::getTypes(),
            'statuses' => AiModel::getStatuses(),
        ]);
    }

    /**
     * Update the specified AI model.
     */
    public function update(Request $request, AiModel $model)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', Rule::unique('ai_models')->ignore($model->id)],
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:50'],
            'type' => ['required', Rule::in(array_keys(AiModel::getTypes()))],
            'status' => ['required', Rule::in(array_keys(AiModel::getStatuses()))],
            'cost_per_1k_tokens_in' => ['required', 'numeric', 'min:0'],
            'cost_per_1k_tokens_out' => ['required', 'numeric', 'min:0'],
            'context_window' => ['required', 'integer', 'min:1'],
            'max_output_tokens' => ['nullable', 'integer', 'min:1'],
            'capabilities' => ['nullable', 'array'],
            'regions' => ['nullable', 'array'],
            'is_default' => ['boolean'],
            'priority' => ['integer', 'min:0', 'max:999'],
            'description' => ['nullable', 'string', 'max:2000'],
            'documentation_url' => ['nullable', 'url', 'max:500'],
            'metadata' => ['nullable', 'array'],
        ]);

        $model->update($validated);

        return redirect()->route('master.ai.models.show', $model)
            ->with('success', 'AI Model updated successfully.');
    }

    /**
     * Remove the specified AI model.
     */
    public function destroy(AiModel $model)
    {
        $model->delete();

        return redirect()->route('master.ai.models.index')
            ->with('success', 'AI Model deleted successfully.');
    }
}
