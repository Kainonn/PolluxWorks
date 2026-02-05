import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    CreditCard,
    CheckCircle2,
    XCircle,
    Star,
    Users,
    Boxes,
    Sparkles,
    HardDrive,
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

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price_monthly: string;
    price_yearly: string;
    currency: string;
    max_users: number;
    max_modules: number;
    max_ai_requests: number;
    max_storage_mb: number;
    trial_days: number;
    features: string[] | null;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedPlans {
    data: Plan[];
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
    plans: PaginatedPlans;
    filters: {
        search?: string;
        status?: string;
        per_page?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Plans',
        href: '/plans',
    },
];

export default function Index({ plans, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params };
        if (search && !('search' in params)) newParams.search = search;
        if (statusFilter && statusFilter !== 'all' && !('status' in params)) {
            newParams.status = statusFilter;
        }
        router.get('/plans', newParams, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/plans', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/plans', params, { preserveState: true });
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        const params: Record<string, string> = { page: '1' };
        if (search) params.search = search;
        if (value !== 'all') params.status = value;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/plans', params, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deletePlan) return;

        setIsDeleting(true);
        router.delete(`/plans/${deletePlan.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletePlan(null);
            },
        });
    };

    const formatPrice = (price: string, currency: string) => {
        const numPrice = parseFloat(price);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(numPrice);
    };

    const formatLimit = (value: number, suffix: string = '') => {
        if (value === -1) return 'Unlimited';
        return `${value.toLocaleString()}${suffix}`;
    };

    const formatStorage = (mb: number) => {
        if (mb === -1) return 'Unlimited';
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    // Column definitions
    const columns: Column<Plan>[] = useMemo(
        () => [
            {
                key: 'plan',
                header: 'Plan',
                headerClassName: 'w-[250px]',
                cell: (plan) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/plans/${plan.id}`}
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {plan.name}
                                </Link>
                                {plan.is_featured && (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {plan.slug}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'pricing',
                header: 'Pricing',
                cell: (plan) => (
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {formatPrice(plan.price_monthly, plan.currency)}/mo
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatPrice(plan.price_yearly, plan.currency)}/yr
                        </span>
                    </div>
                ),
            },
            {
                key: 'limits',
                header: 'Limits',
                cell: (plan) => (
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {formatLimit(plan.max_users)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <Boxes className="mr-1 h-3 w-3" />
                            {formatLimit(plan.max_modules)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            {formatLimit(plan.max_ai_requests)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <HardDrive className="mr-1 h-3 w-3" />
                            {formatStorage(plan.max_storage_mb)}
                        </Badge>
                    </div>
                ),
            },
            {
                key: 'trial',
                header: 'Trial',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (plan) =>
                    plan.trial_days > 0 ? (
                        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                            {plan.trial_days} days
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (plan) =>
                    plan.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Active
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="border-orange-300 text-orange-600"
                        >
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                        </Badge>
                    ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (plan) => (
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
                                <Link href={`/plans/${plan.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/plans/${plan.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Plan
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletePlan(plan)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Plan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    // Empty state component
    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No plans found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {filters.search || filters.status
                    ? 'Try adjusting your filters'
                    : 'Get started by creating a new plan'}
            </p>
        </div>
    );

    // Toolbar with filters
    const toolbar = (
        <>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 w-32.5">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
            <Link href="/plans/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Plan
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Plans" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Plans & Licensing</h1>
                    <p className="text-muted-foreground">
                        Manage subscription plans, pricing, and feature limits
                    </p>
                </div>

                {/* DataTable */}
                <DataTable
                    data={plans.data}
                    columns={columns}
                    pagination={plans}
                    searchValue={search}
                    searchPlaceholder="Search plans..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[10, 25, 50, 100]}
                    getRowKey={(plan) => plan.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!deletePlan} onOpenChange={() => setDeletePlan(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Plan
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deletePlan?.name}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletePlan(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
