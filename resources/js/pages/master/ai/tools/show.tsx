import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Wrench,
    CheckCircle2,
    XCircle,
    Shield,
    AlertTriangle,
    FileText,
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

interface AiTool {
    id: number;
    key: string;
    name: string;
    category: string;
    description: string | null;
    risk_level: string;
    requires_approval: boolean;
    access_level: string;
    audit_level: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    tool: AiTool;
    categories: Record<string, string>;
    riskLevels: Record<string, string>;
    accessLevels: Record<string, string>;
}

export default function Show({ tool, categories, riskLevels, accessLevels }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Tools', href: '/master/ai/tools' },
        { title: tool.name, href: `/master/ai/tools/${tool.id}` },
    ];

    const handleToggle = () => {
        router.post(`/master/ai/tools/${tool.id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/master/ai/tools/${tool.id}`, {
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

    const getRiskBadge = (risk: string) => {
        const styles: Record<string, string> = {
            low: 'bg-green-500/10 text-green-600',
            medium: 'bg-yellow-500/10 text-yellow-600',
            high: 'bg-orange-500/10 text-orange-600',
            critical: 'bg-red-500/10 text-red-600',
        };
        return (
            <Badge className={styles[risk] || 'bg-gray-500/10 text-gray-600'}>
                {riskLevels[risk] || risk}
            </Badge>
        );
    };

    const getAuditLabel = (audit: string) => {
        const labels: Record<string, string> = {
            none: 'No logging',
            basic: 'Log call count only',
            detailed: 'Log parameters (sanitized)',
            full: 'Complete audit trail',
        };
        return labels[audit] || audit;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tool.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/master/ai/tools">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Wrench className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
                                    {tool.is_enabled ? (
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
                                <p className="text-muted-foreground font-mono">{tool.key}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToggle}>
                            {tool.is_enabled ? (
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
                        <Link href={`/master/ai/tools/${tool.id}/edit`}>
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
                            <CardTitle>Tool Information</CardTitle>
                            <CardDescription>
                                Basic tool details and classification
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                                    <Badge variant="outline" className="mt-1">
                                        {categories[tool.category] || tool.category}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Access Level</p>
                                    <p className="text-lg font-semibold">{accessLevels[tool.access_level] || tool.access_level}</p>
                                </div>
                            </div>

                            {tool.description && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                                    <p className="text-base">{tool.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Risk & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Risk & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                                <div className="mt-1">{getRiskBadge(tool.risk_level)}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Requires Approval</span>
                                </div>
                                {tool.requires_approval ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-600">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audit Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Audit Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Audit Level</p>
                                <p className="text-lg font-semibold capitalize mt-1">{tool.audit_level}</p>
                                <p className="text-sm text-muted-foreground">{getAuditLabel(tool.audit_level)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="lg:col-span-2">
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
                                    <p className="text-base">{formatDate(tool.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-base">{formatDate(tool.updated_at)}</p>
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
                            Delete AI Tool
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{tool.name}</span>?
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
                            {isDeleting ? 'Deleting...' : 'Delete Tool'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
