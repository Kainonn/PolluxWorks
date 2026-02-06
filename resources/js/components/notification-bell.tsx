import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Check,
    CheckCheck,
    ChevronRight,
    ExternalLink,
    Info,
    X,
    XOctagon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    title: string;
    body: string;
    category: 'maintenance' | 'release' | 'incident' | 'announcement';
    severity: 'info' | 'warning' | 'critical';
    cta_label: string | null;
    cta_url: string | null;
    is_sticky: boolean;
    is_read: boolean;
    created_at: string;
}

interface NotificationBellProps {
    className?: string;
    pollInterval?: number; // in milliseconds, default 60000 (1 min)
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    info: {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    critical: {
        icon: XOctagon,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
};

function ScrollArea({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('overflow-auto', className)}>{children}</div>;
}

export function NotificationBell({ className, pollInterval = 60000 }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/notifications/dropdown');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    // Poll for updates
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, pollInterval);
        return () => clearInterval(interval);
    }, [fetchNotifications, pollInterval]);

    // Mark notifications as viewed when dropdown opens
    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);

        if (open && notifications.length > 0) {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                try {
                    await fetch('/notifications/viewed', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({ notification_ids: unreadIds }),
                    });
                } catch (error) {
                    console.error('Failed to mark as viewed:', error);
                }
            }
        }
    };

    // Mark single notification as read
    const handleMarkAsRead = async (notificationId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const response = await fetch(`/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
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
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Dismiss notification
    const handleDismiss = async (notificationId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const response = await fetch(`/notifications/${notificationId}/dismiss`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                // Refresh count
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to dismiss:', error);
        }
    };

    // Track CTA click
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

    // Format relative time
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('relative', className)}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={handleMarkAllAsRead}
                            disabled={isLoading}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                    </div>
                ) : (
                    <ScrollArea className="h-100">
                        <div className="flex flex-col">
                            {notifications.map((notification) => {
                                const severityStyle = severityConfig[notification.severity] || severityConfig.info;
                                const SeverityIcon = severityStyle.icon;

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'flex gap-3 border-b p-3 last:border-b-0',
                                            !notification.is_read && severityStyle.bgColor,
                                            notification.severity === 'critical' && 'border-l-2 border-l-red-500'
                                        )}
                                    >
                                        <div className={cn('mt-0.5 shrink-0', severityStyle.color)}>
                                            <SeverityIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    'text-sm',
                                                    !notification.is_read && 'font-medium'
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {!notification.is_read && !notification.is_sticky && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 shrink-0"
                                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {!notification.is_sticky && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 shrink-0"
                                                            onClick={(e) => handleDismiss(notification.id, e)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                                {notification.body}
                                            </p>

                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(notification.created_at)}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {notification.cta_url && (
                                                        <a
                                                            href={notification.cta_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => handleCtaClick(notification)}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                        >
                                                            {notification.cta_label || 'Learn more'}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {notification.is_sticky && !notification.is_read && (
                                                <Badge variant="outline" className="mt-2 text-xs">
                                                    Action required
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/notifications"
                        className="flex items-center justify-center gap-1 text-center text-sm text-primary"
                    >
                        View all notifications
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
