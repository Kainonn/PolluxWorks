import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    BellOff,
    Eye,
    Info,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XOctagon,
    Copy,
    Megaphone,
    Wrench,
    Rocket,
    AlertCircle,
    CheckCircle2,
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

interface Notification {
    id: number;
    title: string;
    body: string;
    category: 'maintenance' | 'release' | 'incident' | 'announcement';
    severity: 'info' | 'warning' | 'critical';
    category_label: string;
    severity_label: string;
    cta_label: string | null;
    cta_url: string | null;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    is_sticky: boolean;
    is_currently_active: boolean;
    targeting: {
        all?: boolean;
        plans?: number[];
        tenants?: number[];
        roles?: string[];
    } | null;
    views_count: number;
    reads_count: number;
    clicks_count: number;
    creator: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedNotifications {
    data: Notification[];
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
    notifications: PaginatedNotifications;
    filters: {
        search?: string;
        category?: string;
        severity?: string;
        is_active?: string;
        per_page?: string;
    };
    categories: string[];
    severities: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Notifications',
        href: '/master/notifications',
    },
];

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    release: { label: 'Release', icon: Rocket, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    incident: { label: 'Incident', icon: AlertCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
};

const severityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    info: { label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    critical: { label: 'Critical', icon: XOctagon, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export default function Index({ notifications, filters, categories, severities }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteNotification, setDeleteNotification] = useState<Notification | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...filters, ...newFilters };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/master/notifications', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: String(perPage), page: '1' });
    };

    const handleToggle = (notification: Notification) => {
        router.post(`/master/notifications/${notification.id}/toggle`);
    };

    const handleDuplicate = (notification: Notification) => {
        router.post(`/master/notifications/${notification.id}/duplicate`);
    };

    const handleDelete = () => {
        if (!deleteNotification) return;
        setIsProcessing(true);
        router.delete(`/master/notifications/${deleteNotification.id}`, {
            onFinish: () => {
                setIsProcessing(false);
                setDeleteNotification(null);
            },
        });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTargetingLabel = (targeting: Notification['targeting']) => {
        if (!targeting || targeting.all) return 'All tenants';
        const parts: string[] = [];
        if (targeting.plans?.length) parts.push(`${targeting.plans.length} plan(s)`);
        if (targeting.tenants?.length) parts.push(`${targeting.tenants.length} tenant(s)`);
        if (targeting.roles?.length) parts.push(`${targeting.roles.length} role(s)`);
        return parts.length ? parts.join(', ') : 'All tenants';
    };

    // Stats cards
    const stats = useMemo(() => {
        const allNotifications = notifications.data;
        return {
            total: notifications.total,
            active: allNotifications.filter(n => n.is_active).length,
            totalViews: allNotifications.reduce((sum, n) => sum + n.views_count, 0),
            totalReads: allNotifications.reduce((sum, n) => sum + n.reads_count, 0),
        };
    }, [notifications]);

    const columns: Column<Notification>[] = useMemo(
        () => [
            {
                key: 'notification',
                header: 'Notification',
                headerClassName: 'w-96',
                cell: (notification) => {
                    const CategoryIcon = categoryConfig[notification.category]?.icon || Bell;
                    return (
                        <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${severityConfig[notification.severity]?.color || 'bg-gray-100'}`}>
                                <CategoryIcon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <Link
                                    href={`/master/notifications/${notification.id}`}
                                    className="font-medium hover:text-primary hover:underline truncate"
                                >
                                    {notification.title}
                                </Link>
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                    {notification.body}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'category',
                header: 'Category',
                cell: (notification) => {
                    const config = categoryConfig[notification.category];
                    return (
                        <Badge variant="secondary" className={config?.color}>
                            {notification.category_label}
                        </Badge>
                    );
                },
            },
            {
                key: 'severity',
                header: 'Severity',
                cell: (notification) => {
                    const config = severityConfig[notification.severity];
                    const Icon = config?.icon || Info;
                    return (
                        <Badge variant="secondary" className={config?.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {notification.severity_label}
                        </Badge>
                    );
                },
            },
            {
                key: 'targeting',
                header: 'Targeting',
                cell: (notification) => (
                    <span className="text-sm text-muted-foreground">
                        {getTargetingLabel(notification.targeting)}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                cell: (notification) => (
                    <div className="flex flex-col gap-1">
                        <Badge variant={notification.is_currently_active ? 'default' : 'secondary'}>
                            {notification.is_currently_active ? 'Live' : 'Inactive'}
                        </Badge>
                        {notification.is_sticky && (
                            <Badge variant="outline" className="text-xs">Sticky</Badge>
                        )}
                    </div>
                ),
            },
            {
                key: 'metrics',
                header: 'Metrics',
                cell: (notification) => (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" title="Views">
                            <Eye className="h-3 w-3" />
                            {notification.views_count}
                        </span>
                        <span className="flex items-center gap-1" title="Reads">
                            <CheckCircle2 className="h-3 w-3" />
                            {notification.reads_count}
                        </span>
                    </div>
                ),
            },
            {
                key: 'schedule',
                header: 'Schedule',
                cell: (notification) => (
                    <div className="flex flex-col text-xs text-muted-foreground">
                        {notification.starts_at && (
                            <span>From: {formatDateTime(notification.starts_at)}</span>
                        )}
                        {notification.ends_at && (
                            <span>Until: {formatDateTime(notification.ends_at)}</span>
                        )}
                        {!notification.starts_at && !notification.ends_at && (
                            <span>Always</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-12',
                cell: (notification) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/master/notifications/${notification.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/master/notifications/${notification.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(notification)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggle(notification)}>
                                {notification.is_active ? (
                                    <>
                                        <BellOff className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Bell className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteNotification(notification)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    const toolbar = (
        <div className="flex items-center gap-2">
            <Select
                value={filters.category || 'all'}
                onValueChange={(value) => applyFilters({ category: value, page: '1' })}
            >
                <SelectTrigger className="w-37.5">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                            {categoryConfig[category]?.label || category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.severity || 'all'}
                onValueChange={(value) => applyFilters({ severity: value, page: '1' })}
            >
                <SelectTrigger className="w-32.5">
                    <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {severities.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                            {severityConfig[severity]?.label || severity}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.is_active ?? 'all'}
                onValueChange={(value) => applyFilters({ is_active: value, page: '1' })}
            >
                <SelectTrigger className="w-30">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Notifications" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Platform Notifications</h1>
                        <p className="text-muted-foreground">
                            Manage notifications sent to all tenants
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/master/notifications/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Notification
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">notifications</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                            <p className="text-xs text-muted-foreground">currently live</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalViews}</div>
                            <p className="text-xs text-muted-foreground">across all notifications</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalReads}</div>
                            <p className="text-xs text-muted-foreground">marked as read</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <DataTable
                    data={notifications.data}
                    columns={columns}
                    pagination={notifications}
                    searchValue={search}
                    searchPlaceholder="Search notifications..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    getRowKey={(notification) => notification.id}
                    toolbar={toolbar}
                    emptyState={
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create your first notification to inform tenants about updates.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/master/notifications/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Notification
                                </Link>
                            </Button>
                        </div>
                    }
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!deleteNotification} onOpenChange={() => setDeleteNotification(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Notification</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteNotification?.title}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteNotification(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
