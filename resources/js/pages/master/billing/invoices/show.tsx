import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Package,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
}

interface Subscription {
    id: number;
    status: string;
    plan: {
        id: number;
        name: string;
    } | null;
}

interface InvoiceItem {
    id: number;
    type: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

interface Payment {
    id: number;
    amount: number;
    status: string;
    paid_at: string | null;
}

interface Invoice {
    id: number;
    tenant_id: number;
    subscription_id: number | null;
    billing_customer_id: number | null;
    number: string;
    provider: string;
    provider_invoice_id: string | null;
    amount_due: number;
    amount_paid: number;
    amount_remaining: number;
    currency: string;
    status: string;
    invoice_date: string;
    due_date: string;
    paid_at: string | null;
    notes: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    subscription: Subscription | null;
    items: InvoiceItem[];
    payments: Payment[];
}

interface Props {
    invoice: Invoice;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: FileText },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    void: { label: 'Void', color: 'bg-red-100 text-red-800', icon: XCircle },
    uncollectible: { label: 'Uncollectible', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

const itemTypeLabels: Record<string, string> = {
    subscription: 'Subscription',
    proration: 'Proration',
    addon: 'Add-on',
    usage: 'Usage',
    fee: 'Fee',
    credit: 'Credit',
};

export default function Show({ invoice }: Props) {
    const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: '/billing' },
        { title: 'Invoices', href: '/billing/invoices' },
        { title: invoice.number, href: `/billing/invoices/${invoice.id}` },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatMoney = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const isOverdue = invoice.status === 'open' && new Date(invoice.due_date) < new Date();
    const statusData = statusConfig[invoice.status];
    const StatusIcon = statusData?.icon || Clock;

    const handleMarkAsPaid = () => {
        router.post(`/billing/invoices/${invoice.id}/mark-as-paid`, {}, {
            onSuccess: () => setShowMarkPaidDialog(false),
        });
    };

    const handleVoid = () => {
        router.post(`/billing/invoices/${invoice.id}/void`, {}, {
            onSuccess: () => setShowVoidDialog(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/billing/invoices">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Invoice {invoice.number}
                                </h1>
                                <Badge className={statusData?.color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusData?.label || invoice.status}
                                </Badge>
                                {isOverdue && (
                                    <Badge variant="destructive">Overdue</Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                {invoice.tenant?.name || 'Unknown tenant'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {invoice.status === 'open' && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={() => setShowMarkPaidDialog(true)}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowVoidDialog(true)}
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Void Invoice
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invoice Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Invoice Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-sm text-muted-foreground">Amount Due</p>
                                        <p className="text-2xl font-bold">
                                            {formatMoney(invoice.amount_due, invoice.currency)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatMoney(invoice.amount_paid, invoice.currency)}
                                        </p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${invoice.amount_remaining > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}>
                                        <p className="text-sm text-muted-foreground">Amount Remaining</p>
                                        <p className={`text-2xl font-bold ${invoice.amount_remaining > 0 ? 'text-red-600' : ''}`}>
                                            {formatMoney(invoice.amount_remaining, invoice.currency)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Line Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Line Items
                                </CardTitle>
                                <CardDescription>
                                    Items included in this invoice
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items.length > 0 ? (
                                            invoice.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {itemTypeLabels[item.type] || item.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatMoney(item.unit_price, invoice.currency)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatMoney(item.amount, invoice.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No line items
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={4} className="font-bold text-right">
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatMoney(invoice.amount_due, invoice.currency)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Payments */}
                        {invoice.payments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Payments
                                    </CardTitle>
                                    <CardDescription>
                                        Payments applied to this invoice
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment ID</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoice.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <Link
                                                            href={`/billing/payments/${payment.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            #{payment.id}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(payment.paid_at)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatMoney(payment.amount, invoice.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {invoice.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {invoice.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dates</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Invoice Date
                                    </label>
                                    <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Due Date
                                    </label>
                                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                        {formatDate(invoice.due_date)}
                                    </p>
                                </div>
                                {invoice.paid_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Paid At
                                        </label>
                                        <p className="font-medium">{formatDate(invoice.paid_at)}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tenant */}
                        {invoice.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/tenants/${invoice.tenant.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {invoice.tenant.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {invoice.tenant.slug}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Subscription */}
                        {invoice.subscription && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/subscriptions/${invoice.subscription.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {invoice.subscription.plan?.name || 'View Subscription'}
                                    </Link>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {invoice.subscription.status}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Provider Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Provider
                                    </label>
                                    <p className="capitalize">{invoice.provider}</p>
                                </div>
                                {invoice.provider_invoice_id && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Provider Invoice ID
                                        </label>
                                        <p className="text-sm font-mono break-all">
                                            {invoice.provider_invoice_id}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mark as Paid Dialog */}
            <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Invoice as Paid</DialogTitle>
                        <DialogDescription>
                            This will mark invoice {invoice.number} as paid. This action
                            should only be used for manual payments that were received
                            outside the payment system.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowMarkPaidDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleMarkAsPaid}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Void Dialog */}
            <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to void invoice {invoice.number}?
                            This action cannot be undone. The invoice will be marked
                            as void and no further payments can be applied.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowVoidDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleVoid}>
                            <Ban className="mr-2 h-4 w-4" />
                            Void Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
