import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Sliders } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
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

interface Props {
    plans: Plan[];
    models: AiModel[];
    tools: AiTool[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Plan Limits', href: '/master/ai/plan-limits' },
    { title: 'New Limit', href: '/master/ai/plan-limits/create' },
];

export default function Create({ plans, models, tools }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
        max_requests_day: 100,
        max_tokens_day: 100000,
        max_tokens_request: 4096,
        max_context_tokens: 16000,
        rate_limit_rpm: 60,
        allow_streaming: true,
        allow_vision: false,
        allow_functions: false,
        overage_action: 'block',
        overage_rate: '',
        ai_models: [] as number[],
        ai_tools: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master/ai/plan-limits');
    };

    const toggleModel = (modelId: number) => {
        if (data.ai_models.includes(modelId)) {
            setData('ai_models', data.ai_models.filter(id => id !== modelId));
        } else {
            setData('ai_models', [...data.ai_models, modelId]);
        }
    };

    const toggleTool = (toolId: number) => {
        if (data.ai_tools.includes(toolId)) {
            setData('ai_tools', data.ai_tools.filter(id => id !== toolId));
        } else {
            setData('ai_tools', [...data.ai_tools, toolId]);
        }
    };

    const selectAllModels = () => setData('ai_models', models.map(m => m.id));
    const selectNoModels = () => setData('ai_models', []);
    const selectAllTools = () => setData('ai_tools', tools.map(t => t.id));
    const selectNoTools = () => setData('ai_tools', []);

    const overageActions = [
        { key: 'block', label: 'Block', description: 'Deny requests over limit' },
        { key: 'throttle', label: 'Throttle', description: 'Slow down requests' },
        { key: 'charge', label: 'Charge Overage', description: 'Bill for extra usage' },
        { key: 'notify', label: 'Notify Only', description: 'Allow but send alert' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Plan AI Limit" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/plan-limits">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New Plan AI Limit</h1>
                        <p className="text-muted-foreground">
                            Configure AI limits for a subscription plan
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Plan Selection */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sliders className="h-5 w-5" />
                                    Plan Selection
                                </CardTitle>
                                <CardDescription>
                                    Choose the plan to configure AI limits for
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-w-md">
                                    <Label htmlFor="plan_id">Plan *</Label>
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

                        {/* Usage Limits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Usage Limits</CardTitle>
                                <CardDescription>
                                    Daily request and token limits
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_requests_day">Max Requests / Day</Label>
                                        <Input
                                            id="max_requests_day"
                                            type="number"
                                            value={data.max_requests_day}
                                            onChange={(e) => setData('max_requests_day', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_tokens_day">Max Tokens / Day</Label>
                                        <Input
                                            id="max_tokens_day"
                                            type="number"
                                            value={data.max_tokens_day}
                                            onChange={(e) => setData('max_tokens_day', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_tokens_request">Max Tokens / Request</Label>
                                        <Input
                                            id="max_tokens_request"
                                            type="number"
                                            value={data.max_tokens_request}
                                            onChange={(e) => setData('max_tokens_request', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_context_tokens">Max Context Tokens</Label>
                                        <Input
                                            id="max_context_tokens"
                                            type="number"
                                            value={data.max_context_tokens}
                                            onChange={(e) => setData('max_context_tokens', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rate_limit_rpm">Rate Limit (req/min)</Label>
                                    <Input
                                        id="rate_limit_rpm"
                                        type="number"
                                        value={data.rate_limit_rpm}
                                        onChange={(e) => setData('rate_limit_rpm', parseInt(e.target.value) || 0)}
                                        min={0}
                                        className="max-w-50"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Features</CardTitle>
                                <CardDescription>
                                    Enable or disable AI capabilities
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <Label className="text-base">Streaming</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow streamed responses
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_streaming}
                                        onCheckedChange={(v) => setData('allow_streaming', v)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <Label className="text-base">Vision</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow image processing
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_vision}
                                        onCheckedChange={(v) => setData('allow_vision', v)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <Label className="text-base">Functions/Tools</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow function calling
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_functions}
                                        onCheckedChange={(v) => setData('allow_functions', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overage */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Overage Behavior</CardTitle>
                                <CardDescription>
                                    What happens when limits are exceeded
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-4">
                                    {overageActions.map((action) => (
                                        <div
                                            key={action.key}
                                            className={`flex flex-col p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.overage_action === action.key ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => setData('overage_action', action.key)}
                                        >
                                            <span className="font-medium">{action.label}</span>
                                            <span className="text-xs text-muted-foreground">{action.description}</span>
                                        </div>
                                    ))}
                                </div>

                                {data.overage_action === 'charge' && (
                                    <div className="space-y-2 max-w-50">
                                        <Label htmlFor="overage_rate">Overage Rate ($/1K tokens)</Label>
                                        <Input
                                            id="overage_rate"
                                            type="number"
                                            step="0.001"
                                            value={data.overage_rate}
                                            onChange={(e) => setData('overage_rate', e.target.value)}
                                            placeholder="0.010"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Allowed Models */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Allowed Models</CardTitle>
                                        <CardDescription>
                                            {data.ai_models.length} of {models.length} selected
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={selectAllModels}>
                                            All
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={selectNoModels}>
                                            None
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {models.map((model) => (
                                        <div
                                            key={model.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.ai_models.includes(model.id) ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => toggleModel(model.id)}
                                        >
                                            <div>
                                                <span className="font-medium text-sm">{model.name}</span>
                                                <p className="text-xs text-muted-foreground">{model.provider}</p>
                                            </div>
                                            <Switch
                                                checked={data.ai_models.includes(model.id)}
                                                onCheckedChange={() => toggleModel(model.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Allowed Tools */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Allowed Tools</CardTitle>
                                        <CardDescription>
                                            {data.ai_tools.length} of {tools.length} selected
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={selectAllTools}>
                                            All
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={selectNoTools}>
                                            None
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.ai_tools.includes(tool.id) ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => toggleTool(tool.id)}
                                        >
                                            <div>
                                                <span className="font-medium text-sm">{tool.name}</span>
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    {tool.category}
                                                </Badge>
                                            </div>
                                            <Switch
                                                checked={data.ai_tools.includes(tool.id)}
                                                onCheckedChange={() => toggleTool(tool.id)}
                                            />
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
                            {processing ? 'Saving...' : 'Create Limit'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
