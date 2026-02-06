import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
}

interface Props {
    tool: AiTool;
    categories: Record<string, string>;
    riskLevels: Record<string, string>;
    accessLevels: Record<string, string>;
}

export default function Edit({ tool, categories = {}, riskLevels = {}, accessLevels = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Tools', href: '/master/ai/tools' },
        { title: tool.name, href: `/master/ai/tools/${tool.id}` },
        { title: 'Edit', href: `/master/ai/tools/${tool.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        key: tool.key,
        name: tool.name,
        category: tool.category,
        description: tool.description || '',
        risk_level: tool.risk_level,
        requires_approval: tool.requires_approval,
        access_level: tool.access_level,
        audit_level: tool.audit_level,
        is_enabled: tool.is_enabled,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master/ai/tools/${tool.id}`);
    };

    const auditLevels = [
        { key: 'none', label: 'None', description: 'No logging' },
        { key: 'basic', label: 'Basic', description: 'Log call count only' },
        { key: 'detailed', label: 'Detailed', description: 'Log parameters (sanitized)' },
        { key: 'full', label: 'Full', description: 'Complete audit trail' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${tool.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/tools">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {tool.name}</h1>
                        <p className="text-muted-foreground">
                            Update AI tool configuration
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Tool identifier and classification
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="key">Tool Key *</Label>
                                        <Input
                                            id="key"
                                            value={data.key}
                                            onChange={(e) => setData('key', e.target.value)}
                                            placeholder="file_search"
                                            className={errors.key ? 'border-destructive' : ''}
                                        />
                                        {errors.key && (
                                            <p className="text-xs text-destructive">{errors.key}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="File Search"
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-destructive">{errors.name}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(v) => setData('category', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what this tool does..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Risk & Access */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Risk & Access Control
                                </CardTitle>
                                <CardDescription>
                                    Security classification and access rules
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="risk_level">Risk Level *</Label>
                                        <Select
                                            value={data.risk_level}
                                            onValueChange={(v) => setData('risk_level', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select risk level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(riskLevels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="access_level">Access Level *</Label>
                                        <Select
                                            value={data.access_level}
                                            onValueChange={(v) => setData('access_level', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select access" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(accessLevels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <Label htmlFor="requires_approval" className="text-base">Requires Approval</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Tool calls need admin approval
                                        </p>
                                    </div>
                                    <Switch
                                        id="requires_approval"
                                        checked={data.requires_approval}
                                        onCheckedChange={(v) => setData('requires_approval', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Level */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Level</CardTitle>
                                <CardDescription>
                                    How much detail to log
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {auditLevels.map((level) => (
                                        <div
                                            key={level.key}
                                            className={`flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.audit_level === level.key ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => setData('audit_level', level.key)}
                                        >
                                            <span className="font-medium text-sm">{level.label}</span>
                                            <span className="text-xs text-muted-foreground">{level.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                                <CardDescription>
                                    Control tool availability
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="is_enabled" className="text-base">Enable Tool</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Make available for AI agents
                                        </p>
                                    </div>
                                    <Switch
                                        id="is_enabled"
                                        checked={data.is_enabled}
                                        onCheckedChange={(v) => setData('is_enabled', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/master/ai/tools">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Tool'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
