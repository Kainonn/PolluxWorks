<?php

namespace App\Http\Controllers\Master\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\WebhookEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookEventController extends Controller
{
    /**
     * Display a listing of webhook events.
     */
    public function index(Request $request)
    {
        $webhookEvents = WebhookEvent::query()
            ->with(['tenant:id,name,slug'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('provider_event_id', 'like', "%{$search}%")
                      ->orWhere('event_type', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->provider, function ($query, $provider) {
                $query->where('provider', $provider);
            })
            ->when($request->event_type, function ($query, $eventType) {
                $query->where('event_type', $eventType);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total' => WebhookEvent::count(),
            'by_status' => WebhookEvent::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_provider' => WebhookEvent::selectRaw('provider, COUNT(*) as count')
                ->groupBy('provider')
                ->pluck('count', 'provider')
                ->toArray(),
            'today' => WebhookEvent::whereDate('created_at', today())->count(),
            'failed_pending_retry' => WebhookEvent::readyForRetry()->count(),
        ];

        // Get unique event types for filter
        $eventTypes = WebhookEvent::select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        return Inertia::render('master/billing/webhooks/index', [
            'webhookEvents' => $webhookEvents,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'provider', 'event_type', 'date_from', 'date_to', 'per_page']),
            'statuses' => WebhookEvent::getStatuses(),
            'eventTypes' => $eventTypes,
        ]);
    }

    /**
     * Display the specified webhook event.
     */
    public function show(WebhookEvent $webhookEvent)
    {
        $webhookEvent->load(['tenant:id,name,slug,status']);

        return Inertia::render('master/billing/webhooks/show', [
            'webhookEvent' => $webhookEvent,
        ]);
    }

    /**
     * Retry processing a failed webhook event.
     */
    public function retry(WebhookEvent $webhookEvent)
    {
        if (!$webhookEvent->canRetry()) {
            return back()->with('error', 'This webhook event cannot be retried.');
        }

        // Reset status to pending for reprocessing
        $webhookEvent->update([
            'status' => WebhookEvent::STATUS_PENDING,
            'processing_error' => null,
            'next_retry_at' => null,
        ]);

        // Note: In a real implementation, you would dispatch a job here
        // to process the webhook. For now, we just reset the status.

        return redirect()->route('billing.webhooks.show', $webhookEvent)
            ->with('success', 'Webhook event queued for retry.');
    }

    /**
     * Mark a webhook event as ignored.
     */
    public function ignore(WebhookEvent $webhookEvent)
    {
        if ($webhookEvent->isProcessed()) {
            return back()->with('error', 'Cannot ignore a processed webhook event.');
        }

        $webhookEvent->markAsIgnored();

        return redirect()->route('billing.webhooks.show', $webhookEvent)
            ->with('success', 'Webhook event marked as ignored.');
    }
}
