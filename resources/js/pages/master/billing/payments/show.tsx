import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    FileText,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
}

interface PaymentMethod {
    id: number;
    type: string;
    brand: string | null;
    last4: string | null;
    display_name: string;
}

interface Invoice {
    id: number;
    number: string;
    status: string;
    amount_due: number;
}

interface Payment {
    id: number;
    tenant_id: number;
    billing_customer_id: number | null;
    payment_method_id: number | null;
    invoice_id: number | null;
    provider: string;
    provider_payment_id: string | null;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    provider_response: Record<string, unknown> | null;
    paid_at: string | null;
    failure_reason: string | null;
    refunded_amount: number;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    payment_method: PaymentMethod | null;
    invoice: Invoice | null;
}

interface Props {
    payment: Payment;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    succeeded: { label: 'Succeeded', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
    partial_refund: { label: 'Partial Refund', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800',
    openpay: 'bg-blue-100 text-blue-800',
    paypal: 'bg-yellow-100 text-yellow-800',
    internal: 'bg-gray-100 text-gray-800',
};

export default function Show({ payment }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: '/billing' },
        { title: 'Payments', href: '/billing/payments' },
        { title: `#${payment.id}`, href: `/billing/payments/${payment.id}` },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatMoney = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const statusData = statusConfig[payment.status];
    const StatusIcon = statusData?.icon || Clock;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment #${payment.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/billing/payments">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Payment #{payment.id}
                                </h1>
                                <Badge className={statusData?.color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusData?.label || payment.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                {formatMoney(payment.amount, payment.currency)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Amount
                                        </label>
                                        <p className="text-2xl font-bold">
                                            {formatMoney(payment.amount, payment.currency)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge className={statusData?.color} variant="outline">
                                                <StatusIcon className="mr-1 h-3 w-3" />
                                                {statusData?.label || payment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Provider
                                        </label>
                                        <div className="mt-1">
                                            <Badge className={providerColors[payment.provider]}>
                                                {payment.provider.charAt(0).toUpperCase() + payment.provider.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Currency
                                        </label>
                                        <p className="font-medium">{payment.currency.toUpperCase()}</p>
                                    </div>
                                </div>

                                {payment.description && (
                                    <>
                                        <Separator />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Description
                                            </label>
                                            <p className="mt-1">{payment.description}</p>
                                        </div>
                                    </>
                                )}

                                {payment.refunded_amount > 0 && (
                                    <>
                                        <Separator />
                                        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                                            <label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                                Refunded Amount
                                            </label>
                                            <p className="text-xl font-bold text-orange-600">
                                                {formatMoney(payment.refunded_amount, payment.currency)}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {payment.failure_reason && (
                                    <>
                                        <Separator />
                                        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                                            <label className="text-sm font-medium text-red-800 dark:text-red-200">
                                                Failure Reason
                                            </label>
                                            <p className="mt-1 text-red-700 dark:text-red-300">
                                                {payment.failure_reason}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Provider Response */}
                        {payment.provider_response && Object.keys(payment.provider_response).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Provider Response</CardTitle>
                                    <CardDescription>
                                        Raw response from {payment.provider}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                                        {JSON.stringify(payment.provider_response, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}

                        {/* Metadata */}
                        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Metadata</CardTitle>
                                    <CardDescription>
                                        Additional payment information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                                        {JSON.stringify(payment.metadata, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tenant */}
                        {payment.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/tenants/${payment.tenant.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {payment.tenant.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {payment.tenant.slug}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Payment Method */}
                        {payment.payment_method && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium">{payment.payment_method.display_name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {payment.payment_method.type}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice */}
                        {payment.invoice && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Invoice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/billing/invoices/${payment.invoice.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {payment.invoice.number}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {formatMoney(payment.invoice.amount_due, payment.currency)}
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
                                {payment.provider_payment_id && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Payment ID
                                        </label>
                                        <p className="text-sm font-mono break-all">
                                            {payment.provider_payment_id}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Created
                                    </label>
                                    <p className="text-sm">{formatDate(payment.created_at)}</p>
                                </div>
                                {payment.paid_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Paid At
                                        </label>
                                        <p className="text-sm">{formatDate(payment.paid_at)}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </label>
                                    <p className="text-sm">{formatDate(payment.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
