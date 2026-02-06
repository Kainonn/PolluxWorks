import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Gauge,
    CheckCircle2,
    XCircle,
    Cpu,
    Wrench,
    Zap,
    Hash,
    DollarSign,
    Calendar,
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

interface AiModel {
    id: number;
    key: string;
    name: string;
    provider: string;
}

interface AiTool {
    id: number;
    key: string;
    name: string;
    category: string;
}

interface AiPlanLimit {
    id: number;
    plan_id: number;
    max_requests_per_day: number | null;
    max_requests_per_month: number | null;
    max_tokens_per_day: number | null;
    max_tokens_per_month: number | null;
    max_tool_calls_per_day: number | null;
    allow_overage: boolean;
    overage_cost_per_1k_tokens: string | null;
    overage_limit_percent: number | null;
    is_enabled: boolean;
    plan: Plan;
    models: AiModel[];
    tools: AiTool[];
    created_at: string;
    updated_at: string;
}

interface Props {
    limit: AiPlanLimit;
}

export default function Show({ limit }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Plan Limits', href: '/master/ai/plan-limits' },
        { title: limit.plan.name, href: `/master/ai/plan-limits/${limit.id}` },
    ];

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/plan-limits/${limit.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDelete(false);
            },
        });
    };

    const formatNumber = (num: number | null) => {
        if (num === null) return '∞ Unlimited';
        return num.toLocaleString();
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`AI Limits: ${limit.plan.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/plan-limits">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Gauge className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{limit.plan.name}</h1>
                                    {limit.is_enabled ? (
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
                                <p className="text-muted-foreground">AI usage limits configuration</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/master/ai/plan-limits/${limit.id}/edit`}>
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
                    {/* Request Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Request Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Per Day</p>
                                <p className="text-2xl font-bold">{formatNumber(limit.max_requests_per_day)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Per Month</p>
                                <p className="text-2xl font-bold">{formatNumber(limit.max_requests_per_month)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Token Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Token Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Per Day</p>
                                <p className="text-2xl font-bold">{formatNumber(limit.max_tokens_per_day)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Per Month</p>
                                <p className="text-2xl font-bold">{formatNumber(limit.max_tokens_per_month)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tool Calls */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Tool Call Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Per Day</p>
                                <p className="text-2xl font-bold">{formatNumber(limit.max_tool_calls_per_day)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overage Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Overage Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Allow Overage</span>
                                {limit.allow_overage ? (
                                    <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </div>
                            {limit.allow_overage && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Cost per 1K Tokens</p>
                                        <p className="text-xl font-bold">
                                            {limit.overage_cost_per_1k_tokens ? `$${limit.overage_cost_per_1k_tokens}` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Overage Limit</p>
                                        <p className="text-xl font-bold">
                                            {limit.overage_limit_percent ? `${limit.overage_limit_percent}%` : '∞ Unlimited'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Allowed Models */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                Allowed Models ({limit.models.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {limit.models.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {limit.models.map((model) => (
                                        <Badge key={model.id} variant="outline">
                                            {model.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">All models allowed</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Allowed Tools */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Allowed Tools ({limit.tools.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {limit.tools.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {limit.tools.map((tool) => (
                                        <Badge key={tool.id} variant="outline">
                                            {tool.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">All tools allowed</p>
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
                                    <p className="text-base">{formatDate(limit.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(limit.updated_at)}</p>
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
                            Delete AI Plan Limit
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete AI limits for{' '}
                            <span className="font-semibold">{limit.plan.name}</span>?
                            Tenants on this plan will have no AI restrictions.
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
                            {isDeleting ? 'Deleting...' : 'Delete Limit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
