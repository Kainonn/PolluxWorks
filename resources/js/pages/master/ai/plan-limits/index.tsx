import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Gauge,
    Infinity as InfinityIcon,
    Zap,
    Users,
    ArrowRight,
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
}

interface AiPlanLimit {
    id: number;
    plan_id: number;
    max_requests_per_month: number;
    max_requests_per_day: number | null;
    max_requests_per_hour: number | null;
    max_tokens_per_month: number;
    max_tokens_per_request: number;
    max_tool_calls_per_request: number;
    queue_priority: number;
    allow_overage: boolean;
    overage_cost_per_1k_tokens: string | null;
    overage_cost_per_request: string | null;
    plan: Plan;
    created_at: string;
    updated_at: string;
}

interface PaginatedLimits {
    data: AiPlanLimit[];
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
    limits: PaginatedLimits;
    filters: {
        search?: string;
    };
    plansWithoutLimits: Plan[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Plan Limits', href: '/master/ai/plan-limits' },
];

export default function Index({ limits, filters, plansWithoutLimits }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteLimit, setDeleteLimit] = useState<AiPlanLimit | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/master/ai/plan-limits', { search }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        router.get('/master/ai/plan-limits', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        router.get('/master/ai/plan-limits', params, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteLimit) return;

        setIsDeleting(true);
        router.delete(`/master/ai/plan-limits/${deleteLimit.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteLimit(null);
            },
        });
    };

    const formatLimit = (value: number) => {
        if (value === -1) return 'Unlimited';
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toLocaleString();
    };

    const getPriorityBadge = (priority: number) => {
        if (priority >= 8) {
            return <Badge className="bg-green-500/10 text-green-600">High ({priority})</Badge>;
        }
        if (priority >= 5) {
            return <Badge className="bg-yellow-500/10 text-yellow-600">Medium ({priority})</Badge>;
        }
        return <Badge className="bg-gray-500/10 text-gray-600">Low ({priority})</Badge>;
    };

    const columns: Column<AiPlanLimit>[] = useMemo(
        () => [
            {
                key: 'plan',
                header: 'Plan',
                headerClassName: 'w-[200px]',
                cell: (limit) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Gauge className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/master/ai/plan-limits/${limit.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {limit.plan.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                Plan ID: {limit.plan_id}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'requests',
                header: 'Request Limits',
                cell: (limit) => (
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-muted-foreground" />
                            <span>{formatLimit(limit.max_requests_per_month)}/mo</span>
                        </div>
                        {limit.max_requests_per_day && (
                            <span className="text-xs text-muted-foreground">
                                {formatLimit(limit.max_requests_per_day)}/day
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'tokens',
                header: 'Token Limits',
                cell: (limit) => (
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                            {limit.max_tokens_per_month === -1 ? (
                                <InfinityIcon className="h-3 w-3 text-muted-foreground" />
                            ) : null}
                            <span>{formatLimit(limit.max_tokens_per_month)}/mo</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Max/req: {formatLimit(limit.max_tokens_per_request)}
                        </span>
                    </div>
                ),
            },
            {
                key: 'tools',
                header: 'Tool Calls',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (limit) => (
                    <Badge variant="outline">
                        {limit.max_tool_calls_per_request}/req
                    </Badge>
                ),
            },
            {
                key: 'priority',
                header: 'Priority',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (limit) => getPriorityBadge(limit.queue_priority),
            },
            {
                key: 'overage',
                header: 'Overage',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (limit) =>
                    limit.allow_overage ? (
                        <Badge className="bg-blue-500/10 text-blue-600">Allowed</Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">Blocked</Badge>
                    ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (limit) => (
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
                                <Link href={`/master/ai/plan-limits/${limit.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/plan-limits/${limit.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Limits
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteLimit(limit)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Limits
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <Gauge className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No AI limits configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Configure AI usage limits for your plans
            </p>
        </div>
    );

    const toolbar = (
        <>
            {plansWithoutLimits.length > 0 && (
                <Badge variant="outline" className="h-9 px-3 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {plansWithoutLimits.length} plans without limits
                </Badge>
            )}
            <Link href="/master/ai/plan-limits/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Configure Plan
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Plan Limits" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Plan Limits</h1>
                    <p className="text-muted-foreground">
                        Define AI usage limits, token quotas, and overage policies per plan
                    </p>
                </div>

                {/* Quick stats */}
                {plansWithoutLimits.length > 0 && (
                    <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-900/10 p-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                {plansWithoutLimits.length} plans need AI limits configuration
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {plansWithoutLimits.slice(0, 5).map((plan) => (
                                <Link
                                    key={plan.id}
                                    href={`/master/ai/plan-limits/create?plan_id=${plan.id}`}
                                    className="inline-flex items-center gap-1 text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
                                >
                                    {plan.name}
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            ))}
                            {plansWithoutLimits.length > 5 && (
                                <span className="text-sm text-yellow-600">
                                    +{plansWithoutLimits.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <DataTable
                    data={limits.data}
                    columns={columns}
                    pagination={limits}
                    searchValue={search}
                    searchPlaceholder="Search plans..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(limit) => limit.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deleteLimit} onOpenChange={() => setDeleteLimit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Limits
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete AI limits for{' '}
                            <span className="font-semibold">{deleteLimit?.plan.name}</span>?
                            This will also remove all model and tool associations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteLimit(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Limits'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
