<?php

namespace App\Http\Controllers\Master\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\Invoice;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->with([
                'tenant:id,name,slug,status',
                'subscription:id,plan_id,status',
            ])
            ->withCount('items')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                      ->orWhere('billing_name', 'like', "%{$search}%")
                      ->orWhere('billing_email', 'like', "%{$search}%")
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
            ->when($request->overdue, function ($query) {
                $query->overdue();
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('invoice_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('invoice_date', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total' => Invoice::count(),
            'total_due' => Invoice::where('status', Invoice::STATUS_OPEN)->sum('amount_due'),
            'total_paid' => Invoice::where('status', Invoice::STATUS_PAID)->sum('amount_paid'),
            'by_status' => Invoice::selectRaw('status, COUNT(*) as count, SUM(amount_due) as total')
                ->groupBy('status')
                ->get()
                ->keyBy('status')
                ->toArray(),
            'overdue' => Invoice::overdue()->count(),
            'overdue_amount' => Invoice::overdue()->sum('amount_due'),
        ];

        return Inertia::render('master/billing/invoices/index', [
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'provider', 'overdue', 'date_from', 'date_to', 'per_page']),
            'statuses' => Invoice::getStatuses(),
        ]);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice)
    {
        $invoice->load([
            'tenant:id,name,slug,status',
            'billingCustomer',
            'subscription.plan',
            'items',
            'payments' => function ($q) {
                $q->orderByDesc('created_at');
            },
        ]);

        return Inertia::render('master/billing/invoices/show', [
            'invoice' => $invoice,
            'statuses' => Invoice::getStatuses(),
        ]);
    }

    /**
     * Update the specified invoice (limited).
     */
    public function update(Request $request, Invoice $invoice)
    {
        // Only allow updating certain fields for internal invoices
        if ($invoice->provider && $invoice->provider !== 'internal') {
            return back()->with('error', 'Cannot modify invoices from external providers.');
        }

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in([Invoice::STATUS_VOID, Invoice::STATUS_UNCOLLECTIBLE])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (isset($validated['status']) && $validated['status'] === Invoice::STATUS_VOID) {
            $validated['voided_at'] = now();
        }

        $invoice->update($validated);

        return redirect()->route('billing.invoices.show', $invoice)
            ->with('success', 'Invoice updated successfully.');
    }

    /**
     * Mark invoice as paid (manual).
     */
    public function markAsPaid(Request $request, Invoice $invoice)
    {
        if ($invoice->status === Invoice::STATUS_PAID) {
            return back()->with('error', 'Invoice is already paid.');
        }

        if ($invoice->status === Invoice::STATUS_VOID) {
            return back()->with('error', 'Cannot mark voided invoice as paid.');
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $invoice->update([
            'status' => Invoice::STATUS_PAID,
            'amount_paid' => $invoice->amount_due,
            'amount_remaining' => 0,
            'paid_at' => now(),
            'notes' => $validated['notes'] ?? $invoice->notes,
        ]);

        return redirect()->route('billing.invoices.show', $invoice)
            ->with('success', 'Invoice marked as paid.');
    }

    /**
     * Void an invoice.
     */
    public function void(Request $request, Invoice $invoice)
    {
        if ($invoice->status === Invoice::STATUS_PAID) {
            return back()->with('error', 'Cannot void a paid invoice.');
        }

        if ($invoice->status === Invoice::STATUS_VOID) {
            return back()->with('error', 'Invoice is already voided.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $invoice->update([
            'status' => Invoice::STATUS_VOID,
            'voided_at' => now(),
            'notes' => ($invoice->notes ? $invoice->notes . "\n\n" : '') . "Voided: " . $validated['reason'],
        ]);

        return redirect()->route('billing.invoices.show', $invoice)
            ->with('success', 'Invoice voided successfully.');
    }
}
