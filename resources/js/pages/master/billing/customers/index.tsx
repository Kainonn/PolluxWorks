import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    CreditCard,
    Eye,
    MoreHorizontal,
    RefreshCw,
    Users,
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

interface BillingCustomer {
    id: number;
    tenant_id: number;
    provider: string;
    provider_customer_id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    tenant: Tenant | null;
    payment_methods_count: number;
    payments_count: number;
    invoices_count: number;
}

interface PaginatedCustomers {
    data: BillingCustomer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    active: number;
    by_provider: Record<string, number>;
}

interface Props {
    customers: PaginatedCustomers;
    stats: Stats;
    filters: {
        search?: string;
        provider?: string;
        is_active?: string;
        per_page?: string;
    };
    providers: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
    { title: 'Customers', href: '/billing/customers' },
];

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    openpay: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paypal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    internal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function Index({ customers, stats, filters, providers }: Props) {
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
        router.get('/billing/customers', params, { preserveState: true });
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

    const columns: Column<BillingCustomer>[] = useMemo(
        () => [
            {
                key: 'tenant',
                header: 'Tenant',
                headerClassName: 'w-56',
                cell: (customer) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/billing/customers/${customer.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {customer.tenant?.name || customer.name || 'Unknown'}
                            </Link>
                            {customer.email && (
                                <span className="text-xs text-muted-foreground">{customer.email}</span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: 'provider',
                header: 'Provider',
                cell: (customer) => (
                    <Badge className={providerColors[customer.provider] || providerColors.internal}>
                        {customer.provider.charAt(0).toUpperCase() + customer.provider.slice(1)}
                    </Badge>
                ),
            },
            {
                key: 'customer_id',
                header: 'Customer ID',
                cell: (customer) => (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                        {customer.provider_customer_id}
                    </code>
                ),
            },
            {
                key: 'payment_methods',
                header: 'Payment Methods',
                cell: (customer) => (
                    <span className="font-medium">{customer.payment_methods_count}</span>
                ),
            },
            {
                key: 'payments',
                header: 'Payments',
                cell: (customer) => (
                    <span className="font-medium">{customer.payments_count}</span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (customer) => (
                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
            {
                key: 'created',
                header: 'Created',
                cell: (customer) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(customer.created_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (customer) => (
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
                                <Link href={`/billing/customers/${customer.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {customer.tenant && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/tenants/${customer.tenant.id}`}>
                                        <Building2 className="mr-2 h-4 w-4" />
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
            <Head title="Billing Customers" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing Customers</h1>
                    <p className="text-muted-foreground">
                        View billing customers across payment providers
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CreditCard className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    {Object.entries(stats.by_provider).map(([provider, count]) => (
                        <Card key={provider}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium capitalize">{provider}</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{count}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <form onSubmit={handleSearch} className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by email, name, or customer ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </form>
                            <Select
                                value={filters.provider || 'all'}
                                onValueChange={(value) => applyFilters({ provider: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Providers</SelectItem>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.is_active || 'all'}
                                onValueChange={(value) => applyFilters({ is_active: value, page: '1' })}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/billing/customers')}
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
                    data={customers.data}
                    getRowKey={(customer) => customer.id}
                    pagination={{
                        current_page: customers.current_page,
                        last_page: customers.last_page,
                        per_page: customers.per_page,
                        total: customers.total,
                        from: customers.from,
                        to: customers.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
