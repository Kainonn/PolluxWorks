import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Shield,
    CheckCircle2,
    XCircle,
    ToggleLeft,
    ToggleRight,
    Calendar,
    Lock,
    Ban,
    AlertTriangle,
    FileText,
    Gauge,
    Code,
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

interface Plan {
    id: number;
    name: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AiPolicy {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: string;
    config: Record<string, unknown> | null;
    action: string;
    error_message: string | null;
    plan_id: number | null;
    tenant_id: number | null;
    is_enabled: boolean;
    is_system: boolean;
    priority: number;
    plan: Plan | null;
    tenant: Tenant | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    policy: AiPolicy;
    types: Record<string, string>;
    actions: Record<string, string>;
}

export default function Show({ policy, types, actions }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Policies', href: '/master/ai/policies' },
        { title: policy.name, href: `/master/ai/policies/${policy.id}` },
    ];

    const handleToggle = () => {
        router.post(`/master/ai/policies/${policy.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/policies/${policy.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDelete(false);
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getScopeLabel = () => {
        if (policy.tenant) return `Tenant: ${policy.tenant.name}`;
        if (policy.plan) return `Plan: ${policy.plan.name}`;
        return 'Global (all plans)';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'rate_limit':
                return <Gauge className="h-5 w-5" />;
            case 'access_control':
                return <Lock className="h-5 w-5" />;
            case 'resource_limit':
                return <AlertTriangle className="h-5 w-5" />;
            case 'security':
                return <Shield className="h-5 w-5" />;
            case 'compliance':
                return <FileText className="h-5 w-5" />;
            default:
                return <Shield className="h-5 w-5" />;
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'block':
                return <Ban className="h-4 w-4" />;
            case 'warn':
                return <AlertTriangle className="h-4 w-4" />;
            case 'log':
                return <FileText className="h-4 w-4" />;
            case 'throttle':
                return <Gauge className="h-4 w-4" />;
            default:
                return <Shield className="h-4 w-4" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            rate_limit: 'bg-blue-500/10 text-blue-600',
            access_control: 'bg-purple-500/10 text-purple-600',
            resource_limit: 'bg-orange-500/10 text-orange-600',
            security: 'bg-red-500/10 text-red-600',
            compliance: 'bg-green-500/10 text-green-600',
        };
        return (
            <Badge className={`${styles[type] || 'bg-gray-500/10 text-gray-600'} text-base px-4 py-2`}>
                {getTypeIcon(type)}
                <span className="ml-2">{types[type] || type}</span>
            </Badge>
        );
    };

    const getActionBadge = (action: string) => {
        const styles: Record<string, string> = {
            block: 'bg-red-500/10 text-red-600',
            warn: 'bg-yellow-500/10 text-yellow-600',
            log: 'bg-blue-500/10 text-blue-600',
            throttle: 'bg-orange-500/10 text-orange-600',
        };
        return (
            <Badge className={`${styles[action] || 'bg-gray-500/10 text-gray-600'} text-base px-4 py-2`}>
                {getActionIcon(action)}
                <span className="ml-2">{actions[action] || action}</span>
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={policy.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/policies">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{policy.name}</h1>
                                    {policy.is_system && (
                                        <Badge variant="outline" className="border-blue-300 text-blue-600">
                                            <Lock className="mr-1 h-3 w-3" />
                                            System
                                        </Badge>
                                    )}
                                    {policy.is_enabled ? (
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
                                <p className="text-muted-foreground font-mono">{policy.key}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToggle}>
                            {policy.is_enabled ? (
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
                        <Link href={`/master/ai/policies/${policy.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        {!policy.is_system && (
                            <Button variant="destructive" onClick={() => setShowDelete(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Type & Action */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Policy Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {getTypeBadge(policy.type)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Action on Violation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {getActionBadge(policy.action)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Priority & Scope</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Priority</p>
                                <p className="text-2xl font-bold">{policy.priority}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Scope</p>
                                <Badge variant="outline">{getScopeLabel()}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {policy.description && (
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base">{policy.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Configuration */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {policy.config ? (
                                <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                                    {JSON.stringify(policy.config, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-sm text-muted-foreground">No configuration defined</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Error Message */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Error Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {policy.error_message ? (
                                <p className="text-sm p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    {policy.error_message}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Using default error message</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-base">{formatDate(policy.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(policy.updated_at)}</p>
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
                            Delete AI Policy
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{policy.name}</span>?
                            This may affect AI access controls.
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
                            {isDeleting ? 'Deleting...' : 'Delete Policy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
