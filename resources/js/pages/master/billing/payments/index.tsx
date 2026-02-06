import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Eye,
    MoreHorizontal,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
}

interface Invoice {
    id: number;
    number: string;
    status: string;
}

interface Payment {
    id: number;
    tenant_id: number;
    provider: string;
    provider_payment_id: string | null;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    paid_at: string | null;
    failure_reason: string | null;
    created_at: string;
    tenant: Tenant | null;
    payment_method: PaymentMethod | null;
    invoice: Invoice | null;
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    total_amount: number;
    by_status: Record<string, { count: number; total: number }>;
    today: number;
    today_amount: number;
}

interface Props {
    payments: PaginatedPayments;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        provider?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
    { title: 'Payments', href: '/billing/payments' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: RefreshCw },
    succeeded: { label: 'Succeeded', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle },
    refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: RefreshCw },
    partial_refund: { label: 'Partial Refund', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
};

export default function Index({ payments, stats, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...filters, ...newFilters };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/billing/payments', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
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

    const columns: Column<Payment>[] = useMemo(
        () => [
            {
                key: 'tenant',
                header: 'Tenant',
                headerClassName: 'w-48',
                cell: (payment) => (
                    <div className="flex flex-col">
                        <Link
                            href={`/billing/payments/${payment.id}`}
                            className="font-medium hover:text-primary hover:underline"
                        >
                            {payment.tenant?.name || 'Unknown'}
                        </Link>
                        {payment.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">
                                {payment.description}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'amount',
                header: 'Amount',
                cell: (payment) => (
                    <span className="font-semibold">
                        {formatMoney(payment.amount, payment.currency)}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (payment) => {
                    const config = statusConfig[payment.status];
                    const StatusIcon = config?.icon || Clock;
                    return (
                        <Badge className={config?.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config?.label || payment.status}
                        </Badge>
                    );
                },
            },
            {
                key: 'provider',
                header: 'Provider',
                cell: (payment) => (
                    <span className="capitalize">{payment.provider}</span>
                ),
            },
            {
                key: 'payment_method',
                header: 'Method',
                cell: (payment) => (
                    payment.payment_method ? (
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                {payment.payment_method.brand && (
                                    <span className="capitalize">{payment.payment_method.brand} </span>
                                )}
                                {payment.payment_method.last4 && `•••• ${payment.payment_method.last4}`}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                ),
            },
            {
                key: 'date',
                header: 'Date',
                cell: (payment) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(payment.paid_at || payment.created_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (payment) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/billing/payments/${payment.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {payment.invoice && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/billing/invoices/${payment.invoice.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Invoice
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">
                        View and manage payment transactions
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(stats.total_amount)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Payments</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatMoney(stats.today_amount)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Succeeded</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.by_status?.succeeded?.count || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <form onSubmit={handleSearch} className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by payment ID, reference, or tenant..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </form>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => applyFilters({ status: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {statuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusConfig[status]?.label || status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => applyFilters({ date_from: e.target.value, page: '1' })}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="From"
                            />
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => applyFilters({ date_to: e.target.value, page: '1' })}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="To"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/billing/payments')}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={payments.data}
                    getRowKey={(payment) => payment.id}
                    pagination={{
                        current_page: payments.current_page,
                        last_page: payments.last_page,
                        per_page: payments.per_page,
                        total: payments.total,
                        from: payments.from,
                        to: payments.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
