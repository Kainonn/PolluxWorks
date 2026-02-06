import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CreditCard,
    FileText,
    Receipt,
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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

interface PaymentMethod {
    id: number;
    type: string;
    brand: string | null;
    last4: string | null;
    exp_month: string | null;
    exp_year: string | null;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
}

interface Payment {
    id: number;
    amount: number;
    currency: string;
    status: string;
    paid_at: string | null;
    created_at: string;
}

interface Invoice {
    id: number;
    number: string;
    amount_due: number;
    status: string;
    invoice_date: string;
}

interface BillingCustomer {
    id: number;
    tenant_id: number;
    provider: string;
    provider_customer_id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    is_active: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    payment_methods: PaymentMethod[];
    payments: Payment[];
    invoices: Invoice[];
}

interface Props {
    customer: BillingCustomer;
}

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    openpay: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paypal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    internal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const paymentStatusColors: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const invoiceStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    void: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function Show({ customer }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: '/billing' },
        { title: 'Customers', href: '/billing/customers' },
        { title: customer.tenant?.name || customer.name || `Customer #${customer.id}`, href: `/billing/customers/${customer.id}` },
    ];

    const { data, setData, put, processing } = useForm({
        is_active: customer.is_active,
    });

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatMoney = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const handleToggleActive = (checked: boolean) => {
        setData('is_active', checked);
        put(`/billing/customers/${customer.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Billing Customer - ${customer.tenant?.name || customer.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/billing/customers">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {customer.tenant?.name || customer.name || 'Billing Customer'}
                            </h1>
                            <p className="text-muted-foreground">
                                Customer details and payment history
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-muted-foreground">Provider</Label>
                                        <div className="mt-1">
                                            <Badge className={providerColors[customer.provider]}>
                                                {customer.provider.charAt(0).toUpperCase() + customer.provider.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Customer ID</Label>
                                        <p className="font-mono text-sm">{customer.provider_customer_id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{customer.email || '—'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="font-medium">{customer.name || '—'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p className="font-medium">{customer.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Switch
                                                checked={data.is_active}
                                                onCheckedChange={handleToggleActive}
                                                disabled={processing}
                                            />
                                            <span className="text-sm">
                                                {data.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Methods
                                </CardTitle>
                                <CardDescription>
                                    Registered payment methods for this customer
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {customer.payment_methods.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead>Expires</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.payment_methods.map((method) => (
                                                <TableRow key={method.id}>
                                                    <TableCell className="font-medium capitalize">
                                                        {method.type}
                                                    </TableCell>
                                                    <TableCell>
                                                        {method.brand && (
                                                            <span className="capitalize">{method.brand} </span>
                                                        )}
                                                        {method.last4 && `•••• ${method.last4}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {method.exp_month && method.exp_year
                                                            ? `${method.exp_month}/${method.exp_year}`
                                                            : '—'
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {method.is_default && (
                                                                <Badge variant="outline">Default</Badge>
                                                            )}
                                                            <Badge variant={method.is_active ? 'default' : 'secondary'}>
                                                                {method.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">
                                        No payment methods registered.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Payments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Recent Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {customer.payments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Paid At</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell className="font-medium">
                                                        {formatMoney(payment.amount, payment.currency)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={paymentStatusColors[payment.status]}>
                                                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
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
                                    <p className="text-muted-foreground text-center py-4">
                                        No payments recorded.
                                    </p>
                                )}
                                {customer.payments.length > 0 && (
                                    <div className="mt-4">
                                        <Link href={`/billing/payments?customer=${customer.id}`}>
                                            <Button variant="outline" size="sm">View All Payments</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Invoices */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Recent Invoices
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {customer.invoices.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Number</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.invoices.map((invoice) => (
                                                <TableRow key={invoice.id}>
                                                    <TableCell>
                                                        <Link
                                                            href={`/billing/invoices/${invoice.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {invoice.number}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatMoney(invoice.amount_due)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={invoiceStatusColors[invoice.status]}>
                                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(invoice.invoice_date)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">
                                        No invoices recorded.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tenant Info */}
                        {customer.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="font-medium">{customer.tenant.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Slug</Label>
                                        <p className="font-medium">{customer.tenant.slug}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p className="font-medium capitalize">{customer.tenant.status}</p>
                                    </div>
                                    <Separator />
                                    <Link href={`/tenants/${customer.tenant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            View Tenant Details
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{formatDate(customer.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{formatDate(customer.updated_at)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment Methods</span>
                                    <span>{customer.payment_methods.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Payments</span>
                                    <span>{customer.payments.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Invoices</span>
                                    <span>{customer.invoices.length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
