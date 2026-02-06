import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Wrench,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    Beaker,
    ToggleLeft,
    ToggleRight,
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

interface AiTool {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: string;
    risk_level: string;
    required_roles: string[] | null;
    required_permissions: string[] | null;
    is_enabled: boolean;
    is_beta: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedTools {
    data: AiTool[];
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
    tools: PaginatedTools;
    filters: {
        search?: string;
        type?: string;
        risk?: string;
        category?: string;
        status?: string;
    };
    types: Record<string, string>;
    riskLevels: Record<string, string>;
    categories: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Tools Registry', href: '/master/ai/tools' },
];

export default function Index({ tools, filters, types, riskLevels, categories }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter] = useState(filters.type || 'all');
    const [riskFilter, setRiskFilter] = useState(filters.risk || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteTool, setDeleteTool] = useState<AiTool | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params, page: '1' };
        if (search && !('search' in params)) newParams.search = search;
        if (typeFilter !== 'all') newParams.type = typeFilter;
        if (riskFilter !== 'all') newParams.risk = riskFilter;
        if (categoryFilter !== 'all') newParams.category = categoryFilter;
        if (statusFilter !== 'all') newParams.status = statusFilter;
        router.get('/master/ai/tools', newParams, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.risk) params.risk = filters.risk;
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/tools', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.risk) params.risk = filters.risk;
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        router.get('/master/ai/tools', params, { preserveState: true });
    };

    const handleToggle = (tool: AiTool) => {
        router.post(`/master/ai/tools/${tool.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteTool) return;

        setIsDeleting(true);
        router.delete(`/master/ai/tools/${deleteTool.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTool(null);
            },
        });
    };

    const getRiskBadge = useCallback((risk: string) => {
        const styles: Record<string, string> = {
            low: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
            medium: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
            high: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
            critical: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
        };
        const icons: Record<string, React.ReactNode> = {
            low: <Shield className="mr-1 h-3 w-3" />,
            medium: <AlertTriangle className="mr-1 h-3 w-3" />,
            high: <AlertTriangle className="mr-1 h-3 w-3" />,
            critical: <AlertTriangle className="mr-1 h-3 w-3" />,
        };
        return (
            <Badge className={styles[risk] || 'bg-gray-500/10 text-gray-600'}>
                {icons[risk]}
                {riskLevels[risk] || risk}
            </Badge>
        );
    }, [riskLevels]);

    const getTypeBadge = useCallback((type: string) => {
        const styles: Record<string, string> = {
            read: 'bg-blue-500/10 text-blue-600',
            write: 'bg-purple-500/10 text-purple-600',
            action: 'bg-indigo-500/10 text-indigo-600',
        };
        return (
            <Badge className={styles[type] || 'bg-gray-500/10 text-gray-600'}>
                {types[type] || type}
            </Badge>
        );
    }, [types]);

    const columns: Column<AiTool>[] = useMemo(
        () => [
            {
                key: 'tool',
                header: 'Tool',
                headerClassName: 'w-[300px]',
                cell: (tool) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/master/ai/tools/${tool.id}`}
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {tool.name}
                                </Link>
                                {tool.is_beta && (
                                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                                        <Beaker className="mr-1 h-3 w-3" />
                                        Beta
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {tool.key}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'category',
                header: 'Category',
                cell: (tool) => (
                    <Badge variant="outline">
                        {categories[tool.category || ''] || tool.category || '—'}
                    </Badge>
                ),
            },
            {
                key: 'type',
                header: 'Type',
                cell: (tool) => getTypeBadge(tool.type),
            },
            {
                key: 'risk',
                header: 'Risk Level',
                cell: (tool) => getRiskBadge(tool.risk_level),
            },
            {
                key: 'access',
                header: 'Access',
                cell: (tool) => (
                    <div className="flex flex-col gap-1 text-xs">
                        {tool.required_roles && tool.required_roles.length > 0 ? (
                            <span className="text-muted-foreground">
                                Roles: {tool.required_roles.join(', ')}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">No restrictions</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (tool) =>
                    tool.is_enabled ? (
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
                cell: (tool) => (
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
                                <Link href={`/master/ai/tools/${tool.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/ai/tools/${tool.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Tool
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(tool)}>
                                {tool.is_enabled ? (
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
                                onClick={() => setDeleteTool(tool)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Tool
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [categories, getRiskBadge, getTypeBadge]
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <Wrench className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No AI tools found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {Object.values(filters).some(Boolean)
                    ? 'Try adjusting your filters'
                    : 'Get started by registering a new AI tool'}
            </p>
        </div>
    );

    const toolbar = (
        <>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); applyFilters({ category: v }); }}>
                <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); applyFilters({ risk: v }); }}>
                <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    {Object.entries(riskLevels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); applyFilters({ status: v }); }}>
                <SelectTrigger className="h-9 w-28">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
            </Select>
            <Link href="/master/ai/tools/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Tool
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Tools Registry" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Tools Registry</h1>
                    <p className="text-muted-foreground">
                        Manage tools available for AI function calling, with access controls and risk levels
                    </p>
                </div>

                <DataTable
                    data={tools.data}
                    columns={columns}
                    pagination={tools}
                    searchValue={search}
                    searchPlaceholder="Search tools..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[15, 30, 50, 100]}
                    getRowKey={(tool) => tool.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            <Dialog open={!!deleteTool} onOpenChange={() => setDeleteTool(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Tool
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteTool?.name}</span>?
                            This will remove it from all plan configurations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTool(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Tool'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
