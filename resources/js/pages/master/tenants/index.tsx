import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock,
    Eye,
    MoreHorizontal,
    PauseCircle,
    Pencil,
    PlayCircle,
    Plus,
    Trash2,
    XCircle,
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
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: 'trial' | 'active' | 'suspended' | 'overdue' | 'cancelled';
    plan_id: number;
    plan: Plan | null;
    primary_domain: string | null;
    provisioning_status: 'pending' | 'running' | 'ready' | 'failed';
    last_heartbeat_at: string | null;
    is_online: boolean;
    seats_used: number;
    seats_limit: number | null;
    storage_used_mb: number;
    storage_limit_mb: number | null;
    seats_usage_percent: number;
    storage_usage_percent: number;
    subdomain_url: string;
    trial_ends_at: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedTenants {
    data: Tenant[];
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

interface HealthStats {
    total: number;
    online: number;
    offline: number;
    by_status: Record<string, number>;
    by_provisioning: Record<string, number>;
    issues: Array<{
        tenant_id: number;
        tenant_name: string;
        type: string;
        message: string;
    }>;
}

interface Props {
    tenants: PaginatedTenants;
    plans: Plan[];
    healthStats: HealthStats;
    filters: {
        search?: string;
        status?: string;
        plan?: string;
        provisioning?: string;
        per_page?: string;
    };
    statuses: string[];
    provisioningStatuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tenants',
        href: '/tenants',
    },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    suspended: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: PauseCircle },
    overdue: { label: 'Overdue', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
};

const provisioningConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    running: { label: 'Running', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    ready: { label: 'Ready', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export default function Index({ tenants, plans, healthStats, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [suspendTenant, setSuspendTenant] = useState<Tenant | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...filters, ...newFilters };
        // Remove empty values
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/tenants', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const handleSuspend = () => {
        if (!suspendTenant || !suspendReason) return;
        setIsProcessing(true);
        router.post(`/tenants/${suspendTenant.id}/suspend`, { reason: suspendReason }, {
            onFinish: () => {
                setIsProcessing(false);
                setSuspendTenant(null);
                setSuspendReason('');
            },
        });
    };

    const handleReactivate = (tenant: Tenant) => {
        router.post(`/tenants/${tenant.id}/reactivate`);
    };

    const handleDelete = () => {
        if (!deleteTenant) return;
        setIsProcessing(true);
        router.delete(`/tenants/${deleteTenant.id}`, {
            onFinish: () => {
                setIsProcessing(false);
                setDeleteTenant(null);
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatLastSeen = useCallback((date: string | null) => {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return formatDate(date);
    }, []);

    // Column definitions
    const columns: Column<Tenant>[] = useMemo(
        () => [
            {
                key: 'tenant',
                header: 'Tenant',
                headerClassName: 'w-64',
                cell: (tenant) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/tenants/${tenant.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {tenant.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {tenant.slug}.polluxworks.com
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (tenant) => {
                    const config = statusConfig[tenant.status];
                    const StatusIcon = config.icon;
                    return (
                        <div className="flex flex-col gap-1">
                            <Badge className={config.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config.label}
                            </Badge>
                            {tenant.provisioning_status !== 'ready' && (
                                <Badge variant="outline" className={provisioningConfig[tenant.provisioning_status].color}>
                                    {provisioningConfig[tenant.provisioning_status].label}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'plan',
                header: 'Plan',
                cell: (tenant) => (
                    <span className="text-sm font-medium">
                        {tenant.plan?.name || 'N/A'}
                    </span>
                ),
            },
            {
                key: 'health',
                header: 'Health',
                cell: (tenant) => (
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${tenant.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-muted-foreground">
                            {tenant.is_online ? 'Online' : formatLastSeen(tenant.last_heartbeat_at)}
                        </span>
                    </div>
                ),
            },
            {
                key: 'usage',
                header: 'Seats',
                cell: (tenant) => (
                    <div className="w-24 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span>{tenant.seats_used}</span>
                            <span className="text-muted-foreground">
                                / {tenant.seats_limit === -1 ? '∞' : tenant.seats_limit || 'N/A'}
                            </span>
                        </div>
                        <Progress value={tenant.seats_usage_percent} className="h-1" />
                    </div>
                ),
            },
            {
                key: 'created',
                header: 'Created',
                cell: (tenant) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(tenant.created_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (tenant) => (
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
                                <Link href={`/tenants/${tenant.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/tenants/${tenant.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tenant.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleReactivate(tenant)}>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Reactivate
                                </DropdownMenuItem>
                            ) : tenant.status !== 'cancelled' && (
                                <DropdownMenuItem
                                    onClick={() => setSuspendTenant(tenant)}
                                    className="text-yellow-600"
                                >
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Suspend
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteTenant(tenant)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [formatLastSeen]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenants" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                        <p className="text-muted-foreground">
                            Manage your SaaS tenants and their subscriptions
                        </p>
                    </div>
                    <Link href="/tenants/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Tenant
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{healthStats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {healthStats.by_status.active || 0} active
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Online</CardTitle>
                            <Activity className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{healthStats.online}</div>
                            <p className="text-xs text-muted-foreground">
                                {healthStats.offline} offline
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Trial</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{healthStats.by_status.trial || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Active trials
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Issues</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{healthStats.issues.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Issues Alert */}
                {healthStats.issues.length > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                Issues Requiring Attention
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {healthStats.issues.slice(0, 5).map((issue, i) => (
                                    <li key={i} className="flex items-center justify-between text-sm">
                                        <span>
                                            <Link
                                                href={`/tenants/${issue.tenant_id}`}
                                                className="font-medium text-red-700 hover:underline dark:text-red-400"
                                            >
                                                {issue.tenant_name}
                                            </Link>
                                            <span className="text-red-600 dark:text-red-500">
                                                : {issue.message}
                                            </span>
                                        </span>
                                        <Badge variant="outline" className="border-red-200 text-red-600">
                                            {issue.type.replace('_', ' ')}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => applyFilters({ status: value, page: '1' })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
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
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <DataTable
                    data={tenants.data}
                    columns={columns}
                    pagination={{
                        current_page: tenants.current_page,
                        last_page: tenants.last_page,
                        per_page: tenants.per_page,
                        total: tenants.total,
                        from: tenants.from,
                        to: tenants.to,
                    }}
                    searchValue={search}
                    searchPlaceholder="Search tenants..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    getRowKey={(tenant) => tenant.id}
                    emptyState={
                        <div className="flex flex-col items-center gap-2 py-8">
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">No tenants found</p>
                            <p className="text-sm text-muted-foreground">
                                Get started by creating your first tenant.
                            </p>
                            <Link href="/tenants/create">
                                <Button className="mt-2">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Tenant
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Suspend Dialog */}
                <Dialog open={!!suspendTenant} onOpenChange={() => setSuspendTenant(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Suspend Tenant</DialogTitle>
                            <DialogDescription>
                                This will block all users and API access for{' '}
                                <strong>{suspendTenant?.name}</strong>. Data will be preserved.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="suspend-reason">Reason for suspension</Label>
                                <Textarea
                                    id="suspend-reason"
                                    placeholder="e.g., Non-payment, Terms violation, etc."
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSuspendTenant(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleSuspend}
                                disabled={!suspendReason || isProcessing}
                            >
                                {isProcessing ? 'Suspending...' : 'Suspend Tenant'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={!!deleteTenant} onOpenChange={() => setDeleteTenant(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Tenant</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{deleteTenant?.name}</strong>?
                                This action cannot be undone easily.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteTenant(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Deleting...' : 'Delete Tenant'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
