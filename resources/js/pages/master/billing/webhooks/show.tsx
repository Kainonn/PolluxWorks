import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock,
    Code,
    RefreshCw,
    Webhook,
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
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface WebhookEvent {
    id: number;
    provider: string;
    provider_event_id: string | null;
    event_type: string;
    payload: Record<string, unknown> | null;
    tenant_id: number | null;
    status: string;
    processing_error: string | null;
    processed_at: string | null;
    retry_count: number;
    max_retries: number;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
}

interface Props {
    webhookEvent: WebhookEvent;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    processed: { label: 'Processed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
    ignored: { label: 'Ignored', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

const providerColors: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800',
    openpay: 'bg-blue-100 text-blue-800',
    paypal: 'bg-yellow-100 text-yellow-800',
};

export default function Show({ webhookEvent }: Props) {
    const [showRetryDialog, setShowRetryDialog] = useState(false);
    const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: '/billing' },
        { title: 'Webhooks', href: '/billing/webhooks' },
        { title: `#${webhookEvent.id}`, href: `/billing/webhooks/${webhookEvent.id}` },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const statusData = statusConfig[webhookEvent.status];
    const StatusIcon = statusData?.icon || Clock;

    const canRetry = webhookEvent.status === 'failed' && webhookEvent.retry_count < webhookEvent.max_retries;
    const canIgnore = webhookEvent.status !== 'processed' && webhookEvent.status !== 'ignored';

    const handleRetry = () => {
        router.post(`/billing/webhooks/${webhookEvent.id}/retry`, {}, {
            onSuccess: () => setShowRetryDialog(false),
        });
    };

    const handleIgnore = () => {
        router.post(`/billing/webhooks/${webhookEvent.id}/ignore`, {}, {
            onSuccess: () => setShowIgnoreDialog(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Webhook Event #${webhookEvent.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/billing/webhooks">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Webhook Event #{webhookEvent.id}
                                </h1>
                                <Badge className={statusData?.color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusData?.label || webhookEvent.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground font-mono text-sm">
                                {webhookEvent.event_type}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canRetry && (
                            <Button
                                variant="outline"
                                onClick={() => setShowRetryDialog(true)}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Processing
                            </Button>
                        )}
                        {canIgnore && (
                            <Button
                                variant="outline"
                                onClick={() => setShowIgnoreDialog(true)}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as Ignored
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Webhook className="h-5 w-5" />
                                    Event Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Event Type
                                        </label>
                                        <p className="font-mono">{webhookEvent.event_type}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Provider
                                        </label>
                                        <div className="mt-1">
                                            <Badge className={providerColors[webhookEvent.provider]}>
                                                {webhookEvent.provider.charAt(0).toUpperCase() + webhookEvent.provider.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Provider Event ID
                                        </label>
                                        <p className="font-mono text-sm break-all">
                                            {webhookEvent.provider_event_id || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Retry Count
                                        </label>
                                        <p>{webhookEvent.retry_count} / {webhookEvent.max_retries}</p>
                                    </div>
                                </div>

                                {webhookEvent.processing_error && (
                                    <>
                                        <Separator />
                                        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                                            <label className="text-sm font-medium text-red-800 dark:text-red-200">
                                                Processing Error
                                            </label>
                                            <p className="mt-1 text-red-700 dark:text-red-300 text-sm font-mono whitespace-pre-wrap">
                                                {webhookEvent.processing_error}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Webhook Payload
                                </CardTitle>
                                <CardDescription>
                                    Raw data received from {webhookEvent.provider}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {webhookEvent.payload ? (
                                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                                        {JSON.stringify(webhookEvent.payload, null, 2)}
                                    </pre>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        No payload data available
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-center p-4">
                                    <Badge className={`${statusData?.color} text-lg px-4 py-2`}>
                                        <StatusIcon className="mr-2 h-5 w-5" />
                                        {statusData?.label || webhookEvent.status}
                                    </Badge>
                                </div>
                                {webhookEvent.status === 'failed' && (
                                    <p className="text-sm text-center text-muted-foreground">
                                        {webhookEvent.retry_count < webhookEvent.max_retries
                                            ? `${webhookEvent.max_retries - webhookEvent.retry_count} retries remaining`
                                            : 'Maximum retries reached'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tenant */}
                        {webhookEvent.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Related Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/tenants/${webhookEvent.tenant.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {webhookEvent.tenant.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {webhookEvent.tenant.slug}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Received
                                    </label>
                                    <p className="text-sm">{formatDate(webhookEvent.created_at)}</p>
                                </div>
                                {webhookEvent.processed_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Processed
                                        </label>
                                        <p className="text-sm">{formatDate(webhookEvent.processed_at)}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </label>
                                    <p className="text-sm">{formatDate(webhookEvent.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Retry Dialog */}
            <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Retry Processing</DialogTitle>
                        <DialogDescription>
                            This will attempt to process the webhook event again.
                            The event has been retried {webhookEvent.retry_count} time(s)
                            so far.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRetryDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRetry}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ignore Dialog */}
            <Dialog open={showIgnoreDialog} onOpenChange={setShowIgnoreDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Ignored</DialogTitle>
                        <DialogDescription>
                            This will mark the webhook event as ignored and it will not
                            be processed or retried. Use this for events that are not
                            relevant or cannot be processed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowIgnoreDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="secondary" onClick={handleIgnore}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark as Ignored
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
