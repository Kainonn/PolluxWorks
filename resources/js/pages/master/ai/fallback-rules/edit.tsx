import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, GitBranch, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    is_enabled: boolean;
    priority: number;
}

interface Props {
    rule: AiFallbackRule;
    models: AiModel[];
    plans: Plan[];
    triggerTypes: Record<string, string>;
}

export default function Edit({ rule, models, plans, triggerTypes }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Fallback Rules', href: '/master/ai/fallback-rules' },
        { title: rule.name, href: `/master/ai/fallback-rules/${rule.id}` },
        { title: 'Edit', href: `/master/ai/fallback-rules/${rule.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: rule.name,
        description: rule.description || '',
        primary_model_id: String(rule.primary_model_id),
        fallback_model_id: String(rule.fallback_model_id),
        trigger_on: rule.trigger_on || [],
        timeout_threshold_ms: rule.timeout_threshold_ms || 30000,
        error_rate_threshold: rule.error_rate_threshold || '',
        retry_count: rule.retry_count,
        retry_delay_ms: rule.retry_delay_ms,
        preserve_context: rule.preserve_context,
        plan_id: rule.plan_id ? String(rule.plan_id) : '',
        is_enabled: rule.is_enabled,
        priority: rule.priority,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master/ai/fallback-rules/${rule.id}`);
    };

    const toggleTrigger = (trigger: string) => {
        if (data.trigger_on.includes(trigger)) {
            setData('trigger_on', data.trigger_on.filter((t) => t !== trigger));
        } else {
            setData('trigger_on', [...data.trigger_on, trigger]);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${rule.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/fallback-rules">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {rule.name}</h1>
                        <p className="text-muted-foreground">
                            Update fallback rule configuration
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Rule Name *</Label>
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

                        {/* Model Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Model Flow</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_model_id">Primary Model *</Label>
                                    <Select
                                        value={data.primary_model_id}
                                        onValueChange={(v) => setData('primary_model_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select primary model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {models.map((model) => (
                                                <SelectItem key={model.id} value={String(model.id)}>
                                                    {model.name} ({model.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-center text-muted-foreground">
                                    ↓ Falls back to ↓
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fallback_model_id">Fallback Model *</Label>
                                    <Select
                                        value={data.fallback_model_id}
                                        onValueChange={(v) => setData('fallback_model_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select fallback model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {models.map((model) => (
                                                <SelectItem
                                                    key={model.id}
                                                    value={String(model.id)}
                                                    disabled={String(model.id) === data.primary_model_id}
                                                >
                                                    {model.name} ({model.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <Label className="text-sm">Preserve Context</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Transfer conversation history
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.preserve_context}
                                        onCheckedChange={(v) => setData('preserve_context', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trigger Conditions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Trigger Conditions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(triggerTypes).map(([key, label]) => (
                                        <div
                                            key={key}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.trigger_on.includes(key) ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => toggleTrigger(key)}
                                        >
                                            <span className="text-sm">{label}</span>
                                            <Switch
                                                checked={data.trigger_on.includes(key)}
                                                onCheckedChange={() => toggleTrigger(key)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="timeout_threshold_ms">Timeout (ms)</Label>
                                        <Input
                                            id="timeout_threshold_ms"
                                            type="number"
                                            value={data.timeout_threshold_ms}
                                            onChange={(e) => setData('timeout_threshold_ms', parseInt(e.target.value) || 0)}
                                            min={1000}
                                            step={1000}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="error_rate_threshold">Error Rate %</Label>
                                        <Input
                                            id="error_rate_threshold"
                                            type="number"
                                            step="0.01"
                                            value={data.error_rate_threshold}
                                            onChange={(e) => setData('error_rate_threshold', e.target.value)}
                                            placeholder="5.00"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Retry Behavior */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Retry Behavior</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="retry_count">Retry Count</Label>
                                        <Input
                                            id="retry_count"
                                            type="number"
                                            value={data.retry_count}
                                            onChange={(e) => setData('retry_count', parseInt(e.target.value) || 0)}
                                            min={0}
                                            max={10}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="retry_delay_ms">Retry Delay (ms)</Label>
                                        <Input
                                            id="retry_delay_ms"
                                            type="number"
                                            value={data.retry_delay_ms}
                                            onChange={(e) => setData('retry_delay_ms', parseInt(e.target.value) || 0)}
                                            min={0}
                                            step={100}
                                        />
                                    </div>
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
                                        <Label className="text-base">Enable Rule</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Activate this fallback rule
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
                        <Link href="/master/ai/fallback-rules">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Rule'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
