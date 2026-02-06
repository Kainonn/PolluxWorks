<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlatformNotification;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlatformNotificationController extends Controller
{
    /**
     * Display a listing of platform notifications.
     */
    public function index(Request $request)
    {
        $notifications = PlatformNotification::query()
            ->with('creator:id,name')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('body', 'like', "%{$search}%");
                });
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->severity, function ($query, $severity) {
                $query->where('severity', $severity);
            })
            ->when($request->filled('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Append computed status
        $notifications->getCollection()->transform(function ($notification) {
            $notification->append(['category_label', 'severity_label']);
            $notification->is_currently_active = $notification->isCurrentlyActive();
            return $notification;
        });

        return Inertia::render('master/notifications/index', [
            'notifications' => $notifications,
            'filters' => $request->only(['search', 'category', 'severity', 'is_active', 'per_page']),
            'categories' => PlatformNotification::categories(),
            'severities' => PlatformNotification::severities(),
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */
    public function create()
    {
        $plans = Plan::where('is_active', true)->select('id', 'name')->get();
        $tenants = Tenant::whereIn('status', [Tenant::STATUS_ACTIVE, Tenant::STATUS_TRIAL])
            ->select('id', 'name', 'slug')
            ->orderBy('name')
            ->get();

        return Inertia::render('master/notifications/create', [
            'plans' => $plans,
            'tenants' => $tenants,
            'categories' => PlatformNotification::categories(),
            'severities' => PlatformNotification::severities(),
        ]);
    }

    /**
     * Store a newly created notification.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::in(PlatformNotification::categories())],
            'severity' => ['required', Rule::in(PlatformNotification::severities())],
            'cta_label' => ['nullable', 'string', 'max:100'],
            'cta_url' => ['nullable', 'url', 'max:500'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'is_sticky' => ['boolean'],
            'targeting' => ['nullable', 'array'],
            'targeting.all' => ['nullable', 'boolean'],
            'targeting.plans' => ['nullable', 'array'],
            'targeting.plans.*' => ['integer', 'exists:plans,id'],
            'targeting.tenants' => ['nullable', 'array'],
            'targeting.tenants.*' => ['integer', 'exists:tenants,id'],
            'targeting.roles' => ['nullable', 'array'],
            'targeting.roles.*' => ['string'],
            'channels' => ['nullable', 'array'],
        ]);

        // Handle targeting: if no specific targeting, set to all
        if (empty($validated['targeting']) ||
            (empty($validated['targeting']['plans']) &&
             empty($validated['targeting']['tenants']) &&
             empty($validated['targeting']['roles']))) {
            $validated['targeting'] = ['all' => true];
        }

        // Convert empty strings to null for datetime fields
        $validated['starts_at'] = $validated['starts_at'] ?: null;
        $validated['ends_at'] = $validated['ends_at'] ?: null;
        $validated['cta_label'] = $validated['cta_label'] ?: null;
        $validated['cta_url'] = $validated['cta_url'] ?: null;

        $notification = PlatformNotification::create($validated);

        return redirect()
            ->route('master.notifications.index')
            ->with('success', 'Notification created successfully.');
    }

    /**
     * Display the specified notification.
     */
    public function show(PlatformNotification $notification)
    {
        $notification->load('creator:id,name', 'updater:id,name');
        $notification->append(['category_label', 'severity_label']);
        $notification->is_currently_active = $notification->isCurrentlyActive();

        // Get targeting details
        $targetingDetails = $this->getTargetingDetails($notification);

        return Inertia::render('master/notifications/show', [
            'notification' => $notification,
            'targetingDetails' => $targetingDetails,
        ]);
    }

    /**
     * Show the form for editing the notification.
     */
    public function edit(PlatformNotification $notification)
    {
        $plans = Plan::where('is_active', true)->select('id', 'name')->get();
        $tenants = Tenant::whereIn('status', [Tenant::STATUS_ACTIVE, Tenant::STATUS_TRIAL])
            ->select('id', 'name', 'slug')
            ->orderBy('name')
            ->get();

        return Inertia::render('master/notifications/edit', [
            'notification' => $notification,
            'plans' => $plans,
            'tenants' => $tenants,
            'categories' => PlatformNotification::categories(),
            'severities' => PlatformNotification::severities(),
        ]);
    }

    /**
     * Update the specified notification.
     */
    public function update(Request $request, PlatformNotification $notification)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::in(PlatformNotification::categories())],
            'severity' => ['required', Rule::in(PlatformNotification::severities())],
            'cta_label' => ['nullable', 'string', 'max:100'],
            'cta_url' => ['nullable', 'url', 'max:500'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'is_sticky' => ['boolean'],
            'targeting' => ['nullable', 'array'],
            'targeting.all' => ['nullable', 'boolean'],
            'targeting.plans' => ['nullable', 'array'],
            'targeting.plans.*' => ['integer', 'exists:plans,id'],
            'targeting.tenants' => ['nullable', 'array'],
            'targeting.tenants.*' => ['integer', 'exists:tenants,id'],
            'targeting.roles' => ['nullable', 'array'],
            'targeting.roles.*' => ['string'],
            'channels' => ['nullable', 'array'],
        ]);

        // Handle targeting
        if (empty($validated['targeting']) ||
            (empty($validated['targeting']['plans']) &&
             empty($validated['targeting']['tenants']) &&
             empty($validated['targeting']['roles']))) {
            $validated['targeting'] = ['all' => true];
        }

        // Convert empty strings to null for datetime fields
        $validated['starts_at'] = $validated['starts_at'] ?: null;
        $validated['ends_at'] = $validated['ends_at'] ?: null;
        $validated['cta_label'] = $validated['cta_label'] ?: null;
        $validated['cta_url'] = $validated['cta_url'] ?: null;

        $notification->update($validated);

        return redirect()
            ->route('master.notifications.index')
            ->with('success', 'Notification updated successfully.');
    }

    /**
     * Remove the specified notification.
     */
    public function destroy(PlatformNotification $notification)
    {
        $notification->delete();

        return redirect()
            ->route('master.notifications.index')
            ->with('success', 'Notification deleted successfully.');
    }

    /**
     * Toggle notification active status.
     */
    public function toggle(PlatformNotification $notification)
    {
        $notification->update(['is_active' => !$notification->is_active]);

        $status = $notification->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Notification {$status} successfully.");
    }

    /**
     * Duplicate a notification.
     */
    public function duplicate(PlatformNotification $notification)
    {
        $newNotification = $notification->replicate([
            'views_count',
            'reads_count',
            'clicks_count',
            'created_by',
            'updated_by',
        ]);

        $newNotification->title = $notification->title . ' (Copy)';
        $newNotification->is_active = false;
        $newNotification->views_count = 0;
        $newNotification->reads_count = 0;
        $newNotification->clicks_count = 0;
        $newNotification->save();

        return redirect()
            ->route('master.notifications.edit', $newNotification)
            ->with('success', 'Notification duplicated successfully.');
    }

    /**
     * Get statistics for notifications.
     */
    public function stats()
    {
        $stats = [
            'total' => PlatformNotification::count(),
            'active' => PlatformNotification::where('is_active', true)->count(),
            'byCategory' => PlatformNotification::selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category'),
            'bySeverity' => PlatformNotification::selectRaw('severity, count(*) as count')
                ->groupBy('severity')
                ->pluck('count', 'severity'),
            'totalViews' => PlatformNotification::sum('views_count'),
            'totalReads' => PlatformNotification::sum('reads_count'),
            'totalClicks' => PlatformNotification::sum('clicks_count'),
        ];

        return response()->json($stats);
    }

    /**
     * Get targeting details for display.
     */
    private function getTargetingDetails(PlatformNotification $notification): array
    {
        $targeting = $notification->targeting ?? [];
        $details = [
            'type' => 'all',
            'description' => 'All tenants',
            'plans' => [],
            'tenants' => [],
            'roles' => [],
        ];

        if (!empty($targeting['all'])) {
            return $details;
        }

        if (!empty($targeting['plans'])) {
            $details['type'] = 'plans';
            $details['plans'] = Plan::whereIn('id', $targeting['plans'])
                ->select('id', 'name')
                ->get()
                ->toArray();
            $details['description'] = 'Specific plans';
        }

        if (!empty($targeting['tenants'])) {
            $details['type'] = $details['type'] === 'plans' ? 'mixed' : 'tenants';
            $details['tenants'] = Tenant::whereIn('id', $targeting['tenants'])
                ->select('id', 'name', 'slug')
                ->get()
                ->toArray();
            $details['description'] = $details['type'] === 'mixed' ? 'Plans and tenants' : 'Specific tenants';
        }

        if (!empty($targeting['roles'])) {
            $details['type'] = 'roles';
            $details['roles'] = $targeting['roles'];
            $details['description'] = 'Specific roles';
        }

        return $details;
    }
}
