<?php

namespace App\Http\Controllers\Master\AI;

use App\Http\Controllers\Controller;
use App\Models\AI\AiModel;
use App\Models\AI\AiUsageDaily;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AiUsageController extends Controller
{
    /**
     * Display usage metrics dashboard.
     */
    public function index(Request $request)
    {
        // Get date range
        $from = $request->from ? now()->parse($request->from) : now()->startOfMonth();
        $to = $request->to ? now()->parse($request->to) : now();

        // Overall stats for the period
        $overallStats = AiUsageDaily::query()
            ->forDateRange($from, $to)
            ->selectRaw('
                COUNT(DISTINCT tenant_id) as active_tenants,
                SUM(requests_count) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(failed_requests) as failed_requests,
                SUM(tokens_in) as total_tokens_in,
                SUM(tokens_out) as total_tokens_out,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost,
                SUM(tool_calls_count) as total_tool_calls,
                SUM(timeout_count) as total_timeouts,
                SUM(rate_limit_hits) as total_rate_limits
            ')
            ->first();

        // Usage by tenant (top 10)
        $usageByTenant = AiUsageDaily::query()
            ->forDateRange($from, $to)
            ->select('tenant_id')
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost
            ')
            ->groupBy('tenant_id')
            ->orderByDesc('total_requests')
            ->limit(10)
            ->with('tenant:id,name,slug')
            ->get();

        // Usage by model
        $usageByModel = AiUsageDaily::query()
            ->forDateRange($from, $to)
            ->whereNotNull('ai_model_id')
            ->select('ai_model_id')
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost
            ')
            ->groupBy('ai_model_id')
            ->orderByDesc('total_requests')
            ->with('model:id,key,name,provider')
            ->get();

        // Daily trend
        $dailyTrend = AiUsageDaily::query()
            ->forDateRange($from, $to)
            ->select('date')
            ->selectRaw('
                SUM(requests_count) as requests,
                SUM(total_tokens) as tokens,
                SUM(cost_estimated) as cost
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('master/ai/usage/index', [
            'overallStats' => $overallStats,
            'usageByTenant' => $usageByTenant,
            'usageByModel' => $usageByModel,
            'dailyTrend' => $dailyTrend,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    /**
     * Show usage for a specific tenant.
     */
    public function byTenant(Request $request, Tenant $tenant)
    {
        $from = $request->from ? now()->parse($request->from) : now()->startOfMonth();
        $to = $request->to ? now()->parse($request->to) : now();

        // Tenant stats
        $stats = AiUsageDaily::query()
            ->forTenant($tenant->id)
            ->forDateRange($from, $to)
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(failed_requests) as failed_requests,
                SUM(tokens_in) as total_tokens_in,
                SUM(tokens_out) as total_tokens_out,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost,
                SUM(tool_calls_count) as total_tool_calls
            ')
            ->first();

        // Usage by model for this tenant
        $usageByModel = AiUsageDaily::query()
            ->forTenant($tenant->id)
            ->forDateRange($from, $to)
            ->whereNotNull('ai_model_id')
            ->select('ai_model_id')
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost
            ')
            ->groupBy('ai_model_id')
            ->with('model:id,key,name')
            ->get();

        // Daily trend for this tenant
        $dailyTrend = AiUsageDaily::query()
            ->forTenant($tenant->id)
            ->forDateRange($from, $to)
            ->select('date')
            ->selectRaw('
                SUM(requests_count) as requests,
                SUM(total_tokens) as tokens,
                SUM(cost_estimated) as cost
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Tool usage aggregation
        $toolUsage = AiUsageDaily::query()
            ->forTenant($tenant->id)
            ->forDateRange($from, $to)
            ->whereNotNull('tools_invoked')
            ->get()
            ->pluck('tools_invoked')
            ->reduce(function ($carry, $tools) {
                foreach ($tools as $key => $count) {
                    $carry[$key] = ($carry[$key] ?? 0) + $count;
                }
                return $carry;
            }, []);

        arsort($toolUsage);

        return Inertia::render('master/ai/usage/tenant', [
            'tenant' => $tenant->only(['id', 'name', 'slug']),
            'stats' => $stats,
            'usageByModel' => $usageByModel,
            'dailyTrend' => $dailyTrend,
            'toolUsage' => $toolUsage,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    /**
     * Show usage for a specific model.
     */
    public function byModel(Request $request, AiModel $model)
    {
        $from = $request->from ? now()->parse($request->from) : now()->startOfMonth();
        $to = $request->to ? now()->parse($request->to) : now();

        // Model stats
        $stats = AiUsageDaily::query()
            ->forModel($model->id)
            ->forDateRange($from, $to)
            ->selectRaw('
                COUNT(DISTINCT tenant_id) as active_tenants,
                SUM(requests_count) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(failed_requests) as failed_requests,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost,
                AVG(total_latency_ms / NULLIF(successful_requests, 0)) as avg_latency
            ')
            ->first();

        // Top tenants using this model
        $topTenants = AiUsageDaily::query()
            ->forModel($model->id)
            ->forDateRange($from, $to)
            ->select('tenant_id')
            ->selectRaw('
                SUM(requests_count) as total_requests,
                SUM(total_tokens) as total_tokens,
                SUM(cost_estimated) as total_cost
            ')
            ->groupBy('tenant_id')
            ->orderByDesc('total_requests')
            ->limit(10)
            ->with('tenant:id,name,slug')
            ->get();

        // Daily trend
        $dailyTrend = AiUsageDaily::query()
            ->forModel($model->id)
            ->forDateRange($from, $to)
            ->select('date')
            ->selectRaw('
                SUM(requests_count) as requests,
                SUM(total_tokens) as tokens,
                SUM(cost_estimated) as cost
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('master/ai/usage/model', [
            'model' => $model->only(['id', 'key', 'name', 'provider']),
            'stats' => $stats,
            'topTenants' => $topTenants,
            'dailyTrend' => $dailyTrend,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    /**
     * Export usage data.
     */
    public function export(Request $request)
    {
        $from = $request->from ? now()->parse($request->from) : now()->startOfMonth();
        $to = $request->to ? now()->parse($request->to) : now();

        $data = AiUsageDaily::query()
            ->forDateRange($from, $to)
            ->with(['tenant:id,name,slug', 'model:id,key,name'])
            ->orderBy('date')
            ->orderBy('tenant_id')
            ->get();

        // Generate CSV
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="ai-usage-' . $from->format('Y-m-d') . '-to-' . $to->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Date',
                'Tenant ID',
                'Tenant Name',
                'Model',
                'Requests',
                'Successful',
                'Failed',
                'Tokens In',
                'Tokens Out',
                'Total Tokens',
                'Tool Calls',
                'Cost Estimated',
            ]);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->date->format('Y-m-d'),
                    $row->tenant_id,
                    $row->tenant?->name ?? 'N/A',
                    $row->model?->key ?? 'N/A',
                    $row->requests_count,
                    $row->successful_requests,
                    $row->failed_requests,
                    $row->tokens_in,
                    $row->tokens_out,
                    $row->total_tokens,
                    $row->tool_calls_count,
                    number_format((float) $row->cost_estimated, 4),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
