import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Server,
    CheckCircle2,
    XCircle,
    ToggleLeft,
    ToggleRight,
    Calendar,
    Key,
    Wifi,
    WifiOff,
    AlertTriangle,
    Clock,
    Play,
    Gauge,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    org_id: string | null;
    rate_limit_rpm: number | null;
    rate_limit_tpm: number | null;
    default_timeout_ms: number;
    additional_config: Record<string, unknown> | null;
    last_health_check: string | null;
    avg_latency_ms: string | null;
    error_rate: string | null;
    has_api_key: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    provider: AiProviderConfig;
    providers: Record<string, string>;
    statuses: Record<string, string>;
}

export default function Show({ provider, providers }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Providers', href: '/master/ai/providers' },
        { title: provider.name, href: `/master/ai/providers/${provider.id}` },
    ];

    const handleToggle = () => {
        router.post(`/master/ai/providers/${provider.id}/toggle`, {}, { preserveState: true });
    };

    const handleTest = () => {
        setIsTesting(true);
        router.post(`/master/ai/providers/${provider.id}/test`, {}, {
            preserveState: true,
            onFinish: () => setIsTesting(false),
        });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/providers/${provider.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDelete(false);
            },
        });
    };

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatNumber = (num: number | null) => {
        if (num === null) return '—';
        return num.toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'operational':
                return (
                    <Badge className="bg-green-500/10 text-green-600 text-base px-4 py-2">
                        <Wifi className="mr-2 h-4 w-4" />
                        Operational
                    </Badge>
                );
            case 'degraded':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 text-base px-4 py-2">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Degraded
                    </Badge>
                );
            case 'down':
                return (
                    <Badge className="bg-red-500/10 text-red-600 text-base px-4 py-2">
                        <WifiOff className="mr-2 h-4 w-4" />
                        Down
                    </Badge>
                );
            case 'maintenance':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 text-base px-4 py-2">
                        <Clock className="mr-2 h-4 w-4" />
                        Maintenance
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="text-base px-4 py-2">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={provider.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/providers">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Server className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
                                    {provider.is_enabled ? (
                                        <Badge className="bg-green-500/10 text-green-600">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                                            <XCircle className="mr-1 h-3 w-3" />
                                            Disabled
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground font-mono">{providers[provider.provider] || provider.provider}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                            <Play className="mr-2 h-4 w-4" />
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </Button>
                        <Button variant="outline" onClick={handleToggle}>
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
                        </Button>
                        <Link href={`/master/ai/providers/${provider.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setShowDelete(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {getStatusBadge(provider.status)}
                        </CardContent>
                    </Card>

                    {/* API Key Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                API Key
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {provider.has_api_key ? (
                                <Badge className="bg-green-500/10 text-green-600 text-base px-4 py-2">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Configured
                                </Badge>
                            ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-600 text-base px-4 py-2">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Not Set
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    {/* Health Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Health Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Avg Latency</span>
                                <span className="font-semibold">
                                    {provider.avg_latency_ms ? `${parseFloat(provider.avg_latency_ms).toFixed(0)}ms` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Error Rate</span>
                                <span className="font-semibold">
                                    {provider.error_rate ? `${parseFloat(provider.error_rate).toFixed(1)}%` : '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Configuration */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>API Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                                    <p className="text-base font-mono">{provider.api_endpoint || 'Default'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">API Version</p>
                                    <p className="text-base">{provider.api_version || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                                    <p className="text-base font-mono">{provider.org_id || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Default Timeout</p>
                                    <p className="text-base">{formatNumber(provider.default_timeout_ms)}ms</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rate Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gauge className="h-5 w-5" />
                                Rate Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Requests / Minute</p>
                                <p className="text-2xl font-bold">{formatNumber(provider.rate_limit_rpm)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tokens / Minute</p>
                                <p className="text-2xl font-bold">{formatNumber(provider.rate_limit_tpm)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Config */}
                    {provider.additional_config && Object.keys(provider.additional_config).length > 0 && (
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Additional Configuration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                                    {JSON.stringify(provider.additional_config, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timestamps */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-base">{formatDate(provider.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(provider.updated_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Health Check</p>
                                    <p className="text-base">{formatDate(provider.last_health_check)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete AI Provider
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{provider.name}</span>?
                            All models using this provider will be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
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
