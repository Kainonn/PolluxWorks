<?php

namespace App\Http\Controllers\Master\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\BillingCustomer;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingCustomerController extends Controller
{
    /**
     * Display a listing of billing customers.
     */
    public function index(Request $request)
    {
        $customers = BillingCustomer::query()
            ->with(['tenant:id,name,slug,status'])
            ->withCount(['paymentMethods', 'payments', 'invoices'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('email', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('provider_customer_id', 'like', "%{$search}%")
                      ->orWhereHas('tenant', function ($tq) use ($search) {
                          $tq->where('name', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->provider, function ($query, $provider) {
                $query->where('provider', $provider);
            })
            ->when($request->is_active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total' => BillingCustomer::count(),
            'active' => BillingCustomer::where('is_active', true)->count(),
            'by_provider' => BillingCustomer::selectRaw('provider, COUNT(*) as count')
                ->groupBy('provider')
                ->pluck('count', 'provider')
                ->toArray(),
        ];

        return Inertia::render('master/billing/customers/index', [
            'customers' => $customers,
            'stats' => $stats,
            'filters' => $request->only(['search', 'provider', 'is_active', 'per_page']),
            'providers' => BillingCustomer::getProviders(),
        ]);
    }

    /**
     * Display the specified billing customer.
     */
    public function show(BillingCustomer $customer)
    {
        $customer->load([
            'tenant:id,name,slug,status',
            'paymentMethods' => function ($q) {
                $q->orderByDesc('is_default')->orderByDesc('created_at');
            },
            'payments' => function ($q) {
                $q->orderByDesc('created_at')->limit(20);
            },
            'invoices' => function ($q) {
                $q->orderByDesc('created_at')->limit(20);
            },
        ]);

        return Inertia::render('master/billing/customers/show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified billing customer.
     */
    public function update(Request $request, BillingCustomer $customer)
    {
        $validated = $request->validate([
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $customer->update($validated);

        return redirect()->route('billing.customers.show', $customer)
            ->with('success', 'Billing customer updated successfully.');
    }
}
