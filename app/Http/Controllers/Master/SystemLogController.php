<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use App\Models\Tenant;
use App\Models\User;
use App\Services\LogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemLogController extends Controller
{
    /**
     * Display a listing of system logs.
     */
    public function index(Request $request)
    {
        $logs = SystemLog::query()
            ->with(['actor:id,name,email', 'tenant:id,name,slug'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('message', 'like', "%{$search}%")
                      ->orWhere('event_type', 'like', "%{$search}%")
                      ->orWhere('correlation_id', 'like', "%{$search}%")
                      ->orWhere('ip', 'like', "%{$search}%");
                });
            })
            ->when($request->event_type, function ($query, $eventType) {
                $query->where('event_type', $eventType);
            })
            ->when($request->category, function ($query, $category) {
                $query->where('event_type', 'like', "{$category}.%");
            })
            ->when($request->severity, function ($query, $severity) {
                $query->where('severity', $severity);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->actor_type, function ($query, $actorType) {
                $query->where('actor_type', $actorType);
            })
            ->when($request->actor_id, function ($query, $actorId) {
                $query->where('actor_id', $actorId);
            })
            ->when($request->tenant_id, function ($query, $tenantId) {
                $query->where('tenant_id', $tenantId);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('occurred_at', '>=', $dateFrom . ' 00:00:00');
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('occurred_at', '<=', $dateTo . ' 23:59:59');
            })
            ->when($request->correlation_id, function ($query, $correlationId) {
                $query->where('correlation_id', $correlationId);
            })
            ->orderBy('occurred_at', 'desc')
            ->paginate($request->per_page ?? 25)
            ->withQueryString();

        // Statistics
        $stats = $this->getStats();

        // Get unique event types for filter
        $eventTypes = SystemLog::select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        // Get tenants for filter
        $tenants = Tenant::select('id', 'name', 'slug')
            ->orderBy('name')
            ->get();

        // Get users for filter
        $users = User::select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('master/system-logs/index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'event_type', 'category', 'severity', 'status',
                'actor_type', 'actor_id', 'tenant_id', 'date_from', 'date_to',
                'correlation_id', 'per_page'
            ]),
            'severities' => SystemLog::getSeverities(),
            'statuses' => SystemLog::getStatuses(),
            'actorTypes' => SystemLog::getActorTypes(),
            'categories' => SystemLog::getCategories(),
            'eventTypes' => $eventTypes,
            'tenants' => $tenants,
            'users' => $users,
        ]);
    }

    /**
     * Display the specified system log.
     */
    public function show(SystemLog $systemLog)
    {
        $systemLog->load(['actor:id,name,email', 'tenant:id,name,slug,status']);

        // Get related logs by correlation ID
        $relatedLogs = collect();
        if ($systemLog->correlation_id) {
            $relatedLogs = SystemLog::where('correlation_id', $systemLog->correlation_id)
                ->where('id', '!=', $systemLog->id)
                ->with(['actor:id,name,email'])
                ->orderBy('occurred_at')
                ->get();
        }

        return Inertia::render('master/system-logs/show', [
            'log' => $systemLog,
            'relatedLogs' => $relatedLogs,
        ]);
    }

    /**
     * Get logs statistics.
     */
    protected function getStats(): array
    {
        $today = now()->startOfDay();
        $last24h = now()->subHours(24);

        return [
            'total' => SystemLog::count(),
            'today' => SystemLog::where('occurred_at', '>=', $today)->count(),
            'last_24h' => SystemLog::where('occurred_at', '>=', $last24h)->count(),
            'by_severity' => SystemLog::selectRaw('severity, COUNT(*) as count')
                ->groupBy('severity')
                ->pluck('count', 'severity')
                ->toArray(),
            'by_status' => SystemLog::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_category' => SystemLog::selectRaw("SUBSTRING_INDEX(event_type, '.', 1) as category, COUNT(*) as count")
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'errors_today' => SystemLog::where('occurred_at', '>=', $today)
                ->whereIn('severity', [SystemLog::SEVERITY_ERROR, SystemLog::SEVERITY_CRITICAL])
                ->count(),
            'failed_today' => SystemLog::where('occurred_at', '>=', $today)
                ->where('status', SystemLog::STATUS_FAILED)
                ->count(),
        ];
    }

    /**
     * Export logs (optional future feature).
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,json',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $logs = SystemLog::query()
            ->where('occurred_at', '>=', $request->date_from . ' 00:00:00')
            ->where('occurred_at', '<=', $request->date_to . ' 23:59:59')
            ->when($request->severity, function ($query, $severity) {
                $query->where('severity', $severity);
            })
            ->orderBy('occurred_at', 'desc')
            ->limit(10000) // Safety limit
            ->get();

        if ($request->input('format') === 'json') {
            return response()->json($logs);
        }

        // CSV export
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="system-logs-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            // Headers
            fputcsv($file, [
                'ID', 'Occurred At', 'Event Type', 'Severity', 'Status',
                'Actor Type', 'Actor ID', 'Tenant ID', 'Target Type', 'Target ID',
                'IP', 'Message', 'Correlation ID'
            ]);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->occurred_at->toISOString(),
                    $log->event_type,
                    $log->severity,
                    $log->status,
                    $log->actor_type,
                    $log->actor_id,
                    $log->tenant_id,
                    $log->target_type,
                    $log->target_id,
                    $log->ip,
                    $log->message,
                    $log->correlation_id,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
