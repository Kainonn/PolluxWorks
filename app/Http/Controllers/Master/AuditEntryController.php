<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AuditEntry;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditEntryController extends Controller
{
    /**
     * Display a listing of audit entries.
     */
    public function index(Request $request)
    {
        $entries = AuditEntry::query()
            ->with(['actor:id,name,email', 'tenant:id,name,slug'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('entity_label', 'like', "%{$search}%")
                      ->orWhere('entity_id', 'like', "%{$search}%")
                      ->orWhere('actor_email', 'like', "%{$search}%")
                      ->orWhere('reason', 'like', "%{$search}%")
                      ->orWhere('correlation_id', 'like', "%{$search}%");
                });
            })
            ->when($request->action, function ($query, $action) {
                $query->where('action', $action);
            })
            ->when($request->entity_type, function ($query, $entityType) {
                $query->where('entity_type', $entityType);
            })
            ->when($request->entity_id, function ($query, $entityId) {
                $query->where('entity_id', $entityId);
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
            ->when($request->has_reason, function ($query, $hasReason) {
                if ($hasReason === 'yes') {
                    $query->whereNotNull('reason');
                } else {
                    $query->whereNull('reason');
                }
            })
            ->orderBy('occurred_at', 'desc')
            ->paginate($request->per_page ?? 25)
            ->withQueryString();

        // Statistics
        $stats = $this->getStats();

        // Get unique entity types from actual data
        $entityTypes = AuditEntry::select('entity_type')
            ->distinct()
            ->orderBy('entity_type')
            ->pluck('entity_type');

        // Get unique actions from actual data
        $actions = AuditEntry::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        // Get tenants for filter
        $tenants = Tenant::select('id', 'name', 'slug')
            ->orderBy('name')
            ->get();

        // Get users for filter
        $users = User::select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('master/audit-trail/index', [
            'entries' => $entries,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'action', 'entity_type', 'entity_id', 'actor_type',
                'actor_id', 'tenant_id', 'date_from', 'date_to', 'has_reason', 'per_page'
            ]),
            'actions' => $actions,
            'entityTypes' => $entityTypes,
            'actorTypes' => AuditEntry::getActorTypes(),
            'tenants' => $tenants,
            'users' => $users,
        ]);
    }

    /**
     * Display the specified audit entry.
     */
    public function show(AuditEntry $auditEntry)
    {
        $auditEntry->load(['actor:id,name,email', 'tenant:id,name,slug,status']);

        // Get entity history (other audit entries for the same entity)
        $entityHistory = AuditEntry::where('entity_type', $auditEntry->entity_type)
            ->where('entity_id', $auditEntry->entity_id)
            ->where('id', '!=', $auditEntry->id)
            ->with(['actor:id,name,email'])
            ->orderBy('occurred_at', 'desc')
            ->limit(20)
            ->get();

        // Verify integrity
        $integrityValid = $this->verifyEntryIntegrity($auditEntry);

        return Inertia::render('master/audit-trail/show', [
            'entry' => $auditEntry,
            'entityHistory' => $entityHistory,
            'integrityValid' => $integrityValid,
        ]);
    }

    /**
     * Verify audit entry integrity with a safe fallback.
     */
    protected function verifyEntryIntegrity($entry): bool
    {
        if (is_object($entry) && method_exists($entry, 'verifyIntegrity')) {
            return $entry->verifyIntegrity();
        }

        if (!is_object($entry) || !property_exists($entry, 'checksum')) {
            return true;
        }

        if ($entry->checksum === null || $entry->checksum === '') {
            return true;
        }

        $payload = $entry->checksum_payload ?? json_encode((array) $entry);
        return hash_equals((string) $entry->checksum, hash('sha256', $payload));
    }

    /**
     * Get audit statistics.
     */
    protected function getStats(): array
    {
        $today = now()->startOfDay();
        $last30Days = now()->subDays(30);

        return [
            'total' => AuditEntry::count(),
            'today' => AuditEntry::where('occurred_at', '>=', $today)->count(),
            'last_30_days' => AuditEntry::where('occurred_at', '>=', $last30Days)->count(),
            'by_action' => AuditEntry::selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'action')
                ->toArray(),
            'by_entity' => AuditEntry::selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->orderByDesc('count')
                ->pluck('count', 'entity_type')
                ->toArray(),
            'by_actor_type' => AuditEntry::selectRaw('actor_type, COUNT(*) as count')
                ->groupBy('actor_type')
                ->pluck('count', 'actor_type')
                ->toArray(),
            'with_reason' => AuditEntry::whereNotNull('reason')->count(),
        ];
    }

    /**
     * Export audit entries.
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,json',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $entries = AuditEntry::query()
            ->with(['actor:id,name,email', 'tenant:id,name,slug'])
            ->where('occurred_at', '>=', $request->date_from . ' 00:00:00')
            ->where('occurred_at', '<=', $request->date_to . ' 23:59:59')
            ->when($request->entity_type, function ($query, $entityType) {
                $query->where('entity_type', $entityType);
            })
            ->when($request->action, function ($query, $action) {
                $query->where('action', $action);
            })
            ->orderBy('occurred_at', 'desc')
            ->limit(10000) // Safety limit
            ->get();

        if ($request->input('format') === 'json') {
            return response()->json([
                'export_date' => now()->toISOString(),
                'date_range' => [
                    'from' => $request->date_from,
                    'to' => $request->date_to,
                ],
                'total_entries' => $entries->count(),
                'entries' => $entries,
            ]);
        }

        // CSV export
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit-trail-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($entries) {
            $file = fopen('php://output', 'w');

            // Headers
            fputcsv($file, [
                'ID', 'Occurred At', 'Actor Type', 'Actor ID', 'Actor Email',
                'Action', 'Entity Type', 'Entity ID', 'Entity Label',
                'Tenant ID', 'IP', 'Reason', 'Changes Count', 'Checksum Valid'
            ]);

            foreach ($entries as $entry) {
                fputcsv($file, [
                    $entry->id,
                    $entry->occurred_at->toISOString(),
                    $entry->actor_type,
                    $entry->actor_id,
                    $entry->actor_email,
                    $entry->action,
                    $entry->entity_type,
                    $entry->entity_id,
                    $entry->entity_label,
                    $entry->tenant_id,
                    $entry->ip,
                    $entry->reason,
                    $entry->changes_count,
                    $this->verifyEntryIntegrity($entry) ? 'Yes' : 'No',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get entity history (for AJAX requests).
     */
    public function entityHistory(Request $request)
    {
        $request->validate([
            'entity_type' => 'required|string',
            'entity_id' => 'required|string',
        ]);

        $history = AuditEntry::where('entity_type', $request->entity_type)
            ->where('entity_id', $request->entity_id)
            ->with(['actor:id,name,email'])
            ->orderBy('occurred_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($history);
    }
}
