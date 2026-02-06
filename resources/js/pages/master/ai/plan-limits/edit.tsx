import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
}

interface Props {
    limit: AiPlanLimit;
    plans: Plan[];
    models: AiModel[];
    tools: AiTool[];
}

export default function Edit({ limit, plans, models, tools }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Plan Limits', href: '/master/ai/plan-limits' },
        { title: limit.plan.name, href: `/master/ai/plan-limits/${limit.id}` },
        { title: 'Edit', href: `/master/ai/plan-limits/${limit.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        plan_id: String(limit.plan_id),
        max_requests_per_day: limit.max_requests_per_day ?? '',
        max_requests_per_month: limit.max_requests_per_month ?? '',
        max_tokens_per_day: limit.max_tokens_per_day ?? '',
        max_tokens_per_month: limit.max_tokens_per_month ?? '',
        max_tool_calls_per_day: limit.max_tool_calls_per_day ?? '',
        allow_overage: limit.allow_overage,
        overage_cost_per_1k_tokens: limit.overage_cost_per_1k_tokens ?? '',
        overage_limit_percent: limit.overage_limit_percent ?? '',
        is_enabled: limit.is_enabled,
        model_ids: limit.models.map((m) => m.id),
        tool_ids: limit.tools.map((t) => t.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master/ai/plan-limits/${limit.id}`);
    };

    const toggleModel = (modelId: number) => {
        if (data.model_ids.includes(modelId)) {
            setData('model_ids', data.model_ids.filter((id) => id !== modelId));
        } else {
            setData('model_ids', [...data.model_ids, modelId]);
        }
    };

    const toggleTool = (toolId: number) => {
        if (data.tool_ids.includes(toolId)) {
            setData('tool_ids', data.tool_ids.filter((id) => id !== toolId));
        } else {
            setData('tool_ids', [...data.tool_ids, toolId]);
        }
    };

    const groupedTools = tools.reduce(
        (acc, tool) => {
            if (!acc[tool.category]) acc[tool.category] = [];
            acc[tool.category].push(tool);
            return acc;
        },
        {} as Record<string, AiTool[]>
    );

    const groupedModels = models.reduce(
        (acc, model) => {
            if (!acc[model.provider]) acc[model.provider] = [];
            acc[model.provider].push(model);
            return acc;
        },
        {} as Record<string, AiModel[]>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit AI Limits: ${limit.plan.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/plan-limits">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit AI Limits</h1>
                        <p className="text-muted-foreground">
                            Update AI limits for {limit.plan.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Plan Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gauge className="h-5 w-5" />
                                    Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Select Plan *</Label>
                                    <Select
                                        value={data.plan_id}
                                        onValueChange={(v) => setData('plan_id', v)}
                                    >
                                        <SelectTrigger className={errors.plan_id ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Select a plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={String(plan.id)}>
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.plan_id && (
                                        <p className="text-xs text-destructive">{errors.plan_id}</p>
                                    )}
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
                                        <Label className="text-base">Enable Limits</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Apply these limits to the plan
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_enabled}
                                        onCheckedChange={(v) => setData('is_enabled', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Request Limits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Request Limits</CardTitle>
                                <CardDescription>
                                    Leave empty for unlimited
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_requests_per_day">Per Day</Label>
                                        <Input
                                            id="max_requests_per_day"
                                            type="number"
                                            value={data.max_requests_per_day}
                                            onChange={(e) => setData('max_requests_per_day', e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Unlimited"
                                            min={0}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_requests_per_month">Per Month</Label>
                                        <Input
                                            id="max_requests_per_month"
                                            type="number"
                                            value={data.max_requests_per_month}
                                            onChange={(e) => setData('max_requests_per_month', e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Unlimited"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Token Limits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Token Limits</CardTitle>
                                <CardDescription>
                                    Leave empty for unlimited
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_tokens_per_day">Per Day</Label>
                                        <Input
                                            id="max_tokens_per_day"
                                            type="number"
                                            value={data.max_tokens_per_day}
                                            onChange={(e) => setData('max_tokens_per_day', e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Unlimited"
                                            min={0}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_tokens_per_month">Per Month</Label>
                                        <Input
                                            id="max_tokens_per_month"
                                            type="number"
                                            value={data.max_tokens_per_month}
                                            onChange={(e) => setData('max_tokens_per_month', e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Unlimited"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tool Call Limits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tool Call Limits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="max_tool_calls_per_day">Per Day</Label>
                                    <Input
                                        id="max_tool_calls_per_day"
                                        type="number"
                                        value={data.max_tool_calls_per_day}
                                        onChange={(e) => setData('max_tool_calls_per_day', e.target.value ? parseInt(e.target.value) : '')}
                                        placeholder="Unlimited"
                                        min={0}
                                        className="max-w-50"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overage Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Overage Settings</CardTitle>
                                <CardDescription>
                                    Allow usage beyond limits with extra cost
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <Label className="text-sm">Allow Overage</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Charge extra instead of blocking
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_overage}
                                        onCheckedChange={(v) => setData('allow_overage', v)}
                                    />
                                </div>

                                {data.allow_overage && (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="overage_cost_per_1k_tokens">Cost per 1K Tokens</Label>
                                            <Input
                                                id="overage_cost_per_1k_tokens"
                                                type="number"
                                                step="0.0001"
                                                value={data.overage_cost_per_1k_tokens}
                                                onChange={(e) => setData('overage_cost_per_1k_tokens', e.target.value)}
                                                placeholder="0.01"
                                                min={0}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="overage_limit_percent">Max Overage %</Label>
                                            <Input
                                                id="overage_limit_percent"
                                                type="number"
                                                value={data.overage_limit_percent}
                                                onChange={(e) => setData('overage_limit_percent', e.target.value ? parseInt(e.target.value) : '')}
                                                placeholder="50"
                                                min={0}
                                                max={500}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Allowed Models */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Allowed Models</CardTitle>
                                <CardDescription>
                                    Select models available for this plan. Leave empty to allow all.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(groupedModels).map(([provider, providerModels]) => (
                                        <div key={provider}>
                                            <h4 className="font-medium text-sm mb-2 capitalize">{provider}</h4>
                                            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                                {providerModels.map((model) => (
                                                    <div
                                                        key={model.id}
                                                        className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            id={`model-${model.id}`}
                                                            checked={data.model_ids.includes(model.id)}
                                                            onCheckedChange={() => toggleModel(model.id)}
                                                        />
                                                        <label
                                                            htmlFor={`model-${model.id}`}
                                                            className="text-sm cursor-pointer flex-1"
                                                        >
                                                            {model.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Allowed Tools */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Allowed Tools</CardTitle>
                                <CardDescription>
                                    Select tools available for this plan. Leave empty to allow all.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(groupedTools).map(([category, categoryTools]) => (
                                        <div key={category}>
                                            <h4 className="font-medium text-sm mb-2 capitalize">{category.replace(/_/g, ' ')}</h4>
                                            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                                {categoryTools.map((tool) => (
                                                    <div
                                                        key={tool.id}
                                                        className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            id={`tool-${tool.id}`}
                                                            checked={data.tool_ids.includes(tool.id)}
                                                            onCheckedChange={() => toggleTool(tool.id)}
                                                        />
                                                        <label
                                                            htmlFor={`tool-${tool.id}`}
                                                            className="text-sm cursor-pointer flex-1"
                                                        >
                                                            {tool.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/master/ai/plan-limits">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Limits'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
