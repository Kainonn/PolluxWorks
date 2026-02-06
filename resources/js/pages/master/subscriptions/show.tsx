import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRightLeft,
    Calendar,
    CheckCircle2,
    Clock,
    History,
    PauseCircle,
    Pencil,
    PlayCircle,
    RefreshCw,
    XCircle,
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
    primary_domain: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface HistoryItem {
    id: number;
    event_type: string;
    from_status: string | null;
    to_status: string | null;
    from_plan: Plan | null;
    to_plan: Plan | null;
    performer: User | null;
    performed_by_type: string;
    reason: string | null;
    created_at: string;
}

interface Subscription {
    id: number;
    tenant_id: number;
    plan_id: number;
    status: 'trial' | 'active' | 'overdue' | 'expired' | 'cancelled';
    started_at: string | null;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    auto_renew: boolean;
    pending_plan_id: number | null;
    change_effective_at: string | null;
    change_type: 'immediate' | 'next_period' | null;
    cancellation_reason: string | null;
    cancelled_at: string | null;
    cancelled_by: number | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
    plan: Plan;
    pending_plan: Plan | null;
    cancelled_by_user: User | null;
    history: HistoryItem[];
}

interface Props {
    subscription: Subscription;
    plans: Plan[];
    statuses: string[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    overdue: { label: 'Overdue', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: PauseCircle },
};

const eventTypeLabels: Record<string, string> = {
    created: 'Subscription Created',
    status_changed: 'Status Changed',
    plan_changed: 'Plan Changed',
    renewed: 'Renewed',
    cancelled: 'Cancelled',
    reactivated: 'Reactivated',
    trial_started: 'Trial Started',
    trial_ended: 'Trial Ended',
    upgrade_scheduled: 'Upgrade Scheduled',
    downgrade_scheduled: 'Downgrade Scheduled',
};

export default function Show({ subscription, plans, statuses }: Props) {
    const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showReactivateDialog, setShowReactivateDialog] = useState(false);

    const changePlanForm = useForm({
        plan_id: '',
        change_type: 'next_period' as 'immediate' | 'next_period',
        reason: '',
    });

    const cancelForm = useForm({
        reason: '',
        cancel_immediately: false,
    });

    const reactivateForm = useForm({
        reason: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subscriptions', href: '/subscriptions' },
        { title: subscription.tenant?.name || `Subscription #${subscription.id}`, href: `/subscriptions/${subscription.id}` },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleChangePlan = () => {
        changePlanForm.post(`/subscriptions/${subscription.id}/change-plan`, {
            onSuccess: () => {
                setShowChangePlanDialog(false);
                changePlanForm.reset();
            },
        });
    };

    const handleCancel = () => {
        cancelForm.post(`/subscriptions/${subscription.id}/cancel`, {
            onSuccess: () => {
                setShowCancelDialog(false);
                cancelForm.reset();
            },
        });
    };

    const handleReactivate = () => {
        reactivateForm.post(`/subscriptions/${subscription.id}/reactivate`, {
            onSuccess: () => {
                setShowReactivateDialog(false);
                reactivateForm.reset();
            },
        });
    };

    const handleCancelPendingChange = () => {
        router.post(`/subscriptions/${subscription.id}/cancel-pending-change`);
    };

    const StatusIcon = statusConfig[subscription.status]?.icon || Clock;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Subscription - ${subscription.tenant?.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/subscriptions">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {subscription.tenant?.name || 'Subscription'}
                            </h1>
                            <p className="text-muted-foreground">
                                Subscription details and history
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/subscriptions/${subscription.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        {subscription.status !== 'cancelled' && subscription.status !== 'expired' && (
                            <Button variant="outline" onClick={() => setShowChangePlanDialog(true)}>
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Change Plan
                            </Button>
                        )}
                        {(subscription.status === 'cancelled' || subscription.status === 'expired') ? (
                            <Button onClick={() => setShowReactivateDialog(true)}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Reactivate
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-muted-foreground">Status</Label>
                                            <div className="mt-1">
                                                <Badge className={`${statusConfig[subscription.status]?.color} text-sm`}>
                                                    <StatusIcon className="mr-1 h-4 w-4" />
                                                    {statusConfig[subscription.status]?.label}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Current Plan</Label>
                                            <p className="text-lg font-semibold">{subscription.plan.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatMoney(subscription.plan.price_monthly)}/month
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Auto Renew</Label>
                                            <p className="font-medium">
                                                {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-muted-foreground">Started At</Label>
                                            <p className="font-medium">{formatDate(subscription.started_at)}</p>
                                        </div>
                                        {subscription.status === 'trial' && subscription.trial_ends_at && (
                                            <div>
                                                <Label className="text-muted-foreground">Trial Ends</Label>
                                                <p className="font-medium">{formatDate(subscription.trial_ends_at)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <Label className="text-muted-foreground">Current Period</Label>
                                            <p className="font-medium">
                                                {formatDate(subscription.current_period_start)} — {formatDate(subscription.current_period_end)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Change Card */}
                        {subscription.pending_plan_id && subscription.pending_plan && (
                            <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                                        Pending Plan Change
                                    </CardTitle>
                                    <CardDescription>
                                        This subscription has a scheduled plan change
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Changing to</p>
                                            <p className="text-lg font-semibold">{subscription.pending_plan.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Effective: {formatDate(subscription.change_effective_at)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelPendingChange}
                                        >
                                            Cancel Change
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Cancellation Info */}
                        {subscription.status === 'cancelled' && (
                            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        Cancellation Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div>
                                            <Label className="text-muted-foreground">Cancelled At</Label>
                                            <p className="font-medium">{formatDate(subscription.cancelled_at)}</p>
                                        </div>
                                        {subscription.cancelled_by_user && (
                                            <div>
                                                <Label className="text-muted-foreground">Cancelled By</Label>
                                                <p className="font-medium">{subscription.cancelled_by_user.name}</p>
                                            </div>
                                        )}
                                        {subscription.cancellation_reason && (
                                            <div>
                                                <Label className="text-muted-foreground">Reason</Label>
                                                <p className="font-medium">{subscription.cancellation_reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Subscription History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {subscription.history.length > 0 ? (
                                    <div className="space-y-4">
                                        {subscription.history.map((item, index) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    {index < subscription.history.length - 1 && (
                                                        <div className="flex-1 w-px bg-border" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="font-medium">
                                                        {eventTypeLabels[item.event_type] || item.event_type}
                                                    </p>
                                                    {item.from_status && item.to_status && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.from_status} → {item.to_status}
                                                        </p>
                                                    )}
                                                    {item.from_plan && item.to_plan && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.from_plan.name} → {item.to_plan.name}
                                                        </p>
                                                    )}
                                                    {item.reason && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {item.reason}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDate(item.created_at)}
                                                        {item.performer && ` by ${item.performer.name}`}
                                                        {item.performed_by_type === 'system' && ' (System)'}
                                                        {item.performed_by_type === 'webhook' && ' (Webhook)'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No history available.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tenant Info */}
                        {subscription.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tenant</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="font-medium">{subscription.tenant.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Slug</Label>
                                        <p className="font-medium">{subscription.tenant.slug}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p className="font-medium capitalize">{subscription.tenant.status}</p>
                                    </div>
                                    <Separator />
                                    <Link href={`/tenants/${subscription.tenant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            View Tenant Details
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Admin Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {subscription.admin_notes ? (
                                    <p className="text-sm whitespace-pre-wrap">{subscription.admin_notes}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No notes added.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{formatDate(subscription.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{formatDate(subscription.updated_at)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Change Plan Dialog */}
            <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Plan</DialogTitle>
                        <DialogDescription>
                            Select a new plan for this subscription.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>New Plan</Label>
                            <Select
                                value={changePlanForm.data.plan_id}
                                onValueChange={(value) => changePlanForm.setData('plan_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.filter(p => p.id !== subscription.plan_id).map((plan) => (
                                        <SelectItem key={plan.id} value={String(plan.id)}>
                                            {plan.name} - {formatMoney(plan.price_monthly)}/mo
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>When to Apply</Label>
                            <Select
                                value={changePlanForm.data.change_type}
                                onValueChange={(value: 'immediate' | 'next_period') =>
                                    changePlanForm.setData('change_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="next_period">At Next Billing Period</SelectItem>
                                    <SelectItem value="immediate">Immediately</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={changePlanForm.data.reason}
                                onChange={(e) => changePlanForm.setData('reason', e.target.value)}
                                placeholder="Why is this change being made?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleChangePlan} disabled={!changePlanForm.data.plan_id || changePlanForm.processing}>
                            Change Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this subscription?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Reason</Label>
                            <Textarea
                                value={cancelForm.data.reason}
                                onChange={(e) => cancelForm.setData('reason', e.target.value)}
                                placeholder="Why is this subscription being cancelled?"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="cancel_immediately"
                                checked={cancelForm.data.cancel_immediately}
                                onChange={(e) => cancelForm.setData('cancel_immediately', e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="cancel_immediately">Cancel immediately (don't wait for period end)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep Subscription
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={!cancelForm.data.reason || cancelForm.processing}
                        >
                            Cancel Subscription
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reactivate Dialog */}
            <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reactivate Subscription</DialogTitle>
                        <DialogDescription>
                            This will reactivate the subscription with a new billing period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={reactivateForm.data.reason}
                                onChange={(e) => reactivateForm.setData('reason', e.target.value)}
                                placeholder="Why is this subscription being reactivated?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReactivate} disabled={reactivateForm.processing}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Reactivate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
