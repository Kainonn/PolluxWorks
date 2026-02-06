import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Bell,
    Check,
    CheckCheck,
    ExternalLink,
    Filter,
    Info,
    Megaphone,
    Rocket,
    Wrench,
    XOctagon,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TenantLayout from '@/layouts/tenant-layout';
import { cn } from '@/lib/utils';
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
    is_sticky: boolean;
    is_read: boolean;
    is_viewed: boolean;
    is_dismissed: boolean;
    read_at: string | null;
    created_at: string;
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
        category?: string;
        per_page?: string;
    };
    categories: string[];
    tenant?: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    release: { label: 'Release', icon: Rocket, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    incident: { label: 'Incident', icon: AlertCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
};

const severityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
    info: {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-l-blue-500',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-l-yellow-500',
    },
    critical: {
        icon: XOctagon,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-l-red-500',
    },
};

export default function Index({ notifications, filters, categories, tenant }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const applyFilters = (newFilters: Record<string, string>) => {
        const params: Record<string, string> = { ...filters, ...newFilters };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all') delete params[key];
        });
        router.get('/notifications', params, { preserveState: true });
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            const response = await fetch(`/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                router.reload({ only: ['notifications'] });
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                router.reload({ only: ['notifications'] });
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCtaClick = async (notification: Notification) => {
        try {
            await fetch(`/notifications/${notification.id}/click`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
        } catch (error) {
            console.error('Failed to track click:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const unreadCount = notifications.data.filter(n => !n.is_read).length;

    return (
        <TenantLayout breadcrumbs={breadcrumbs} tenant={tenant}>
            <Head title="Notifications" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">
                            Stay updated with platform announcements and alerts
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAllAsRead}
                            disabled={isLoading}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filter:</span>
                    </div>
                    <Select
                        value={filters.category || 'all'}
                        onValueChange={(value) => applyFilters({ category: value })}
                    >
                        <SelectTrigger className="w-45">
                                <SelectValue placeholder="All Categories" />
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
                </div>

                {/* Notifications List */}
                {notifications.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                            <p className="mt-2 text-sm text-muted-foreground text-center">
                                You're all caught up! We'll notify you when there's something new.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.data.map((notification) => {
                            const CategoryIcon = categoryConfig[notification.category]?.icon || Bell;
                            const severity = severityConfig[notification.severity] || severityConfig.info;
                            const SeverityIcon = severity.icon;

                            return (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        'border-l-4 transition-colors',
                                        severity.borderColor,
                                        !notification.is_read && severity.bgColor
                                    )}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn('mt-0.5', severity.color)}>
                                                    <SeverityIcon className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <CardTitle className={cn(
                                                        'text-lg',
                                                        !notification.is_read && 'font-bold'
                                                    )}>
                                                        {notification.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={categoryConfig[notification.category]?.color}
                                                        >
                                                            <CategoryIcon className="mr-1 h-3 w-3" />
                                                            {notification.category_label}
                                                        </Badge>
                                                        <Badge variant="outline" className={severity.color}>
                                                            {notification.severity_label}
                                                        </Badge>
                                                        {notification.is_sticky && (
                                                            <Badge variant="destructive">Action Required</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                    >
                                                        <Check className="mr-1 h-4 w-4" />
                                                        Mark read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {notification.body}
                                        </p>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(notification.created_at)}
                                                {notification.read_at && (
                                                    <span className="ml-2">
                                                        · Read {formatDate(notification.read_at)}
                                                    </span>
                                                )}
                                            </span>

                                            {notification.cta_url && (
                                                <a
                                                    href={notification.cta_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => handleCtaClick(notification)}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                                >
                                                    {notification.cta_label || 'Learn more'}
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Pagination */}
                        {notifications.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {notifications.from} to {notifications.to} of {notifications.total} notifications
                                </p>
                                <div className="flex items-center gap-2">
                                    {notifications.links.map((link, index) => {
                                        if (index === 0) {
                                            return (
                                                <Button
                                                    key="prev"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                >
                                                    Previous
                                                </Button>
                                            );
                                        }
                                        if (index === notifications.links.length - 1) {
                                            return (
                                                <Button
                                                    key="next"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                >
                                                    Next
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
