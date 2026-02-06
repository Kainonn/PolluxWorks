<?php

namespace App\Http\Controllers\Master\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request)
    {
        $payments = Payment::query()
            ->with([
                'tenant:id,name,slug,status',
                'paymentMethod:id,type,brand,last4',
                'invoice:id,number,status',
            ])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('provider_payment_id', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('tenant', function ($tq) use ($search) {
                          $tq->where('name', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->provider, function ($query, $provider) {
                $query->where('provider', $provider);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total' => Payment::count(),
            'total_amount' => Payment::where('status', Payment::STATUS_SUCCEEDED)->sum('amount'),
            'by_status' => Payment::selectRaw('status, COUNT(*) as count, SUM(amount) as total')
                ->groupBy('status')
                ->get()
                ->keyBy('status')
                ->toArray(),
            'today' => Payment::whereDate('created_at', today())->count(),
            'today_amount' => Payment::where('status', Payment::STATUS_SUCCEEDED)
                ->whereDate('created_at', today())
                ->sum('amount'),
        ];

        return Inertia::render('master/billing/payments/index', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'provider', 'date_from', 'date_to', 'per_page']),
            'statuses' => Payment::getStatuses(),
        ]);
    }

    /**
     * Display the specified payment.
     */
    public function show(Payment $payment)
    {
        $payment->load([
            'tenant:id,name,slug,status',
            'billingCustomer',
            'paymentMethod',
            'invoice',
        ]);

        return Inertia::render('master/billing/payments/show', [
            'payment' => $payment,
        ]);
    }
}
