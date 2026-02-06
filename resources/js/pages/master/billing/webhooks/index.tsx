import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    MoreHorizontal,
    RefreshCw,
    Webhook,
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

interface WebhookEvent {
    id: number;
    provider: string;
    provider_event_id: string | null;
    event_type: string;
    tenant_id: number | null;
    status: string;
    processing_error: string | null;
    processed_at: string | null;
    retry_count: number;
    created_at: string;
    tenant: Tenant | null;
}

interface PaginatedWebhooks {
    data: WebhookEvent[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    by_status: Record<string, number>;
    by_provider: Record<string, number>;
    today: number;
    failed_pending_retry: number;
}

interface Props {
    webhookEvents: PaginatedWebhooks;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        provider?: string;
        event_type?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    statuses: string[];
    eventTypes: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
    { title: 'Webhooks', href: '/billing/webhooks' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: RefreshCw },
    processed: { label: 'Processed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    ignored: { label: 'Ignored', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: AlertCircle },
};

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    openpay: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paypal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function Index({ webhookEvents, stats, filters, statuses, eventTypes }: Props) {
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
        router.get('/billing/webhooks', params, { preserveState: true });
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

    const columns: Column<WebhookEvent>[] = useMemo(
        () => [
            {
                key: 'event',
                header: 'Event',
                headerClassName: 'w-64',
                cell: (event) => (
                    <div className="flex flex-col">
                        <Link
                            href={`/billing/webhooks/${event.id}`}
                            className="font-medium hover:text-primary hover:underline font-mono text-sm"
                        >
                            {event.event_type}
                        </Link>
                        {event.provider_event_id && (
                            <span className="text-xs text-muted-foreground truncate max-w-56">
                                {event.provider_event_id}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'provider',
                header: 'Provider',
                cell: (event) => (
                    <Badge className={providerColors[event.provider] || 'bg-gray-100'}>
                        {event.provider.charAt(0).toUpperCase() + event.provider.slice(1)}
                    </Badge>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (event) => {
                    const config = statusConfig[event.status];
                    const StatusIcon = config?.icon || Clock;
                    return (
                        <div className="flex flex-col gap-1">
                            <Badge className={config?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config?.label || event.status}
                            </Badge>
                            {event.retry_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    Retries: {event.retry_count}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'tenant',
                header: 'Tenant',
                cell: (event) => (
                    event.tenant ? (
                        <Link
                            href={`/tenants/${event.tenant.id}`}
                            className="hover:text-primary hover:underline"
                        >
                            {event.tenant.name}
                        </Link>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                ),
            },
            {
                key: 'received',
                header: 'Received',
                cell: (event) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(event.created_at)}
                    </span>
                ),
            },
            {
                key: 'processed',
                header: 'Processed',
                cell: (event) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(event.processed_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (event) => (
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
                                <Link href={`/billing/webhooks/${event.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {event.status === 'failed' && event.retry_count < 3 && (
                                <DropdownMenuItem
                                    onClick={() => router.post(`/billing/webhooks/${event.id}/retry`)}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Retry
                                </DropdownMenuItem>
                            )}
                            {event.status !== 'processed' && event.status !== 'ignored' && (
                                <DropdownMenuItem
                                    onClick={() => router.post(`/billing/webhooks/${event.id}/ignore`)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Mark as Ignored
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
            <Head title="Webhook Events" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Webhook Events</h1>
                    <p className="text-muted-foreground">
                        Monitor incoming webhook events from payment providers
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <Webhook className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Processed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.by_status?.processed || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.by_status?.pending || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.by_status?.failed || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Retry</CardTitle>
                            <RefreshCw className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.failed_pending_retry}
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
                                    placeholder="Search by event ID or type..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </form>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => applyFilters({ status: value, page: '1' })}
                            >
                                <SelectTrigger className="w-36">
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
                                value={filters.provider || 'all'}
                                onValueChange={(value) => applyFilters({ provider: value, page: '1' })}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Providers</SelectItem>
                                    {Object.keys(stats.by_provider).map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {eventTypes.length > 0 && (
                                <Select
                                    value={filters.event_type || 'all'}
                                    onValueChange={(value) => applyFilters({ event_type: value, page: '1' })}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Event Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Event Types</SelectItem>
                                        {eventTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/billing/webhooks')}
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
                    data={webhookEvents.data}
                    getRowKey={(event) => event.id}
                    pagination={{
                        current_page: webhookEvents.current_page,
                        last_page: webhookEvents.last_page,
                        per_page: webhookEvents.per_page,
                        total: webhookEvents.total,
                        from: webhookEvents.from,
                        to: webhookEvents.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
