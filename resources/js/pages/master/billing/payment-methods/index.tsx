import { Head, Link, router } from '@inertiajs/react';
import {
    CreditCard,
    Eye,
    MoreHorizontal,
    RefreshCw,
    Shield,
    Wallet,
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
}

interface BillingCustomer {
    id: number;
    name: string;
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
    is_default: boolean;
    display_name: string;
    created_at: string;
    tenant: Tenant | null;
    billing_customer: BillingCustomer | null;
}

interface PaginatedPaymentMethods {
    data: PaymentMethod[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    by_type: Record<string, number>;
    by_provider: Record<string, number>;
    expiring_soon: number;
}

interface Props {
    paymentMethods: PaginatedPaymentMethods;
    stats: Stats;
    filters: {
        search?: string;
        type?: string;
        provider?: string;
        per_page?: string;
    };
    types: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
    { title: 'Payment Methods', href: '/billing/payment-methods' },
];

const typeIcons: Record<string, React.ElementType> = {
    card: CreditCard,
    bank_account: Shield,
    wallet: Wallet,
};

const typeLabels: Record<string, string> = {
    card: 'Card',
    bank_account: 'Bank Account',
    wallet: 'Digital Wallet',
};

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    openpay: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paypal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function Index({ paymentMethods, stats, filters = {}, types = [] }: Props) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...(filters || {}), ...newFilters };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/billing/payment-methods', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const isExpiringSoon = (month: number | null, year: number | null) => {
        if (!month || !year) return false;
        const now = new Date();
        const expDate = new Date(year, month, 0);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return expDate <= threeMonthsFromNow && expDate > now;
    };

    const isExpired = (month: number | null, year: number | null) => {
        if (!month || !year) return false;
        const now = new Date();
        const expDate = new Date(year, month, 0);
        return expDate < now;
    };

    const columns: Column<PaymentMethod>[] = useMemo(
        () => [
            {
                key: 'method',
                header: 'Payment Method',
                headerClassName: 'w-64',
                cell: (method) => {
                    const TypeIcon = typeIcons[method.type] || CreditCard;
                    return (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <Link
                                    href={`/billing/payment-methods/${method.id}`}
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {method.display_name}
                                </Link>
                                {method.brand && (
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {method.brand}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'tenant',
                header: 'Tenant',
                cell: (method) => (
                    method.tenant ? (
                        <Link
                            href={`/tenants/${method.tenant.id}`}
                            className="hover:text-primary hover:underline"
                        >
                            {method.tenant.name}
                        </Link>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                ),
            },
            {
                key: 'type',
                header: 'Type',
                cell: (method) => (
                    <Badge variant="outline">
                        {typeLabels[method.type] || method.type}
                    </Badge>
                ),
            },
            {
                key: 'provider',
                header: 'Provider',
                cell: (method) => (
                    <Badge className={providerColors[method.provider] || 'bg-gray-100'}>
                        {method.provider.charAt(0).toUpperCase() + method.provider.slice(1)}
                    </Badge>
                ),
            },
            {
                key: 'expiration',
                header: 'Expiration',
                cell: (method) => {
                    if (!method.exp_month || !method.exp_year) {
                        return <span className="text-muted-foreground">—</span>;
                    }
                    const expired = isExpired(method.exp_month, method.exp_year);
                    const expiring = isExpiringSoon(method.exp_month, method.exp_year);
                    return (
                        <div className="flex items-center gap-2">
                            <span className={`${expired ? 'text-red-600' : expiring ? 'text-orange-600' : ''}`}>
                                {String(method.exp_month).padStart(2, '0')}/{method.exp_year}
                            </span>
                            {expired && <Badge variant="destructive">Expired</Badge>}
                            {expiring && <Badge className="bg-orange-100 text-orange-800">Expiring</Badge>}
                        </div>
                    );
                },
            },
            {
                key: 'default',
                header: 'Default',
                cell: (method) => (
                    method.is_default ? (
                        <Badge className="bg-green-100 text-green-800">Default</Badge>
                    ) : null
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (method) => (
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
                                <Link href={`/billing/payment-methods/${method.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {method.tenant && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/tenants/${method.tenant.id}`}>
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
            <Head title="Payment Methods" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
                    <p className="text-muted-foreground">
                        View tenant payment methods across all providers
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Methods</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cards</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.by_type?.card || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
                            <Shield className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.by_type?.bank_account || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                            <XCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats?.expiring_soon || 0}</div>
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
                                    placeholder="Search by tenant or last 4 digits..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </form>
                            <Select
                                value={filters?.type || 'all'}
                                onValueChange={(value) => applyFilters({ type: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {types.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {typeLabels[type] || type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters?.provider || 'all'}
                                onValueChange={(value) => applyFilters({ provider: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Providers</SelectItem>
                                    {Object.keys(stats?.by_provider || {}).map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/billing/payment-methods')}
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
                    data={paymentMethods?.data || []}
                    getRowKey={(method) => method.id}
                    pagination={{
                        current_page: paymentMethods?.current_page || 1,
                        last_page: paymentMethods?.last_page || 1,
                        per_page: paymentMethods?.per_page || 15,
                        total: paymentMethods?.total || 0,
                        from: paymentMethods?.from || 0,
                        to: paymentMethods?.to || 0,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
