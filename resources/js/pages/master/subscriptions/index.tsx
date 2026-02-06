import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    Eye,
    MoreHorizontal,
    PauseCircle,
    Pencil,
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

interface Plan {
    id: number;
    name: string;
    slug: string;
    price_monthly?: number;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
}

interface Subscription {
    id: number;
    tenant_id: number;
    plan_id: number;
    status: 'trial' | 'active' | 'overdue' | 'expired' | 'cancelled';
    started_at: string | null;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    auto_renew: boolean;
    pending_plan_id: number | null;
    change_effective_at: string | null;
    change_type: 'immediate' | 'next_period' | null;
    cancellation_reason: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    plan: Plan | null;
    pending_plan: Plan | null;
    days_until_period_ends: number | null;
    days_until_trial_ends: number | null;
}

interface PaginatedSubscriptions {
    data: Subscription[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Stats {
    total: number;
    by_status: Record<string, number>;
    with_pending_changes: number;
    expiring_soon: number;
}

interface Props {
    subscriptions: PaginatedSubscriptions;
    plans: Plan[];
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        plan?: string;
        has_pending_change?: string;
        expiring_soon?: string;
        per_page?: string;
    };
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Subscriptions', href: '/subscriptions' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    overdue: { label: 'Overdue', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: PauseCircle },
};

export default function Index({ subscriptions, plans, stats, filters, statuses }: Props) {
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
        router.get('/subscriptions', params, { preserveState: true });
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
        });
    };

    const columns: Column<Subscription>[] = useMemo(
        () => [
            {
                key: 'tenant',
                header: 'Tenant',
                headerClassName: 'w-56',
                cell: (subscription) => (
                    <div className="flex flex-col">
                        <Link
                            href={`/subscriptions/${subscription.id}`}
                            className="font-medium hover:text-primary hover:underline"
                        >
                            {subscription.tenant?.name || 'Unknown'}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                            {subscription.tenant?.slug}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (subscription) => {
                    const config = statusConfig[subscription.status];
                    const StatusIcon = config?.icon || Clock;
                    return (
                        <div className="flex flex-col gap-1">
                            <Badge className={config?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config?.label || subscription.status}
                            </Badge>
                            {subscription.pending_plan_id && (
                                <Badge variant="outline" className="text-xs">
                                    <ArrowRightLeft className="mr-1 h-3 w-3" />
                                    Change pending
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'plan',
                header: 'Plan',
                cell: (subscription) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{subscription.plan?.name || 'N/A'}</span>
                        {subscription.pending_plan && (
                            <span className="text-xs text-muted-foreground">
                                → {subscription.pending_plan.name}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'period',
                header: 'Current Period',
                cell: (subscription) => (
                    <div className="flex flex-col text-sm">
                        {subscription.status === 'trial' ? (
                            <>
                                <span className="text-muted-foreground">Trial ends</span>
                                <span className="font-medium">
                                    {formatDate(subscription.trial_ends_at)}
                                    {subscription.days_until_trial_ends !== null && subscription.days_until_trial_ends >= 0 && (
                                        <span className="ml-1 text-xs text-blue-600">
                                            ({subscription.days_until_trial_ends}d left)
                                        </span>
                                    )}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-muted-foreground">Renews</span>
                                <span className="font-medium">
                                    {formatDate(subscription.current_period_end)}
                                    {subscription.days_until_period_ends !== null && subscription.days_until_period_ends >= 0 && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            ({subscription.days_until_period_ends}d)
                                        </span>
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                ),
            },
            {
                key: 'auto_renew',
                header: 'Auto Renew',
                cell: (subscription) => (
                    <Badge variant={subscription.auto_renew ? 'default' : 'secondary'}>
                        {subscription.auto_renew ? 'Yes' : 'No'}
                    </Badge>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (subscription) => (
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
                                <Link href={`/subscriptions/${subscription.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/subscriptions/${subscription.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            {subscription.tenant && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/tenants/${subscription.tenant.id}`}>
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
            <Head title="Subscriptions" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                        <p className="text-muted-foreground">
                            Manage tenant subscriptions, plans and renewal status
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.by_status?.active || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trial</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.by_status?.trial || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.by_status?.overdue || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Changes</CardTitle>
                            <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.with_pending_changes}</div>
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
                                    placeholder="Search by tenant name..."
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
                            <Select
                                value={filters.plan || 'all'}
                                onValueChange={(value) => applyFilters({ plan: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={String(plan.id)}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/subscriptions')}
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
                    data={subscriptions.data}
                    getRowKey={(subscription) => subscription.id}
                    pagination={{
                        current_page: subscriptions.current_page,
                        last_page: subscriptions.last_page,
                        per_page: subscriptions.per_page,
                        total: subscriptions.total,
                        from: subscriptions.from,
                        to: subscriptions.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
