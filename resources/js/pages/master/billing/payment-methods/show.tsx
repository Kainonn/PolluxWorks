import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    Shield,
    Wallet,
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

interface BillingCustomer {
    id: number;
    name: string;
    email: string | null;
}

interface Payment {
    id: number;
    amount: number;
    currency: string;
    status: string;
    paid_at: string | null;
    created_at: string;
}

interface PaymentMethod {
    id: number;
    tenant_id: number;
    billing_customer_id: number | null;
    type: string;
    provider: string;
    provider_payment_method_id: string | null;
    brand: string | null;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
    holder_name: string | null;
    is_default: boolean;
    metadata: Record<string, unknown> | null;
    display_name: string;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    billing_customer: BillingCustomer | null;
    payments: Payment[];
}

interface Props {
    paymentMethod: PaymentMethod;
}

const typeIcons: Record<string, React.ElementType> = {
    card: CreditCard,
    bank_account: Shield,
    wallet: Wallet,
};

const typeLabels: Record<string, string> = {
    card: 'Credit/Debit Card',
    bank_account: 'Bank Account',
    wallet: 'Digital Wallet',
};

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800',
    openpay: 'bg-blue-100 text-blue-800',
    paypal: 'bg-yellow-100 text-yellow-800',
};

export default function Show({ paymentMethod }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: '/billing' },
        { title: 'Payment Methods', href: '/billing/payment-methods' },
        { title: paymentMethod.display_name, href: `/billing/payment-methods/${paymentMethod.id}` },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatMoney = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const isExpiringSoon = () => {
        if (!paymentMethod.exp_month || !paymentMethod.exp_year) return false;
        const now = new Date();
        const expDate = new Date(paymentMethod.exp_year, paymentMethod.exp_month, 0);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return expDate <= threeMonthsFromNow && expDate > now;
    };

    const isExpired = () => {
        if (!paymentMethod.exp_month || !paymentMethod.exp_year) return false;
        const now = new Date();
        const expDate = new Date(paymentMethod.exp_year, paymentMethod.exp_month, 0);
        return expDate < now;
    };

    const TypeIcon = typeIcons[paymentMethod.type] || CreditCard;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={paymentMethod.display_name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/billing/payment-methods">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <TypeIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        {paymentMethod.display_name}
                                    </h1>
                                    {paymentMethod.is_default && (
                                        <Badge className="bg-green-100 text-green-800">Default</Badge>
                                    )}
                                    {isExpired() && (
                                        <Badge variant="destructive">Expired</Badge>
                                    )}
                                    {isExpiringSoon() && !isExpired() && (
                                        <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">
                                    {typeLabels[paymentMethod.type] || paymentMethod.type}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Card Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Method Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Type
                                        </label>
                                        <p className="font-medium">
                                            {typeLabels[paymentMethod.type] || paymentMethod.type}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Provider
                                        </label>
                                        <div className="mt-1">
                                            <Badge className={providerColors[paymentMethod.provider]}>
                                                {paymentMethod.provider.charAt(0).toUpperCase() + paymentMethod.provider.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    {paymentMethod.brand && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Brand
                                            </label>
                                            <p className="font-medium capitalize">{paymentMethod.brand}</p>
                                        </div>
                                    )}
                                    {paymentMethod.last4 && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Last 4 Digits
                                            </label>
                                            <p className="font-medium font-mono">•••• {paymentMethod.last4}</p>
                                        </div>
                                    )}
                                    {paymentMethod.holder_name && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Holder Name
                                            </label>
                                            <p className="font-medium">{paymentMethod.holder_name}</p>
                                        </div>
                                    )}
                                    {paymentMethod.exp_month && paymentMethod.exp_year && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Expiration
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <p className={`font-medium ${isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-orange-600' : ''}`}>
                                                    {String(paymentMethod.exp_month).padStart(2, '0')}/{paymentMethod.exp_year}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {paymentMethod.provider_payment_method_id && (
                                    <>
                                        <Separator />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Provider ID
                                            </label>
                                            <p className="text-sm font-mono break-all">
                                                {paymentMethod.provider_payment_method_id}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Payments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Recent Payments
                                </CardTitle>
                                <CardDescription>
                                    Payments made using this payment method
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {paymentMethod.payments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paymentMethod.payments.slice(0, 10).map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <Link
                                                            href={`/billing/payments/${payment.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            #{payment.id}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatMoney(payment.amount, payment.currency)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(payment.paid_at || payment.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No payments made with this payment method
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        {paymentMethod.metadata && Object.keys(paymentMethod.metadata).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Metadata</CardTitle>
                                    <CardDescription>
                                        Additional information from the provider
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                                        {JSON.stringify(paymentMethod.metadata, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tenant */}
                        {paymentMethod.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/tenants/${paymentMethod.tenant.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {paymentMethod.tenant.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {paymentMethod.tenant.slug}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Billing Customer */}
                        {paymentMethod.billing_customer && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Billing Customer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/billing/customers/${paymentMethod.billing_customer.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {paymentMethod.billing_customer.name}
                                    </Link>
                                    {paymentMethod.billing_customer.email && (
                                        <p className="text-sm text-muted-foreground">
                                            {paymentMethod.billing_customer.email}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Added
                                    </label>
                                    <p className="text-sm">{formatDate(paymentMethod.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </label>
                                    <p className="text-sm">{formatDate(paymentMethod.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
