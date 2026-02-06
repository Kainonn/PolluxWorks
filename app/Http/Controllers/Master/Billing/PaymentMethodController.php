<?php

namespace App\Http\Controllers\Master\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of payment methods.
     */
    public function index(Request $request)
    {
        $paymentMethods = PaymentMethod::query()
            ->with([
                'tenant:id,name,slug',
                'billingCustomer:id,provider,provider_customer_id,email',
            ])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('last4', 'like', "%{$search}%")
                      ->orWhere('holder_name', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      ->orWhereHas('tenant', function ($tq) use ($search) {
                          $tq->where('name', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->provider, function ($query, $provider) {
                $query->where('provider', $provider);
            })
            ->when($request->is_default !== null, function ($query) use ($request) {
                $query->where('is_default', $request->boolean('is_default'));
            })
            ->when($request->expiring_soon, function ($query) {
                $query->where('expires_at', '<=', now()->addDays(30))
                      ->where('expires_at', '>', now());
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total' => PaymentMethod::count(),
            'active' => PaymentMethod::where('is_active', true)->count(),
            'by_type' => PaymentMethod::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'expiring_soon' => PaymentMethod::where('expires_at', '<=', now()->addDays(30))
                ->where('expires_at', '>', now())
                ->count(),
        ];

        return Inertia::render('master/billing/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'provider', 'is_default', 'expiring_soon', 'per_page']),
            'types' => PaymentMethod::getTypes(),
        ]);
    }

    /**
     * Display the specified payment method.
     */
    public function show(PaymentMethod $paymentMethod)
    {
        $paymentMethod->load([
            'tenant:id,name,slug,status',
            'billingCustomer',
        ]);

        return Inertia::render('master/billing/payment-methods/show', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    /**
     * Update the specified payment method (limited - mostly read-only).
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $paymentMethod->update($validated);

        return redirect()->route('billing.payment-methods.show', $paymentMethod)
            ->with('success', 'Payment method updated successfully.');
    }
}
