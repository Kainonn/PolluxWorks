import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Bell,
    BellOff,
    CheckCircle2,
    Clock,
    Copy,
    Eye,
    ExternalLink,
    Info,
    Megaphone,
    MousePointerClick,
    Pencil,
    Rocket,
    Trash2,
    Users,
    Wrench,
    XOctagon,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
    updater: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
}

interface TargetingDetails {
    type: string;
    description: string;
    plans: Array<{ id: number; name: string }>;
    tenants: Array<{ id: number; name: string; slug: string }>;
    roles: string[];
}

interface Props {
    notification: Notification;
    targetingDetails: TargetingDetails;
}

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

export default function Show({ notification, targetingDetails }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Platform Notifications',
            href: '/master/notifications',
        },
        {
            title: notification.title,
            href: `/master/notifications/${notification.id}`,
        },
    ];

    const CategoryIcon = categoryConfig[notification.category]?.icon || Bell;
    const SeverityIcon = severityConfig[notification.severity]?.icon || Info;

    const formatDateTime = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleToggle = () => {
        router.post(`/master/notifications/${notification.id}/toggle`);
    };

    const handleDuplicate = () => {
        router.post(`/master/notifications/${notification.id}/duplicate`);
    };

    const handleDelete = () => {
        setIsProcessing(true);
        router.delete(`/master/notifications/${notification.id}`, {
            onFinish: () => {
                setIsProcessing(false);
                setShowDeleteDialog(false);
            },
        });
    };

    const readRate = notification.views_count > 0
        ? Math.round((notification.reads_count / notification.views_count) * 100)
        : 0;

    const clickRate = notification.views_count > 0
        ? Math.round((notification.clicks_count / notification.views_count) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={notification.title} />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/master/notifications">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${severityConfig[notification.severity]?.color || 'bg-gray-100'}`}>
                                <CategoryIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{notification.title}</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant={notification.is_currently_active ? 'default' : 'secondary'}>
                                        {notification.is_currently_active ? 'Live' : 'Inactive'}
                                    </Badge>
                                    {notification.is_sticky && (
                                        <Badge variant="outline">Sticky</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToggle}>
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
                        </Button>
                        <Button variant="outline" onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                        </Button>
                        <Button asChild>
                            <Link href={`/master/notifications/${notification.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Message */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Message</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{notification.body}</p>
                                </div>

                                {(notification.cta_label || notification.cta_url) && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Call to action:</span>
                                            {notification.cta_url ? (
                                                <a
                                                    href={notification.cta_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                                >
                                                    {notification.cta_label || notification.cta_url}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-sm">{notification.cta_label}</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Engagement Metrics</CardTitle>
                                <CardDescription>
                                    How users are interacting with this notification
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                        <Eye className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-3xl font-bold">{notification.views_count}</span>
                                        <span className="text-sm text-muted-foreground">Views</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                        <span className="text-3xl font-bold">{notification.reads_count}</span>
                                        <span className="text-sm text-muted-foreground">
                                            Reads ({readRate}%)
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                        <MousePointerClick className="h-8 w-8 text-blue-500 mb-2" />
                                        <span className="text-3xl font-bold">{notification.clicks_count}</span>
                                        <span className="text-sm text-muted-foreground">
                                            Clicks ({clickRate}%)
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Targeting */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Targeting</CardTitle>
                                <CardDescription>
                                    {targetingDetails.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {targetingDetails.type === 'all' ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-5 w-5" />
                                        <span>This notification is visible to all tenants</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {targetingDetails.plans.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Plans</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {targetingDetails.plans.map((plan) => (
                                                        <Badge key={plan.id} variant="secondary">
                                                            {plan.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {targetingDetails.tenants.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Tenants</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {targetingDetails.tenants.map((tenant) => (
                                                        <Badge key={tenant.id} variant="secondary">
                                                            {tenant.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {targetingDetails.roles.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Roles</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {targetingDetails.roles.map((role) => (
                                                        <Badge key={role} variant="secondary">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Category</span>
                                    <Badge className={categoryConfig[notification.category]?.color}>
                                        {notification.category_label}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Severity</span>
                                    <Badge className={severityConfig[notification.severity]?.color}>
                                        <SeverityIcon className="h-3 w-3 mr-1" />
                                        {notification.severity_label}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                                        {notification.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Sticky</span>
                                    <span className="text-sm">{notification.is_sticky ? 'Yes' : 'No'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <span className="text-sm font-medium">Starts</span>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(notification.starts_at) || 'Immediately'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <span className="text-sm font-medium">Ends</span>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(notification.ends_at) || 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Created by</span>
                                    <p className="font-medium">{notification.creator?.name || 'System'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateTime(notification.created_at)}
                                    </p>
                                </div>

                                {notification.updater && (
                                    <div>
                                        <span className="text-muted-foreground">Last updated by</span>
                                        <p className="font-medium">{notification.updater.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTime(notification.updated_at)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Notification</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{notification.title}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
