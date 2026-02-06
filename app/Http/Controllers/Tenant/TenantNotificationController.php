<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\PlatformNotification;
use App\Models\Tenant\PlatformNotificationRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantNotificationController extends Controller
{
    /**
     * Get current tenant and plan info from app container.
     */
    private function getTenantContext(): array
    {
        // Get tenant from app container (set by IdentifyTenant middleware)
        $tenant = app('tenant');

        return [
            'tenant_id' => $tenant?->id,
            'plan_id' => $tenant?->plan_id,
        ];
    }

    /**
     * Display list of notifications for the tenant.
     */
    public function index(Request $request)
    {
        $user = Auth::guard('tenant')->user();

        if (!$user) {
            return redirect()->route('tenant.login');
        }

        $context = $this->getTenantContext();

        // Fetch active notifications from master that target this tenant
        $notificationsQuery = PlatformNotification::query()
            ->active()
            ->currentlyValid()
            ->forTenant($context['tenant_id'], $context['plan_id'])
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->orderByRaw("FIELD(severity, 'critical', 'warning', 'info')")
            ->orderBy('created_at', 'desc');

        $notifications = $notificationsQuery
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Get read statuses for current user
        $readStatuses = PlatformNotificationRead::where('user_id', $user->id)
            ->whereIn('notification_id', $notifications->pluck('id'))
            ->get()
            ->keyBy('notification_id');

        // Merge read status into notifications
        $notifications->getCollection()->transform(function ($notification) use ($readStatuses) {
            $notification->append(['category_label', 'severity_label']);
            $readStatus = $readStatuses->get($notification->id);

            $notification->is_read = $readStatus?->read_at !== null;
            $notification->is_viewed = $readStatus?->viewed_at !== null;
            $notification->is_dismissed = $readStatus?->dismissed_at !== null;
            $notification->read_at = $readStatus?->read_at;

            return $notification;
        });

        return Inertia::render('tenant/notifications/index', [
            'notifications' => $notifications,
            'filters' => $request->only(['category', 'per_page']),
            'categories' => PlatformNotification::categories(),
        ]);
    }

    /**
     * Get notifications for the dropdown (latest unread + important).
     * This is called via AJAX for the navbar bell icon.
     */
    public function dropdown()
    {
        $user = Auth::guard('tenant')->user();

        if (!$user) {
            return response()->json(['notifications' => [], 'unread_count' => 0]);
        }

        $context = $this->getTenantContext();

        // Get active notifications for this tenant
        $notifications = PlatformNotification::query()
            ->active()
            ->currentlyValid()
            ->forTenant($context['tenant_id'], $context['plan_id'])
            ->orderByRaw("FIELD(severity, 'critical', 'warning', 'info')")
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get read statuses
        $readStatuses = PlatformNotificationRead::where('user_id', $user->id)
            ->whereIn('notification_id', $notifications->pluck('id'))
            ->get()
            ->keyBy('notification_id');

        // Get IDs of dismissed notifications
        $dismissedIds = $readStatuses->filter(fn($s) => $s->dismissed_at !== null)->keys();

        // Get IDs of read notifications
        $readIds = $readStatuses->filter(fn($s) => $s->read_at !== null)->keys();

        // Filter out dismissed and read (unless sticky and unread)
        $notifications = $notifications->filter(function ($notification) use ($readStatuses, $dismissedIds, $readIds) {
            $readStatus = $readStatuses->get($notification->id);

            // Keep sticky notifications until read
            if ($notification->is_sticky && !$readStatus?->read_at) {
                return true;
            }

            // Filter out dismissed
            if ($dismissedIds->contains($notification->id)) {
                return false;
            }

            // Filter out already read notifications from dropdown
            if ($readIds->contains($notification->id)) {
                return false;
            }

            return true;
        })->values();

        // Add read status to each
        $notifications = $notifications->map(function ($notification) use ($readStatuses) {
            $readStatus = $readStatuses->get($notification->id);

            return [
                'id' => $notification->id,
                'title' => $notification->title,
                'body' => Str::limit($notification->body, 100),
                'category' => $notification->category,
                'severity' => $notification->severity,
                'cta_label' => $notification->cta_label,
                'cta_url' => $notification->cta_url,
                'is_sticky' => $notification->is_sticky,
                'is_read' => $readStatus?->read_at !== null,
                'created_at' => $notification->created_at->toISOString(),
            ];
        });

        // Count unread
        $unreadCount = $notifications->filter(fn($n) => !$n['is_read'])->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get unread count only (for badge polling).
     */
    public function unreadCount()
    {
        $user = Auth::guard('tenant')->user();
        $context = $this->getTenantContext();

        // Get active notification IDs for this tenant
        $notificationIds = PlatformNotification::query()
            ->active()
            ->currentlyValid()
            ->forTenant($context['tenant_id'], $context['plan_id'])
            ->pluck('id');

        // Count how many are not read
        $readNotificationIds = PlatformNotificationRead::where('user_id', $user->id)
            ->whereIn('notification_id', $notificationIds)
            ->whereNotNull('read_at')
            ->pluck('notification_id');

        $unreadCount = $notificationIds->diff($readNotificationIds)->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $notificationId = (int) $request->route('notificationId');
        $user = Auth::guard('tenant')->user();

        $readStatus = PlatformNotificationRead::findOrCreateForNotification(
            $notificationId,
            $user->id
        );

        $wasUnread = !$readStatus->isRead();
        $readStatus->markAsRead();

        // Increment read count on master (fire and forget, could be queued)
        if ($wasUnread) {
            try {
                PlatformNotification::where('id', $notificationId)->increment('reads_count');
            } catch (\Exception $e) {
                // Log but don't fail
                Log::warning("Failed to increment read count for notification {$notificationId}: " . $e->getMessage());
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        $user = Auth::guard('tenant')->user();
        $context = $this->getTenantContext();

        // Get active notification IDs for this tenant
        $notificationIds = PlatformNotification::query()
            ->active()
            ->currentlyValid()
            ->forTenant($context['tenant_id'], $context['plan_id'])
            ->pluck('id');

        $now = now();
        $newlyRead = 0;

        foreach ($notificationIds as $notificationId) {
            $readStatus = PlatformNotificationRead::firstOrCreate(
                [
                    'notification_id' => $notificationId,
                    'user_id' => $user->id,
                ],
                [
                    'viewed_at' => $now,
                ]
            );

            if (!$readStatus->read_at) {
                $readStatus->update(['read_at' => $now]);
                $newlyRead++;
            }
        }

        // Batch update read counts on master
        if ($newlyRead > 0) {
            try {
                PlatformNotification::whereIn('id', $notificationIds)
                    ->increment('reads_count');
            } catch (\Exception $e) {
                Log::warning("Failed to batch increment read counts: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'marked_count' => $newlyRead,
        ]);
    }

    /**
     * Dismiss a notification (hide from dropdown but keep in history).
     */
    public function dismiss(Request $request, $notificationId)
    {
        $notificationId = (int) $request->route('notificationId');
        $user = Auth::guard('tenant')->user();

        // Check if notification is sticky
        $notificationModel = PlatformNotification::find($notificationId);

        if ($notificationModel && $notificationModel->is_sticky) {
            $readStatus = PlatformNotificationRead::where('notification_id', $notificationId)
                ->where('user_id', $user->id)
                ->first();

            // Can't dismiss sticky until read
            if (!$readStatus || !$readStatus->read_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'This notification must be read before dismissing.',
                ], 422);
            }
        }

        $readStatus = PlatformNotificationRead::findOrCreateForNotification(
            $notificationId,
            $user->id
        );

        $readStatus->markAsDismissed();

        return response()->json(['success' => true]);
    }

    /**
     * Track CTA click.
     */
    public function trackClick(Request $request, $notificationId)
    {
        $notificationId = (int) $request->route('notificationId');
        $user = Auth::guard('tenant')->user();

        $readStatus = PlatformNotificationRead::findOrCreateForNotification(
            $notificationId,
            $user->id
        );

        $readStatus->markAsClicked();

        // Increment click count on master
        try {
            PlatformNotification::where('id', $notificationId)->increment('clicks_count');
        } catch (\Exception $e) {
            Log::warning("Failed to increment click count for notification {$notificationId}: " . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark notification as viewed (when dropdown opens).
     */
    public function markAsViewed(Request $request)
    {
        $user = Auth::guard('tenant')->user();
        $notificationIds = $request->input('notification_ids', []);

        if (empty($notificationIds)) {
            return response()->json(['success' => true]);
        }

        $now = now();
        $newlyViewed = 0;

        foreach ($notificationIds as $notificationId) {
            $readStatus = PlatformNotificationRead::firstOrCreate(
                [
                    'notification_id' => $notificationId,
                    'user_id' => $user->id,
                ]
            );

            if (!$readStatus->viewed_at) {
                $readStatus->update(['viewed_at' => $now]);
                $newlyViewed++;
            }
        }

        // Batch update view counts on master
        if ($newlyViewed > 0) {
            try {
                PlatformNotification::whereIn('id', $notificationIds)
                    ->increment('views_count');
            } catch (\Exception $e) {
                Log::warning("Failed to batch increment view counts: " . $e->getMessage());
            }
        }

        return response()->json(['success' => true]);
    }
}
