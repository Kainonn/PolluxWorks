import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Bot,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    Eye,
    FileText,
    Filter,
    Info,
    Search,
    Server,
    Shield,
    User,
    Users,
    Webhook,
    XCircle,
    Zap,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Actor {
    id: number;
    name: string;
    email: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface SystemLog {
    id: string;
    occurred_at: string;
    event_type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    status: 'success' | 'failed';
    actor_type: 'user' | 'system' | 'api' | 'webhook' | 'scheduler';
    actor_id: number | null;
    tenant_id: number | null;
    target_type: string | null;
    target_id: string | null;
    ip: string | null;
    user_agent: string | null;
    correlation_id: string | null;
    message: string;
    context: Record<string, unknown> | null;
    created_at: string;
    actor: Actor | null;
    tenant: Tenant | null;
}

interface PaginatedLogs {
    data: SystemLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    today: number;
    last_24h: number;
    by_severity: Record<string, number>;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    errors_today: number;
    failed_today: number;
}

interface Props {
    logs: PaginatedLogs;
    stats: Stats;
    filters: {
        search?: string;
        event_type?: string;
        category?: string;
        severity?: string;
        status?: string;
        actor_type?: string;
        actor_id?: string;
        tenant_id?: string;
        date_from?: string;
        date_to?: string;
        correlation_id?: string;
        per_page?: string;
    };
    severities: string[];
    statuses: string[];
    actorTypes: string[];
    categories: Record<string, string>;
    eventTypes: string[];
    tenants: Tenant[];
    users: Actor[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'System Logs', href: '/system-logs' },
];

// Severity configuration
const severityConfig: Record<string, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
    info: {
        label: 'Info',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        bgColor: 'bg-blue-500',
        icon: Info
    },
    warning: {
        label: 'Warning',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        bgColor: 'bg-yellow-500',
        icon: AlertTriangle
    },
    error: {
        label: 'Error',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        bgColor: 'bg-red-500',
        icon: XCircle
    },
    critical: {
        label: 'Critical',
        color: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200',
        bgColor: 'bg-red-700',
        icon: AlertCircle
    },
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    success: {
        label: 'Success',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle2
    },
    failed: {
        label: 'Failed',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle
    },
};

// Actor type configuration
const actorTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    user: { label: 'User', icon: User },
    system: { label: 'System', icon: Server },
    api: { label: 'API', icon: Zap },
    webhook: { label: 'Webhook', icon: Webhook },
    scheduler: { label: 'Scheduler', icon: Clock },
};

// Category configuration
const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    auth: { label: 'Authentication', icon: Shield, color: 'text-purple-500' },
    tenant: { label: 'Tenant', icon: Users, color: 'text-blue-500' },
    subscription: { label: 'Subscription', icon: FileText, color: 'text-green-500' },
    billing: { label: 'Billing', icon: Activity, color: 'text-yellow-500' },
    admin: { label: 'Administration', icon: Users, color: 'text-orange-500' },
    ai: { label: 'AI', icon: Bot, color: 'text-pink-500' },
    system: { label: 'System', icon: Server, color: 'text-gray-500' },
    plan: { label: 'Plan', icon: FileText, color: 'text-indigo-500' },
};

export default function Index({
    logs,
    stats,
    filters,
    severities,
    statuses,
    actorTypes,
    categories,
    eventTypes,
    tenants,
    users,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return !!(
            filters.event_type ||
            filters.category ||
            filters.severity ||
            filters.status ||
            filters.actor_type ||
            filters.actor_id ||
            filters.tenant_id ||
            filters.date_from ||
            filters.date_to ||
            filters.correlation_id
        );
    }, [filters]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...filters, ...newFilters };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/system-logs', params, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/system-logs', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const formatDate = useCallback((date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }, []);

    const formatRelativeTime = useCallback((date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return formatDate(date);
    }, [formatDate]);

    const getEventCategory = (eventType: string) => {
        return eventType.split('.')[0];
    };

    // Column definitions
    const columns: Column<SystemLog>[] = useMemo(
        () => [
            {
                key: 'occurred_at',
                header: 'Time',
                headerClassName: 'w-36',
                cell: (log) => (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{formatRelativeTime(log.occurred_at)}</span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(log.occurred_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </span>
                    </div>
                ),
            },
            {
                key: 'event',
                header: 'Event',
                headerClassName: 'w-72',
                cell: (log) => {
                    const category = getEventCategory(log.event_type);
                    const catConfig = categoryConfig[category];
                    const CategoryIcon = catConfig?.icon || Activity;

                    return (
                        <div className="flex items-start gap-2">
                            <div className={`mt-0.5 ${catConfig?.color || 'text-gray-500'}`}>
                                <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <Link
                                    href={`/system-logs/${log.id}`}
                                    className="font-medium hover:text-primary hover:underline truncate"
                                >
                                    {log.message}
                                </Link>
                                <span className="text-xs text-muted-foreground font-mono truncate">
                                    {log.event_type}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'actor',
                header: 'Actor',
                cell: (log) => {
                    const actorConfig = actorTypeConfig[log.actor_type];
                    const ActorIcon = actorConfig?.icon || User;

                    return (
                        <div className="flex items-center gap-2">
                            <ActorIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                {log.actor ? (
                                    <>
                                        <span className="text-sm">{log.actor.name}</span>
                                        <span className="text-xs text-muted-foreground">{log.actor.email}</span>
                                    </>
                                ) : (
                                    <span className="text-sm capitalize">{log.actor_type}</span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'target',
                header: 'Target',
                cell: (log) => {
                    if (!log.target_type) return <span className="text-muted-foreground">—</span>;

                    return (
                        <div className="flex flex-col">
                            <span className="text-sm capitalize">{log.target_type}</span>
                            {log.tenant && (
                                <Link
                                    href={`/tenants/${log.tenant.id}`}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {log.tenant.name}
                                </Link>
                            )}
                            {!log.tenant && log.target_id && (
                                <span className="text-xs text-muted-foreground font-mono">
                                    #{log.target_id}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'severity',
                header: 'Severity',
                cell: (log) => {
                    const config = severityConfig[log.severity];
                    const SeverityIcon = config?.icon || Info;
                    return (
                        <Badge className={config?.color}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                            {config?.label || log.severity}
                        </Badge>
                    );
                },
            },
            {
                key: 'status',
                header: 'Status',
                cell: (log) => {
                    const config = statusConfig[log.status];
                    const StatusIcon = config?.icon || CheckCircle2;
                    return (
                        <Badge className={config?.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config?.label || log.status}
                        </Badge>
                    );
                },
            },
            {
                key: 'ip',
                header: 'IP',
                cell: (log) => (
                    <span className="text-sm font-mono text-muted-foreground">
                        {log.ip || '—'}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (log) => (
                    <Link href={`/system-logs/${log.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                ),
            },
        ],
        [formatRelativeTime]
    );

    // Toolbar with filters
    const toolbar = (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-80"
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        Search
                    </Button>
                </form>

                <div className="flex items-center gap-2">
                    <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                                {hasActiveFilters && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        {Object.values(filters).filter(Boolean).length - (filters.search ? 1 : 0) - (filters.per_page ? 1 : 0)}
                                    </Badge>
                                )}
                                <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={filters.category || 'all'}
                                        onValueChange={(value) => applyFilters({ category: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            {Object.entries(categories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Severity Filter */}
                                <div className="space-y-2">
                                    <Label>Severity</Label>
                                    <Select
                                        value={filters.severity || 'all'}
                                        onValueChange={(value) => applyFilters({ severity: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All severities" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All severities</SelectItem>
                                            {severities.map((severity) => (
                                                <SelectItem key={severity} value={severity}>
                                                    {severityConfig[severity]?.label || severity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={filters.status || 'all'}
                                        onValueChange={(value) => applyFilters({ status: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            {statuses.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {statusConfig[status]?.label || status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Actor Type Filter */}
                                <div className="space-y-2">
                                    <Label>Actor Type</Label>
                                    <Select
                                        value={filters.actor_type || 'all'}
                                        onValueChange={(value) => applyFilters({ actor_type: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All actor types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All actor types</SelectItem>
                                            {actorTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {actorTypeConfig[type]?.label || type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tenant Filter */}
                                <div className="space-y-2">
                                    <Label>Tenant</Label>
                                    <Select
                                        value={filters.tenant_id || 'all'}
                                        onValueChange={(value) => applyFilters({ tenant_id: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All tenants" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All tenants</SelectItem>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={String(tenant.id)}>
                                                    {tenant.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Actor (User) Filter */}
                                <div className="space-y-2">
                                    <Label>User</Label>
                                    <Select
                                        value={filters.actor_id || 'all'}
                                        onValueChange={(value) => applyFilters({ actor_id: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All users</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date From */}
                                <div className="space-y-2">
                                    <Label>From Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => applyFilters({ date_from: e.target.value, page: '1' })}
                                    />
                                </div>

                                {/* Date To */}
                                <div className="space-y-2">
                                    <Label>To Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.date_to || ''}
                                        onChange={(e) => applyFilters({ date_to: e.target.value, page: '1' })}
                                    />
                                </div>

                                {/* Correlation ID */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Correlation ID</Label>
                                    <Input
                                        placeholder="Enter correlation ID..."
                                        value={filters.correlation_id || ''}
                                        onChange={(e) => applyFilters({ correlation_id: e.target.value, page: '1' })}
                                        className="font-mono"
                                    />
                                </div>

                                {/* Event Type */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Event Type</Label>
                                    <Select
                                        value={filters.event_type || 'all'}
                                        onValueChange={(value) => applyFilters({ event_type: value, page: '1' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All event types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All event types</SelectItem>
                                            {eventTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Logs" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.last_24h.toLocaleString()} in last 24h
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Events logged today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Errors Today</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.errors_today}</div>
                            <p className="text-xs text-muted-foreground">Critical + Error severity</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
                            <XCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.failed_today}</div>
                            <p className="text-xs text-muted-foreground">Failed operations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">By Severity</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-1">
                                {Object.entries(severityConfig).map(([key, config]) => (
                                    <div key={key} className="flex flex-1 flex-col items-center">
                                        <div
                                            className={`h-8 w-full rounded-sm ${config.bgColor}`}
                                            style={{ opacity: stats.by_severity[key] ? 1 : 0.3 }}
                                        />
                                        <span className="mt-1 text-[10px] text-muted-foreground">
                                            {stats.by_severity[key] || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Logs Table */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Logs Explorer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={logs.data}
                            columns={columns}
                            pagination={logs}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            getRowKey={(log) => log.id}
                            toolbar={toolbar}
                            emptyState={
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
                                    <p className="text-muted-foreground">
                                        {hasActiveFilters
                                            ? 'Try adjusting your filters'
                                            : 'System logs will appear here as events occur'}
                                    </p>
                                </div>
                            }
                            rowClassName={(log) =>
                                log.severity === 'critical' || log.severity === 'error'
                                    ? 'bg-red-50/50 dark:bg-red-950/20'
                                    : ''
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
