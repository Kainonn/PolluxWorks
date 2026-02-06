import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Cpu,
    CheckCircle2,
    XCircle,
    Eye,
    MessageSquare,
    Image,
    Wrench,
    Zap,
    DollarSign,
    Hash,
    Calendar,
    ToggleLeft,
    ToggleRight,
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
    type: string;
    version: string | null;
    description: string | null;
    context_window: number;
    max_output_tokens: number;
    cost_per_1k_input: string | null;
    cost_per_1k_output: string | null;
    supports_vision: boolean;
    supports_functions: boolean;
    supports_streaming: boolean;
    capabilities: string[] | null;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    model: AiModel;
    providers: Record<string, string>;
    types: Record<string, string>;
}

export default function Show({ model, providers, types }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Models', href: '/master/ai/models' },
        { title: model.name, href: `/master/ai/models/${model.id}` },
    ];

    const handleToggle = () => {
        router.post(`/master/ai/models/${model.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/models/${model.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDelete(false);
            },
        });
    };

    const formatNumber = (num: number) => {
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

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'chat':
                return <MessageSquare className="h-5 w-5" />;
            case 'completion':
                return <Zap className="h-5 w-5" />;
            case 'embedding':
                return <Hash className="h-5 w-5" />;
            case 'image':
                return <Image className="h-5 w-5" />;
            default:
                return <Cpu className="h-5 w-5" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={model.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/models">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Cpu className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{model.name}</h1>
                                    {model.is_enabled ? (
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
                                <p className="text-muted-foreground font-mono">{model.key}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToggle}>
                            {model.is_enabled ? (
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
                        <Link href={`/master/ai/models/${model.id}/edit`}>
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
                    {/* Basic Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Model Information</CardTitle>
                            <CardDescription>
                                Basic model details and classification
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                                    <p className="text-lg font-semibold">{providers[model.provider] || model.provider}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(model.type)}
                                        <span className="text-lg font-semibold">{types[model.type] || model.type}</span>
                                    </div>
                                </div>
                            </div>

                            {model.version && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Version</p>
                                    <p className="text-lg">{model.version}</p>
                                </div>
                            )}

                            {model.description && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                                    <p className="text-base">{model.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Vision</span>
                                </div>
                                {model.supports_vision ? (
                                    <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Functions</span>
                                </div>
                                {model.supports_functions ? (
                                    <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Streaming</span>
                                </div>
                                {model.supports_streaming ? (
                                    <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
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
                                <p className="text-sm font-medium text-muted-foreground">Context Window</p>
                                <p className="text-2xl font-bold">{formatNumber(model.context_window)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Max Output</p>
                                <p className="text-2xl font-bold">{formatNumber(model.max_output_tokens)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Pricing (per 1K tokens)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Input</p>
                                <p className="text-2xl font-bold">
                                    {model.cost_per_1k_input ? `$${model.cost_per_1k_input}` : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Output</p>
                                <p className="text-2xl font-bold">
                                    {model.cost_per_1k_output ? `$${model.cost_per_1k_output}` : '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Capabilities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Capabilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {model.capabilities && model.capabilities.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {model.capabilities.map((cap) => (
                                        <Badge key={cap} variant="outline">
                                            {cap.replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No capabilities defined</p>
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
                                    <p className="text-base">{formatDate(model.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(model.updated_at)}</p>
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
                            Delete AI Model
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{model.name}</span>?
                            This action cannot be undone.
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
                            {isDeleting ? 'Deleting...' : 'Delete Model'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
