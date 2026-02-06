import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    trial_days: number;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface Subscription {
    id: number;
    tenant_id: number;
    plan_id: number;
    status: string;
    started_at: string | null;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    auto_renew: boolean;
    pending_plan_id: number | null;
    admin_notes: string | null;
    tenant: Tenant | null;
    plan: Plan;
    pending_plan: Plan | null;
}

interface Props {
    subscription: Subscription;
    plans: Plan[];
    statuses: string[];
}

export default function Edit({ subscription, statuses }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subscriptions', href: '/subscriptions' },
        { title: subscription.tenant?.name || `Subscription #${subscription.id}`, href: `/subscriptions/${subscription.id}` },
        { title: 'Edit', href: `/subscriptions/${subscription.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        status: subscription.status,
        auto_renew: subscription.auto_renew,
        current_period_end: subscription.current_period_end?.split('T')[0] || '',
        admin_notes: subscription.admin_notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/subscriptions/${subscription.id}`);
    };

    const statusLabels: Record<string, string> = {
        trial: 'Trial',
        active: 'Active',
        overdue: 'Overdue',
        expired: 'Expired',
        cancelled: 'Cancelled',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Subscription - ${subscription.tenant?.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/subscriptions/${subscription.id}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Subscription</h1>
                        <p className="text-muted-foreground">
                            {subscription.tenant?.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription Settings</CardTitle>
                                    <CardDescription>
                                        Update subscription status and settings. For plan changes, use the "Change Plan" action.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) => setData('status', value)}
                                            >
                                                <SelectTrigger id="status">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {statusLabels[status] || status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-sm text-destructive">{errors.status}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Warning: Changing status manually may affect tenant access.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="current_period_end">Period End Date</Label>
                                            <input
                                                type="date"
                                                id="current_period_end"
                                                value={data.current_period_end}
                                                onChange={(e) => setData('current_period_end', e.target.value)}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            />
                                            {errors.current_period_end && (
                                                <p className="text-sm text-destructive">{errors.current_period_end}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Auto Renew</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically renew subscription at period end
                                            </p>
                                        </div>
                                        <Switch
                                            checked={data.auto_renew}
                                            onCheckedChange={(checked) => setData('auto_renew', checked)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="admin_notes">Admin Notes</Label>
                                        <Textarea
                                            id="admin_notes"
                                            value={data.admin_notes}
                                            onChange={(e) => setData('admin_notes', e.target.value)}
                                            placeholder="Internal notes about this subscription..."
                                            rows={4}
                                        />
                                        {errors.admin_notes && (
                                            <p className="text-sm text-destructive">{errors.admin_notes}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Current Plan Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Plan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <Label className="text-muted-foreground">Plan</Label>
                                        <p className="font-medium">{subscription.plan.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Price</Label>
                                        <p className="font-medium">
                                            ${subscription.plan.price_monthly}/month
                                        </p>
                                    </div>
                                    {subscription.pending_plan && (
                                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                                Pending change to: {subscription.pending_plan.name}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Link href={`/subscriptions/${subscription.id}`} className="block">
                                        <Button type="button" variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
