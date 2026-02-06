<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiTool;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AiToolController extends Controller
{
    /**
     * Display a listing of AI tools.
     */
    public function index(Request $request)
    {
        $tools = AiTool::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('key', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->type && $request->type !== 'all', function ($query) use ($request) {
                $query->where('type', $request->type);
            })
            ->when($request->risk && $request->risk !== 'all', function ($query) use ($request) {
                $query->where('risk_level', $request->risk);
            })
            ->when($request->category && $request->category !== 'all', function ($query) use ($request) {
                $query->where('category', $request->category);
            })
            ->when($request->status !== null && $request->status !== 'all', function ($query) use ($request) {
                $query->where('is_enabled', $request->status === 'enabled');
            })
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master/ai/tools/index', [
            'tools' => $tools,
            'filters' => $request->only(['search', 'type', 'risk', 'category', 'status']),
            'types' => AiTool::getTypes(),
            'riskLevels' => AiTool::getRiskLevels(),
            'categories' => AiTool::getCategories(),
        ]);
    }

    /**
     * Show the form for creating a new AI tool.
     */
    public function create()
    {
        return Inertia::render('master/ai/tools/create', [
            'types' => AiTool::getTypes(),
            'riskLevels' => AiTool::getRiskLevels(),
            'categories' => AiTool::getCategories(),
            'accessLevels' => AiTool::getAccessLevels(),
        ]);
    }

    /**
     * Store a newly created AI tool.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:ai_tools'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', Rule::in(array_keys(AiTool::getTypes()))],
            'risk_level' => ['required', Rule::in(array_keys(AiTool::getRiskLevels()))],
            'required_roles' => ['nullable', 'array'],
            'required_roles.*' => ['string'],
            'required_permissions' => ['nullable', 'array'],
            'required_permissions.*' => ['string'],
            'is_enabled' => ['boolean'],
            'is_beta' => ['boolean'],
            'parameters_schema' => ['nullable', 'array'],
            'response_schema' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:100'],
            'metadata' => ['nullable', 'array'],
        ]);

        $tool = AiTool::create($validated);

        return redirect()->route('master.ai.tools.show', $tool)
            ->with('success', 'AI Tool created successfully.');
    }

    /**
     * Display the specified AI tool.
     */
    public function show(AiTool $tool)
    {
        $tool->load('plans');

        return Inertia::render('master/ai/tools/show', [
            'tool' => $tool,
            'types' => AiTool::getTypes(),
            'riskLevels' => AiTool::getRiskLevels(),
            'categories' => AiTool::getCategories(),
            'accessLevels' => AiTool::getAccessLevels(),
        ]);
    }

    /**
     * Show the form for editing the specified AI tool.
     */
    public function edit(AiTool $tool)
    {
        return Inertia::render('master/ai/tools/edit', [
            'tool' => $tool,
            'types' => AiTool::getTypes(),
            'riskLevels' => AiTool::getRiskLevels(),
            'categories' => AiTool::getCategories(),
            'accessLevels' => AiTool::getAccessLevels(),
        ]);
    }

    /**
     * Update the specified AI tool.
     */
    public function update(Request $request, AiTool $tool)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', Rule::unique('ai_tools')->ignore($tool->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', Rule::in(array_keys(AiTool::getTypes()))],
            'risk_level' => ['required', Rule::in(array_keys(AiTool::getRiskLevels()))],
            'required_roles' => ['nullable', 'array'],
            'required_roles.*' => ['string'],
            'required_permissions' => ['nullable', 'array'],
            'required_permissions.*' => ['string'],
            'is_enabled' => ['boolean'],
            'is_beta' => ['boolean'],
            'parameters_schema' => ['nullable', 'array'],
            'response_schema' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:100'],
            'metadata' => ['nullable', 'array'],
        ]);

        $tool->update($validated);

        return redirect()->route('master.ai.tools.show', $tool)
            ->with('success', 'AI Tool updated successfully.');
    }

    /**
     * Remove the specified AI tool.
     */
    public function destroy(AiTool $tool)
    {
        $tool->delete();

        return redirect()->route('master.ai.tools.index')
            ->with('success', 'AI Tool deleted successfully.');
    }

    /**
     * Toggle tool enabled status.
     */
    public function toggle(AiTool $tool)
    {
        $tool->update(['is_enabled' => !$tool->is_enabled]);

        $status = $tool->is_enabled ? 'enabled' : 'disabled';

        return back()->with('success', "AI Tool {$status} successfully.");
    }
}
