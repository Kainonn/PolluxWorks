import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Eye,
    FileText,
    Gauge,
    Lock,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    ToggleLeft,
    ToggleRight,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AiPolicy {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: string;
    config: Record<string, unknown> | null;
    action: string;
    error_message: string | null;
    plan_id: number | null;
    tenant_id: number | null;
    is_enabled: boolean;
    is_system: boolean;
    priority: number;
    plan: Plan | null;
    tenant: Tenant | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedPolicies {
    data: AiPolicy[];
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

interface Props {
    policies: PaginatedPolicies;
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
    types: Record<string, string>;
    actions: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Policies', href: '/master/ai/policies' },
];

export default function Index({ policies, filters, types, actions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deletePolicy, setDeletePolicy] = useState<AiPolicy | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params, page: '1' };
        if (search && !('search' in params)) newParams.search = search;
        if (typeFilter !== 'all') newParams.type = typeFilter;
        if (statusFilter !== 'all') newParams.status = statusFilter;
        router.get('/master/ai/policies', newParams, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/policies', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/policies', params, { preserveState: true });
    };

    const handleToggle = (policy: AiPolicy) => {
        router.post(`/master/ai/policies/${policy.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deletePolicy) return;

        setIsDeleting(true);
        router.delete(`/master/ai/policies/${deletePolicy.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletePolicy(null);
            },
        });
    };

    const getTypeBadge = useCallback((type: string) => {
        const styles: Record<string, string> = {
            rate_limit: 'bg-blue-500/10 text-blue-600',
            access_control: 'bg-purple-500/10 text-purple-600',
            resource_limit: 'bg-orange-500/10 text-orange-600',
            security: 'bg-red-500/10 text-red-600',
            compliance: 'bg-green-500/10 text-green-600',
        };

        const icon = (() => {
            switch (type) {
                case 'rate_limit':
                    return <Gauge className="h-4 w-4" />;
                case 'access_control':
                    return <Lock className="h-4 w-4" />;
                case 'resource_limit':
                    return <AlertTriangle className="h-4 w-4" />;
                case 'security':
                    return <Shield className="h-4 w-4" />;
                case 'compliance':
                    return <FileText className="h-4 w-4" />;
                default:
                    return <Shield className="h-4 w-4" />;
            }
        })();

        return (
            <Badge className={styles[type] || 'bg-gray-500/10 text-gray-600'}>
                {icon}
                <span className="ml-1">{types[type] || type}</span>
            </Badge>
        );
    }, [types]);

    const getActionBadge = useCallback((action: string) => {
        const icons: Record<string, React.ReactNode> = {
            block: <Ban className="mr-1 h-3 w-3" />,
            warn: <AlertTriangle className="mr-1 h-3 w-3" />,
            log: <FileText className="mr-1 h-3 w-3" />,
            throttle: <Gauge className="mr-1 h-3 w-3" />,
        };
        const styles: Record<string, string> = {
            block: 'bg-red-500/10 text-red-600',
            warn: 'bg-yellow-500/10 text-yellow-600',
            log: 'bg-blue-500/10 text-blue-600',
            throttle: 'bg-orange-500/10 text-orange-600',
        };
        return (
            <Badge className={styles[action] || 'bg-gray-500/10 text-gray-600'}>
                {icons[action]}
                {actions[action] || action}
            </Badge>
        );
    }, [actions]);

    const getScopeLabel = (policy: AiPolicy) => {
        if (policy.tenant) return `Tenant: ${policy.tenant.name}`;
        if (policy.plan) return `Plan: ${policy.plan.name}`;
        return 'Global';
    };

    const columns: Column<AiPolicy>[] = useMemo(
        () => [
            {
                key: 'policy',
                header: 'Policy',
                headerClassName: 'w-[280px]',
                cell: (policy) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/master/ai/policies/${policy.id}`}
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {policy.name}
                                </Link>
                                {policy.is_system && (
                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                        <Lock className="mr-1 h-3 w-3" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {policy.key}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'type',
                header: 'Type',
                cell: (policy) => getTypeBadge(policy.type),
            },
            {
                key: 'action',
                header: 'Action',
                cell: (policy) => getActionBadge(policy.action),
            },
            {
                key: 'scope',
                header: 'Scope',
                cell: (policy) => (
                    <Badge variant="outline">
                        {getScopeLabel(policy)}
                    </Badge>
                ),
            },
            {
                key: 'priority',
                header: 'Priority',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (policy) => (
                    <Badge variant="outline">{policy.priority}</Badge>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (policy) =>
                    policy.is_enabled ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Enabled
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            Disabled
                        </Badge>
                    ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (policy) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/policies/${policy.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/policies/${policy.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Policy
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(policy)}>
                                {policy.is_enabled ? (
                                    <>
                                        <ToggleLeft className="mr-2 h-4 w-4" />
                                        Disable
                                    </>
                                ) : (
                                    <>
                                        <ToggleRight className="mr-2 h-4 w-4" />
                                        Enable
                                    </>
                                )}
                            </DropdownMenuItem>
                            {!policy.is_system && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setDeletePolicy(policy)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Policy
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [getTypeBadge, getActionBadge]
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No policies found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Create policies to control AI access and behavior
            </p>
        </div>
    );

    const toolbar = (
        <>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); applyFilters({ type: v }); }}>
                <SelectTrigger className="h-9 w-36">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(types).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); applyFilters({ status: v }); }}>
                <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
            </Select>
            <Link href="/master/ai/policies/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Policy
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Policies & Guardrails" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Policies & Guardrails</h1>
                    <p className="text-muted-foreground">
                        Define access controls, rate limits, and security guardrails for AI usage
                    </p>
                </div>

                <DataTable
                    data={policies.data}
                    columns={columns}
                    pagination={policies}
                    searchValue={search}
                    searchPlaceholder="Search policies..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(policy) => policy.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deletePolicy} onOpenChange={() => setDeletePolicy(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Policy
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deletePolicy?.name}</span>?
                            This may affect AI access controls.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletePolicy(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Policy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
