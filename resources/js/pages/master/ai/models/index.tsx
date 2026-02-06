import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Brain,
    CheckCircle2,
    DollarSign,
    Eye,
    Layers,
    MoreHorizontal,
    Pencil,
    Plus,
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

interface AiModel {
    id: number;
    key: string;
    name: string;
    provider: string;
    type: string;
    status: string;
    cost_per_1k_tokens_in: string;
    cost_per_1k_tokens_out: string;
    context_window: number;
    max_output_tokens: number | null;
    capabilities: Record<string, boolean> | null;
    regions: string[] | null;
    is_default: boolean;
    priority: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedModels {
    data: AiModel[];
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
    models: PaginatedModels;
    filters: {
        search?: string;
        provider?: string;
        type?: string;
        status?: string;
    };
    providers: Record<string, string>;
    types: Record<string, string>;
    statuses: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Models', href: '/master/ai/models' },
];

export default function Index({ models, filters, providers, types, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [providerFilter, setProviderFilter] = useState(filters.provider || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteModel, setDeleteModel] = useState<AiModel | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params, page: '1' };
        if (search && !('search' in params)) newParams.search = search;
        if (providerFilter !== 'all') newParams.provider = providerFilter;
        if (typeFilter !== 'all') newParams.type = typeFilter;
        if (statusFilter !== 'all') newParams.status = statusFilter;
        router.get('/master/ai/models', newParams, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.provider) params.provider = filters.provider;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/models', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.provider) params.provider = filters.provider;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/models', params, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteModel) return;

        setIsDeleting(true);
        router.delete(`/master/ai/models/${deleteModel.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModel(null);
            },
        });
    };

    const formatCost = (cost: string) => {
        const numCost = parseFloat(cost);
        if (numCost === 0) return 'Free';
        return `$${numCost.toFixed(4)}`;
    };

    const formatContextWindow = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(0)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
        return tokens.toString();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                );
            case 'deprecated':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Deprecated
                    </Badge>
                );
            case 'disabled':
                return (
                    <Badge variant="outline" className="border-gray-300 text-gray-600">
                        <XCircle className="mr-1 h-3 w-3" />
                        Disabled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getProviderBadge = useCallback((provider: string) => {
        const colors: Record<string, string> = {
            openai: 'bg-emerald-500/10 text-emerald-600',
            anthropic: 'bg-orange-500/10 text-orange-600',
            ollama: 'bg-purple-500/10 text-purple-600',
            local: 'bg-blue-500/10 text-blue-600',
        };
        return (
            <Badge className={colors[provider] || 'bg-gray-500/10 text-gray-600'}>
                {providers[provider] || provider}
            </Badge>
        );
    }, [providers]);

    const columns: Column<AiModel>[] = useMemo(
        () => [
            {
                key: 'model',
                header: 'Model',
                headerClassName: 'w-[280px]',
                cell: (model) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/master/ai/models/${model.id}`}
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {model.name}
                                </Link>
                                {model.is_default && (
                                    <Badge variant="outline" className="text-xs">Default</Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {model.key}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'provider',
                header: 'Provider',
                cell: (model) => (
                    <div className="flex flex-col gap-1">
                        {getProviderBadge(model.provider)}
                        <span className="text-xs text-muted-foreground">
                            {types[model.type] || model.type}
                        </span>
                    </div>
                ),
            },
            {
                key: 'specs',
                header: 'Specs',
                cell: (model) => (
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-muted-foreground" />
                            <span>{formatContextWindow(model.context_window)} context</span>
                        </div>
                        {model.max_output_tokens && (
                            <span className="text-xs text-muted-foreground">
                                Max out: {formatContextWindow(model.max_output_tokens)}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'cost',
                header: 'Cost/1K tokens',
                cell: (model) => (
                    <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span>In: {formatCost(model.cost_per_1k_tokens_in)}</span>
                        </div>
                        <span className="text-muted-foreground">
                            Out: {formatCost(model.cost_per_1k_tokens_out)}
                        </span>
                    </div>
                ),
            },
            {
                key: 'priority',
                header: 'Priority',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (model) => (
                    <Badge variant="outline">{model.priority}</Badge>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (model) => getStatusBadge(model.status),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (model) => (
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
                                <Link href={`/master/ai/models/${model.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/models/${model.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Model
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteModel(model)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Model
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [getProviderBadge, types]
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No AI models found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {filters.search || filters.provider || filters.type || filters.status
                    ? 'Try adjusting your filters'
                    : 'Get started by adding a new AI model'}
            </p>
        </div>
    );

    const toolbar = (
        <>
            <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); applyFilters({ provider: v }); }}>
                <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {Object.entries(providers).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); applyFilters({ type: v }); }}>
                <SelectTrigger className="h-9 w-32">
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
                    {Object.entries(statuses).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Link href="/master/ai/models/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Model
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Models" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Models</h1>
                    <p className="text-muted-foreground">
                        Manage AI models, providers, costs and capabilities
                    </p>
                </div>

                <DataTable
                    data={models.data}
                    columns={columns}
                    pagination={models}
                    searchValue={search}
                    searchPlaceholder="Search models..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(model) => model.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deleteModel} onOpenChange={() => setDeleteModel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Model
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteModel?.name}</span>?
                            This will remove it from all plan configurations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModel(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Model'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
