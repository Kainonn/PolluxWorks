import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    GitBranch,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ToggleLeft,
    ToggleRight,
    Zap,
    Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
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

interface AiModel {
    id: number;
    key: string;
    name: string;
    provider: string;
}

interface Plan {
    id: number;
    name: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AiFallbackRule {
    id: number;
    name: string;
    description: string | null;
    primary_model_id: number;
    fallback_model_id: number;
    trigger_on: string[] | null;
    timeout_threshold_ms: number | null;
    error_rate_threshold: number | null;
    retry_count: number;
    retry_delay_ms: number;
    preserve_context: boolean;
    plan_id: number | null;
    tenant_id: number | null;
    is_enabled: boolean;
    priority: number;
    primary_model: AiModel;
    fallback_model: AiModel;
    plan: Plan | null;
    tenant: Tenant | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedRules {
    data: AiFallbackRule[];
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
    rules: PaginatedRules;
    filters: {
        search?: string;
        status?: string;
    };
    triggerTypes: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Fallback Rules', href: '/master/ai/fallback-rules' },
];

export default function Index({ rules, filters, triggerTypes }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteRule, setDeleteRule] = useState<AiFallbackRule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params, page: '1' };
        if (search && !('search' in params)) newParams.search = search;
        if (statusFilter !== 'all') newParams.status = statusFilter;
        router.get('/master/ai/fallback-rules', newParams, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/fallback-rules', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/fallback-rules', params, { preserveState: true });
    };

    const handleToggle = (rule: AiFallbackRule) => {
        router.post(`/master/ai/fallback-rules/${rule.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteRule) return;

        setIsDeleting(true);
        router.delete(`/master/ai/fallback-rules/${deleteRule.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteRule(null);
            },
        });
    };

    const getScopeLabel = (rule: AiFallbackRule) => {
        if (rule.tenant) return `Tenant: ${rule.tenant.name}`;
        if (rule.plan) return `Plan: ${rule.plan.name}`;
        return 'Global';
    };

    const columns: Column<AiFallbackRule>[] = useMemo(
        () => [
            {
                key: 'rule',
                header: 'Fallback Rule',
                headerClassName: 'w-[250px]',
                cell: (rule) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <GitBranch className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/master/ai/fallback-rules/${rule.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {rule.name}
                            </Link>
                            <Badge variant="outline" className="w-fit text-xs mt-1">
                                Priority: {rule.priority}
                            </Badge>
                        </div>
                    </div>
                ),
            },
            {
                key: 'flow',
                header: 'Flow',
                cell: (rule) => (
                    <div className="flex items-center gap-2 text-sm">
                        <div className="flex flex-col items-center">
                            <span className="font-medium">{rule.primary_model.name}</span>
                            <span className="text-xs text-muted-foreground">{rule.primary_model.provider}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col items-center">
                            <span className="font-medium">{rule.fallback_model.name}</span>
                            <span className="text-xs text-muted-foreground">{rule.fallback_model.provider}</span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'triggers',
                header: 'Triggers',
                cell: (rule) => (
                    <div className="flex flex-wrap gap-1">
                        {rule.trigger_on && rule.trigger_on.length > 0 ? (
                            rule.trigger_on.slice(0, 2).map((trigger) => (
                                <Badge key={trigger} variant="outline" className="text-xs">
                                    {triggerTypes[trigger] || trigger}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">All events</span>
                        )}
                        {rule.trigger_on && rule.trigger_on.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{rule.trigger_on.length - 2}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                key: 'behavior',
                header: 'Behavior',
                cell: (rule) => (
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-muted-foreground" />
                            <span>{rule.retry_count} retries</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{rule.retry_delay_ms}ms delay</span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'scope',
                header: 'Scope',
                cell: (rule) => (
                    <Badge variant="outline">
                        {getScopeLabel(rule)}
                    </Badge>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (rule) =>
                    rule.is_enabled ? (
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
                cell: (rule) => (
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
                                <Link href={`/master/ai/fallback-rules/${rule.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/fallback-rules/${rule.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Rule
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(rule)}>
                                {rule.is_enabled ? (
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteRule(rule)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Rule
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [triggerTypes]
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No fallback rules</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Create rules to ensure AI resilience when models fail
            </p>
        </div>
    );

    const toolbar = (
        <>
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
            <Link href="/master/ai/fallback-rules/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Rule
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Fallback Rules" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Fallback Rules</h1>
                    <p className="text-muted-foreground">
                        Configure automatic model failover when primary models are unavailable
                    </p>
                </div>

                <DataTable
                    data={rules.data}
                    columns={columns}
                    pagination={rules}
                    searchValue={search}
                    searchPlaceholder="Search rules..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(rule) => rule.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deleteRule} onOpenChange={() => setDeleteRule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Fallback Rule
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteRule?.name}</span>?
                            This may affect AI resilience.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteRule(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
