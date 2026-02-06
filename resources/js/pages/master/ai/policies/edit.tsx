import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
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

interface Plan {
    id: number;
    name: string;
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
    is_enabled: boolean;
    is_system: boolean;
    priority: number;
}

interface Props {
    policy: AiPolicy;
    plans: Plan[];
    types: Record<string, string>;
    actions: Record<string, string>;
}

export default function Edit({ policy, plans, types, actions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Policies', href: '/master/ai/policies' },
        { title: policy.name, href: `/master/ai/policies/${policy.id}` },
        { title: 'Edit', href: `/master/ai/policies/${policy.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        key: policy.key,
        name: policy.name,
        description: policy.description || '',
        type: policy.type,
        config: policy.config ? JSON.stringify(policy.config, null, 2) : '{}',
        action: policy.action,
        error_message: policy.error_message || '',
        plan_id: policy.plan_id ? String(policy.plan_id) : '',
        is_enabled: policy.is_enabled,
        priority: policy.priority,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master/ai/policies/${policy.id}`);
    };

    const getConfigPlaceholder = () => {
        switch (data.type) {
            case 'rate_limit':
                return '{\n  "max_requests_per_minute": 60,\n  "max_tokens_per_minute": 10000\n}';
            case 'access_control':
                return '{\n  "allowed_models": ["gpt-4o"],\n  "allowed_tools": ["file_search"]\n}';
            case 'resource_limit':
                return '{\n  "max_concurrent_requests": 5,\n  "max_context_length": 16000\n}';
            case 'security':
                return '{\n  "block_patterns": ["password", "secret"],\n  "require_auth": true\n}';
            case 'compliance':
                return '{\n  "data_retention_days": 30,\n  "require_audit": true\n}';
            default:
                return '{}';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${policy.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/policies">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {policy.name}</h1>
                        <p className="text-muted-foreground">
                            Update AI policy configuration
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="key">Policy Key *</Label>
                                        <Input
                                            id="key"
                                            value={data.key}
                                            onChange={(e) => setData('key', e.target.value)}
                                            className={errors.key ? 'border-destructive' : ''}
                                            disabled={policy.is_system}
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
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-destructive">{errors.name}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={1000}
                                        className="max-w-37.5"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Type & Action */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Type & Action</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Policy Type *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(v) => setData('type', v)}
                                        disabled={policy.is_system}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="action">Action on Violation *</Label>
                                    <Select
                                        value={data.action}
                                        onValueChange={(v) => setData('action', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(actions).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="error_message">Custom Error Message</Label>
                                    <Textarea
                                        id="error_message"
                                        value={data.error_message}
                                        onChange={(e) => setData('error_message', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Configuration */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Policy Configuration</CardTitle>
                                <CardDescription>
                                    JSON configuration for this policy type
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="config">Config (JSON) *</Label>
                                    <Textarea
                                        id="config"
                                        value={data.config}
                                        onChange={(e) => setData('config', e.target.value)}
                                        placeholder={getConfigPlaceholder()}
                                        rows={8}
                                        className={`font-mono text-sm ${errors.config ? 'border-destructive' : ''}`}
                                    />
                                    {errors.config && (
                                        <p className="text-xs text-destructive">{errors.config}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scope */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Scope</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Plan</Label>
                                    <Select
                                        value={data.plan_id || '_all'}
                                        onValueChange={(v) => setData('plan_id', v === '_all' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All plans (global)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_all">All plans (global)</SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={String(plan.id)}>
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Enable Policy</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Activate this policy
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_enabled}
                                        onCheckedChange={(v) => setData('is_enabled', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/master/ai/policies">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Policy'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
