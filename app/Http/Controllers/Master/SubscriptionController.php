<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionHistory;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions.
     */
    public function index(Request $request)
    {
        $subscriptions = Subscription::query()
            ->with([
                'tenant:id,name,slug,status',
                'plan:id,name,slug,price_monthly',
                'pendingPlan:id,name,slug,price_monthly',
            ])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('tenant', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plan, function ($query, $planId) {
                $query->where('plan_id', $planId);
            })
            ->when($request->has_pending_change, function ($query) {
                $query->whereNotNull('pending_plan_id');
            })
            ->when($request->expiring_soon, function ($query) {
                $query->expiringSoon(7);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Add computed properties
        $subscriptions->getCollection()->transform(function ($subscription) {
            $subscription->days_until_period_ends = $subscription->daysUntilPeriodEnds();
            $subscription->days_until_trial_ends = $subscription->daysUntilTrialEnds();
            return $subscription;
        });

        $plans = Plan::where('is_active', true)->select('id', 'name', 'slug')->get();

        // Get statistics
        $stats = [
            'total' => Subscription::count(),
            'by_status' => Subscription::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'with_pending_changes' => Subscription::whereNotNull('pending_plan_id')->count(),
            'expiring_soon' => Subscription::expiringSoon(7)->count(),
        ];

        return Inertia::render('master/subscriptions/index', [
            'subscriptions' => $subscriptions,
            'plans' => $plans,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'plan', 'has_pending_change', 'expiring_soon', 'per_page']),
            'statuses' => Subscription::getStatuses(),
        ]);
    }

    /**
     * Display the specified subscription.
     */
    public function show(Subscription $subscription)
    {
        $subscription->load([
            'tenant:id,name,slug,status,primary_domain',
            'plan',
            'pendingPlan',
            'cancelledByUser:id,name,email',
            'history' => function ($q) {
                $q->with([
                    'fromPlan:id,name',
                    'toPlan:id,name',
                    'performer:id,name,email',
                ])->limit(50);
            },
        ]);

        $plans = Plan::where('is_active', true)
            ->select('id', 'name', 'slug', 'price_monthly', 'price_yearly')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('master/subscriptions/show', [
            'subscription' => $subscription,
            'plans' => $plans,
            'statuses' => Subscription::getStatuses(),
        ]);
    }

    /**
     * Show the form for editing the subscription.
     */
    public function edit(Subscription $subscription)
    {
        $subscription->load([
            'tenant:id,name,slug',
            'plan',
            'pendingPlan',
        ]);

        $plans = Plan::where('is_active', true)
            ->select('id', 'name', 'slug', 'price_monthly', 'price_yearly', 'trial_days')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('master/subscriptions/edit', [
            'subscription' => $subscription,
            'plans' => $plans,
            'statuses' => Subscription::getStatuses(),
        ]);
    }

    /**
     * Update the specified subscription.
     */
    public function update(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'required', Rule::in(Subscription::getStatuses())],
            'auto_renew' => ['sometimes', 'boolean'],
            'current_period_end' => ['sometimes', 'nullable', 'date'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $oldStatus = $subscription->status;

        DB::transaction(function () use ($subscription, $validated, $oldStatus) {
            $subscription->update($validated);

            // Log status change if applicable
            if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
                SubscriptionHistory::create([
                    'subscription_id' => $subscription->id,
                    'tenant_id' => $subscription->tenant_id,
                    'event_type' => SubscriptionHistory::EVENT_STATUS_CHANGED,
                    'from_status' => $oldStatus,
                    'to_status' => $validated['status'],
                    'performed_by' => Auth::id(),
                    'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                    'reason' => $validated['admin_notes'] ?? null,
                ]);
            }
        });

        return redirect()->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription updated successfully.');
    }

    /**
     * Change the plan for a subscription.
     */
    public function changePlan(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id', 'different:' . $subscription->plan_id],
            'change_type' => ['required', Rule::in(['immediate', 'next_period'])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $newPlan = Plan::findOrFail($validated['plan_id']);
        $isUpgrade = $newPlan->price_monthly > $subscription->plan->price_monthly;

        DB::transaction(function () use ($subscription, $validated, $newPlan, $isUpgrade) {
            if ($validated['change_type'] === 'immediate') {
                // Immediate change
                $oldPlanId = $subscription->plan_id;
                $subscription->update([
                    'plan_id' => $validated['plan_id'],
                    'pending_plan_id' => null,
                    'change_effective_at' => null,
                    'change_type' => null,
                ]);

                SubscriptionHistory::create([
                    'subscription_id' => $subscription->id,
                    'tenant_id' => $subscription->tenant_id,
                    'event_type' => SubscriptionHistory::EVENT_PLAN_CHANGED,
                    'from_plan_id' => $oldPlanId,
                    'to_plan_id' => $validated['plan_id'],
                    'performed_by' => Auth::id(),
                    'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                    'reason' => $validated['reason'] ?? null,
                    'metadata' => ['change_type' => 'immediate'],
                ]);
            } else {
                // Schedule for next period
                $subscription->update([
                    'pending_plan_id' => $validated['plan_id'],
                    'change_effective_at' => $subscription->current_period_end,
                    'change_type' => 'next_period',
                ]);

                SubscriptionHistory::create([
                    'subscription_id' => $subscription->id,
                    'tenant_id' => $subscription->tenant_id,
                    'event_type' => $isUpgrade
                        ? SubscriptionHistory::EVENT_UPGRADE_SCHEDULED
                        : SubscriptionHistory::EVENT_DOWNGRADE_SCHEDULED,
                    'from_plan_id' => $subscription->plan_id,
                    'to_plan_id' => $validated['plan_id'],
                    'performed_by' => Auth::id(),
                    'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                    'reason' => $validated['reason'] ?? null,
                    'metadata' => [
                        'change_type' => 'next_period',
                        'effective_at' => $subscription->current_period_end?->toISOString(),
                    ],
                ]);
            }
        });

        $message = $validated['change_type'] === 'immediate'
            ? 'Plan changed successfully.'
            : 'Plan change scheduled for next billing period.';

        return redirect()->route('subscriptions.show', $subscription)
            ->with('success', $message);
    }

    /**
     * Cancel a subscription.
     */
    public function cancel(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
            'cancel_immediately' => ['boolean'],
        ]);

        $cancelImmediately = $validated['cancel_immediately'] ?? false;

        DB::transaction(function () use ($subscription, $validated, $cancelImmediately) {
            $oldStatus = $subscription->status;

            if ($cancelImmediately) {
                $subscription->update([
                    'status' => Subscription::STATUS_CANCELLED,
                    'cancellation_reason' => $validated['reason'],
                    'cancelled_at' => now(),
                    'cancelled_by' => Auth::id(),
                    'auto_renew' => false,
                ]);
            } else {
                // Mark to not renew at period end
                $subscription->update([
                    'auto_renew' => false,
                    'cancellation_reason' => $validated['reason'],
                    'cancelled_by' => Auth::id(),
                ]);
            }

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'event_type' => SubscriptionHistory::EVENT_CANCELLED,
                'from_status' => $oldStatus,
                'to_status' => $cancelImmediately ? Subscription::STATUS_CANCELLED : $oldStatus,
                'performed_by' => Auth::id(),
                'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                'reason' => $validated['reason'],
                'metadata' => ['immediate' => $cancelImmediately],
            ]);
        });

        $message = $cancelImmediately
            ? 'Subscription cancelled immediately.'
            : 'Subscription will be cancelled at the end of the current period.';

        return redirect()->route('subscriptions.show', $subscription)
            ->with('success', $message);
    }

    /**
     * Reactivate a cancelled subscription.
     */
    public function reactivate(Request $request, Subscription $subscription)
    {
        if (!in_array($subscription->status, [Subscription::STATUS_CANCELLED, Subscription::STATUS_EXPIRED])) {
            return back()->with('error', 'Only cancelled or expired subscriptions can be reactivated.');
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($subscription, $validated) {
            $oldStatus = $subscription->status;

            $subscription->update([
                'status' => Subscription::STATUS_ACTIVE,
                'auto_renew' => true,
                'cancellation_reason' => null,
                'cancelled_at' => null,
                'cancelled_by' => null,
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'event_type' => SubscriptionHistory::EVENT_REACTIVATED,
                'from_status' => $oldStatus,
                'to_status' => Subscription::STATUS_ACTIVE,
                'performed_by' => Auth::id(),
                'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                'reason' => $validated['reason'] ?? null,
            ]);
        });

        return redirect()->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription reactivated successfully.');
    }

    /**
     * Cancel pending plan change.
     */
    public function cancelPendingChange(Subscription $subscription)
    {
        if (!$subscription->pending_plan_id) {
            return back()->with('error', 'No pending plan change to cancel.');
        }

        DB::transaction(function () use ($subscription) {
            $pendingPlanId = $subscription->pending_plan_id;

            $subscription->update([
                'pending_plan_id' => null,
                'change_effective_at' => null,
                'change_type' => null,
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'event_type' => SubscriptionHistory::EVENT_STATUS_CHANGED,
                'from_plan_id' => $subscription->plan_id,
                'to_plan_id' => $pendingPlanId,
                'performed_by' => Auth::id(),
                'performed_by_type' => SubscriptionHistory::PERFORMER_USER,
                'reason' => 'Pending plan change cancelled',
                'metadata' => ['action' => 'cancelled_pending_change'],
            ]);
        });

        return redirect()->route('subscriptions.show', $subscription)
            ->with('success', 'Pending plan change cancelled.');
    }
}
