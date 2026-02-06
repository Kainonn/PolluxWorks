import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Server,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ToggleLeft,
    ToggleRight,
    Wifi,
    WifiOff,
    Clock,
    Key,
    Play,
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

interface AiProviderConfig {
    id: number;
    provider: string;
    name: string;
    is_enabled: boolean;
    status: string;
    api_endpoint: string | null;
    api_version: string | null;
    rate_limit_rpm: number | null;
    rate_limit_tpm: number | null;
    last_health_check: string | null;
    avg_latency_ms: string | null;
    error_rate: string | null;
    has_api_key: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedProviders {
    data: AiProviderConfig[];
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
    providers: PaginatedProviders;
    filters: {
        search?: string;
        status?: string;
    };
    statuses: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Providers', href: '/master/ai/providers' },
];

export default function Index({ providers, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteProvider, setDeleteProvider] = useState<AiProviderConfig | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params, page: '1' };
        if (search && !('search' in params)) newParams.search = search;
        if (statusFilter !== 'all') newParams.status = statusFilter;
        router.get('/master/ai/providers', newParams, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/providers', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/providers', params, { preserveState: true });
    };

    const handleToggle = (provider: AiProviderConfig) => {
        router.post(`/master/ai/providers/${provider.id}/toggle`, {}, { preserveState: true });
    };

    const handleTest = (provider: AiProviderConfig) => {
        router.post(`/master/ai/providers/${provider.id}/test`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteProvider) return;

        setIsDeleting(true);
        router.delete(`/master/ai/providers/${deleteProvider.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteProvider(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'operational':
                return (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <Wifi className="mr-1 h-3 w-3" />
                        Operational
                    </Badge>
                );
            case 'degraded':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Degraded
                    </Badge>
                );
            case 'down':
                return (
                    <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                        <WifiOff className="mr-1 h-3 w-3" />
                        Down
                    </Badge>
                );
            case 'maintenance':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                        <Clock className="mr-1 h-3 w-3" />
                        Maintenance
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatLatency = (latency: string | null) => {
        if (!latency) return '—';
        const num = parseFloat(latency);
        if (num >= 1000) return `${(num / 1000).toFixed(2)}s`;
        return `${num.toFixed(0)}ms`;
    };

    const formatErrorRate = (rate: string | null) => {
        if (!rate) return '—';
        return `${parseFloat(rate).toFixed(1)}%`;
    };

    const columns: Column<AiProviderConfig>[] = useMemo(
        () => [
            {
                key: 'provider',
                header: 'Provider',
                headerClassName: 'w-[250px]',
                cell: (provider) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/master/ai/providers/${provider.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {provider.name}
                            </Link>
                            <span className="text-xs text-muted-foreground font-mono">
                                {provider.provider}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (provider) => getStatusBadge(provider.status),
            },
            {
                key: 'api',
                header: 'API',
                cell: (provider) => (
                    <div className="flex flex-col gap-1 text-sm">
                        {provider.has_api_key ? (
                            <Badge variant="outline" className="w-fit text-xs text-green-600">
                                <Key className="mr-1 h-3 w-3" />
                                Configured
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="w-fit text-xs text-yellow-600">
                                <Key className="mr-1 h-3 w-3" />
                                No Key
                            </Badge>
                        )}
                        {provider.api_version && (
                            <span className="text-xs text-muted-foreground">v{provider.api_version}</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'limits',
                header: 'Rate Limits',
                cell: (provider) => (
                    <div className="flex flex-col gap-1 text-xs">
                        {provider.rate_limit_rpm && (
                            <span>{provider.rate_limit_rpm.toLocaleString()} req/min</span>
                        )}
                        {provider.rate_limit_tpm && (
                            <span className="text-muted-foreground">
                                {provider.rate_limit_tpm.toLocaleString()} tok/min
                            </span>
                        )}
                        {!provider.rate_limit_rpm && !provider.rate_limit_tpm && (
                            <span className="text-muted-foreground">Not set</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'health',
                header: 'Health',
                cell: (provider) => (
                    <div className="flex flex-col gap-1 text-xs">
                        <span>Latency: {formatLatency(provider.avg_latency_ms)}</span>
                        <span className="text-muted-foreground">
                            Errors: {formatErrorRate(provider.error_rate)}
                        </span>
                    </div>
                ),
            },
            {
                key: 'enabled',
                header: 'Enabled',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (provider) =>
                    provider.is_enabled ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Yes
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            No
                        </Badge>
                    ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (provider) => (
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
                                <Link href={`/master/ai/providers/${provider.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/providers/${provider.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Provider
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTest(provider)}>
                                <Play className="mr-2 h-4 w-4" />
                                Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(provider)}>
                                {provider.is_enabled ? (
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
                                onClick={() => setDeleteProvider(provider)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Provider
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
                <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No providers configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Add AI provider configurations (OpenAI, Anthropic, etc.)
            </p>
        </div>
    );

    const toolbar = (
        <>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); applyFilters({ status: v }); }}>
                <SelectTrigger className="h-9 w-36">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    {Object.entries(statuses).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Link href="/master/ai/providers/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Provider
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Providers" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Providers</h1>
                    <p className="text-muted-foreground">
                        Configure AI provider endpoints, API keys, and health monitoring
                    </p>
                </div>

                <DataTable
                    data={providers.data}
                    columns={columns}
                    pagination={providers}
                    searchValue={search}
                    searchPlaceholder="Search providers..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(provider) => provider.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deleteProvider} onOpenChange={() => setDeleteProvider(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Provider
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteProvider?.name}</span>?
                            All models using this provider will be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProvider(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Provider'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
