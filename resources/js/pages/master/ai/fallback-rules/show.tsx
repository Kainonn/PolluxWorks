import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    GitBranch,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Zap,
    ToggleLeft,
    ToggleRight,
    Calendar,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface AiModel {
    id: number;
    key: string;
    name: string;
    provider: string;
}

interface Plan {
    id: number;
    name: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AiFallbackRule {
    id: number;
    name: string;
    description: string | null;
    primary_model_id: number;
    fallback_model_id: number;
    trigger_on: string[] | null;
    timeout_threshold_ms: number | null;
    error_rate_threshold: string | null;
    retry_count: number;
    retry_delay_ms: number;
    preserve_context: boolean;
    plan_id: number | null;
    tenant_id: number | null;
    is_enabled: boolean;
    priority: number;
    primary_model: AiModel;
    fallback_model: AiModel;
    plan: Plan | null;
    tenant: Tenant | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    rule: AiFallbackRule;
    triggerTypes: Record<string, string>;
}

export default function Show({ rule, triggerTypes }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Fallback Rules', href: '/master/ai/fallback-rules' },
        { title: rule.name, href: `/master/ai/fallback-rules/${rule.id}` },
    ];

    const handleToggle = () => {
        router.post(`/master/ai/fallback-rules/${rule.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/fallback-rules/${rule.id}`, {
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
        if (rule.tenant) return `Tenant: ${rule.tenant.name}`;
        if (rule.plan) return `Plan: ${rule.plan.name}`;
        return 'Global (all plans)';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={rule.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/fallback-rules">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <GitBranch className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{rule.name}</h1>
                                    {rule.is_enabled ? (
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
                                <p className="text-muted-foreground">Priority: {rule.priority}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToggle}>
                            {rule.is_enabled ? (
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
                        <Link href={`/master/ai/fallback-rules/${rule.id}/edit`}>
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
                    {/* Model Flow */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Model Flow</CardTitle>
                            <CardDescription>
                                Primary model with automatic fallback
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center gap-8 py-6">
                                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-muted/30">
                                    <Badge className="bg-blue-500/10 text-blue-600">Primary</Badge>
                                    <p className="text-xl font-bold">{rule.primary_model.name}</p>
                                    <p className="text-sm text-muted-foreground">{rule.primary_model.provider}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground mt-1">Falls back to</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-muted/30">
                                    <Badge className="bg-orange-500/10 text-orange-600">Fallback</Badge>
                                    <p className="text-xl font-bold">{rule.fallback_model.name}</p>
                                    <p className="text-sm text-muted-foreground">{rule.fallback_model.provider}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 pt-4 border-t">
                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    Context {rule.preserve_context ? 'will be' : 'will NOT be'} preserved during fallback
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scope */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Scope</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="text-base px-4 py-2">
                                {getScopeLabel()}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Triggers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Trigger Conditions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {rule.trigger_on && rule.trigger_on.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {rule.trigger_on.map((trigger) => (
                                        <Badge key={trigger} variant="outline">
                                            {triggerTypes[trigger] || trigger}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Triggers on all error events</p>
                            )}

                            {rule.timeout_threshold_ms && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground">Timeout Threshold</p>
                                    <p className="text-lg font-semibold">{rule.timeout_threshold_ms.toLocaleString()}ms</p>
                                </div>
                            )}

                            {rule.error_rate_threshold && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Error Rate Threshold</p>
                                    <p className="text-lg font-semibold">{rule.error_rate_threshold}%</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Retry Behavior */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Retry Behavior
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Retry Count</p>
                                <p className="text-2xl font-bold">{rule.retry_count}</p>
                                <p className="text-xs text-muted-foreground">
                                    {rule.retry_count === 0 ? 'Immediate fallback' : 'retries before fallback'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Retry Delay</p>
                                <p className="text-2xl font-bold">{rule.retry_delay_ms.toLocaleString()}ms</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {rule.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{rule.description}</p>
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
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-base">{formatDate(rule.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(rule.updated_at)}</p>
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
                            Delete Fallback Rule
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{rule.name}</span>?
                            This may affect AI resilience.
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
                            {isDeleting ? 'Deleting...' : 'Delete Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
