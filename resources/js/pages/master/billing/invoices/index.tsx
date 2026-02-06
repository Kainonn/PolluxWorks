import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    Eye,
    FileText,
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

interface Subscription {
    id: number;
    plan_id: number;
    status: string;
}

interface Invoice {
    id: number;
    tenant_id: number;
    number: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: string;
    invoice_date: string;
    due_date: string;
    created_at: string;
    tenant: Tenant | null;
    subscription: Subscription | null;
    items_count: number;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    total_due: number;
    total_paid: number;
    by_status: Record<string, { count: number; total: number }>;
    overdue: number;
    overdue_amount: number;
}

interface Props {
    invoices: PaginatedInvoices;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        provider?: string;
        overdue?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
    { title: 'Invoices', href: '/billing/invoices' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: FileText },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    void: { label: 'Void', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    uncollectible: { label: 'Uncollectible', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
};

export default function Index({ invoices, stats, filters, statuses }: Props) {
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
        router.get('/billing/invoices', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const formatDate = (date: string) => {
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

    const isOverdue = (invoice: Invoice) => {
        return invoice.status === 'open' && new Date(invoice.due_date) < new Date();
    };

    const columns: Column<Invoice>[] = useMemo(
        () => [
            {
                key: 'number',
                header: 'Invoice',
                headerClassName: 'w-40',
                cell: (invoice) => (
                    <div className="flex flex-col">
                        <Link
                            href={`/billing/invoices/${invoice.id}`}
                            className="font-medium hover:text-primary hover:underline"
                        >
                            {invoice.number}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                            {invoice.items_count} item{invoice.items_count !== 1 ? 's' : ''}
                        </span>
                    </div>
                ),
            },
            {
                key: 'tenant',
                header: 'Tenant',
                cell: (invoice) => (
                    <span className="font-medium">
                        {invoice.tenant?.name || 'Unknown'}
                    </span>
                ),
            },
            {
                key: 'amount',
                header: 'Amount',
                cell: (invoice) => (
                    <div className="flex flex-col">
                        <span className="font-semibold">
                            {formatMoney(invoice.amount_due, invoice.currency)}
                        </span>
                        {invoice.amount_paid > 0 && invoice.amount_paid < invoice.amount_due && (
                            <span className="text-xs text-muted-foreground">
                                Paid: {formatMoney(invoice.amount_paid, invoice.currency)}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (invoice) => {
                    const config = statusConfig[invoice.status];
                    const StatusIcon = config?.icon || Clock;
                    return (
                        <div className="flex flex-col gap-1">
                            <Badge className={config?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config?.label || invoice.status}
                            </Badge>
                            {isOverdue(invoice) && (
                                <Badge variant="destructive" className="text-xs">
                                    Overdue
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'invoice_date',
                header: 'Invoice Date',
                cell: (invoice) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(invoice.invoice_date)}
                    </span>
                ),
            },
            {
                key: 'due_date',
                header: 'Due Date',
                cell: (invoice) => (
                    <span className={`text-sm ${isOverdue(invoice) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {formatDate(invoice.due_date)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (invoice) => (
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
                                <Link href={`/billing/invoices/${invoice.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {invoice.tenant && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/tenants/${invoice.tenant.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Tenant
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
            <Head title="Invoices" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">
                        View and manage billing invoices
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(stats.total_due)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(stats.total_paid)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatMoney(stats.overdue_amount)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid Count</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.by_status?.paid?.count || 0}
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
                                    placeholder="Search by invoice number, tenant, or email..."
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
                            <Button
                                variant={filters.overdue ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => applyFilters({ overdue: filters.overdue ? '' : '1', page: '1' })}
                            >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Overdue Only
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/billing/invoices')}
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
                    data={invoices.data}
                    getRowKey={(invoice) => invoice.id}
                    pagination={{
                        current_page: invoices.current_page,
                        last_page: invoices.last_page,
                        per_page: invoices.per_page,
                        total: invoices.total,
                        from: invoices.from,
                        to: invoices.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
