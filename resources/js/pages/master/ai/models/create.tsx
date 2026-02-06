import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Cpu } from 'lucide-react';
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

interface Props {
    providers: Record<string, string>;
    types: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Models', href: '/master/ai/models' },
    { title: 'New Model', href: '/master/ai/models/create' },
];

export default function Create({ providers, types }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        key: '',
        name: '',
        provider: '',
        type: 'chat',
        version: '',
        description: '',
        context_window: 128000,
        max_output_tokens: 4096,
        cost_per_1k_input: '',
        cost_per_1k_output: '',
        supports_vision: false,
        supports_functions: false,
        supports_streaming: true,
        capabilities: [] as string[],
        is_enabled: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master/ai/models');
    };

    const capabilityOptions = [
        { key: 'text_generation', label: 'Text Generation' },
        { key: 'code_generation', label: 'Code Generation' },
        { key: 'image_understanding', label: 'Image Understanding' },
        { key: 'function_calling', label: 'Function Calling' },
        { key: 'structured_output', label: 'Structured Output' },
        { key: 'reasoning', label: 'Advanced Reasoning' },
        { key: 'long_context', label: 'Long Context' },
    ];

    const toggleCapability = (cap: string) => {
        if (data.capabilities.includes(cap)) {
            setData('capabilities', data.capabilities.filter(c => c !== cap));
        } else {
            setData('capabilities', [...data.capabilities, cap]);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New AI Model" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/models">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New AI Model</h1>
                        <p className="text-muted-foreground">
                            Register a new AI model in the system
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Model identifier and classification
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="key">Model Key *</Label>
                                        <Input
                                            id="key"
                                            value={data.key}
                                            onChange={(e) => setData('key', e.target.value)}
                                            placeholder="gpt-4o"
                                            className={errors.key ? 'border-destructive' : ''}
                                        />
                                        {errors.key && (
                                            <p className="text-xs text-destructive">{errors.key}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Unique identifier used in API calls
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="GPT-4o"
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-destructive">{errors.name}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="provider">Provider *</Label>
                                        <Select
                                            value={data.provider}
                                            onValueChange={(v) => setData('provider', v)}
                                        >
                                            <SelectTrigger className={errors.provider ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(providers).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.provider && (
                                            <p className="text-xs text-destructive">{errors.provider}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Model Type *</Label>
                                        <Select
                                            value={data.type}
                                            onValueChange={(v) => setData('type', v)}
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="version">Version</Label>
                                    <Input
                                        id="version"
                                        value={data.version}
                                        onChange={(e) => setData('version', e.target.value)}
                                        placeholder="2024-05-01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe the model capabilities..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Specs */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Specifications</CardTitle>
                                <CardDescription>
                                    Token limits and pricing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="context_window">Context Window</Label>
                                        <Input
                                            id="context_window"
                                            type="number"
                                            value={data.context_window}
                                            onChange={(e) => setData('context_window', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Max input tokens
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_output_tokens">Max Output Tokens</Label>
                                        <Input
                                            id="max_output_tokens"
                                            type="number"
                                            value={data.max_output_tokens}
                                            onChange={(e) => setData('max_output_tokens', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost_per_1k_input">Cost per 1K Input Tokens ($)</Label>
                                        <Input
                                            id="cost_per_1k_input"
                                            type="number"
                                            step="0.0001"
                                            value={data.cost_per_1k_input}
                                            onChange={(e) => setData('cost_per_1k_input', e.target.value)}
                                            placeholder="0.0050"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cost_per_1k_output">Cost per 1K Output Tokens ($)</Label>
                                        <Input
                                            id="cost_per_1k_output"
                                            type="number"
                                            step="0.0001"
                                            value={data.cost_per_1k_output}
                                            onChange={(e) => setData('cost_per_1k_output', e.target.value)}
                                            placeholder="0.0150"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Label>Features</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="supports_vision" className="text-sm font-normal">Vision Support</Label>
                                                <p className="text-xs text-muted-foreground">Can process images</p>
                                            </div>
                                            <Switch
                                                id="supports_vision"
                                                checked={data.supports_vision}
                                                onCheckedChange={(v) => setData('supports_vision', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="supports_functions" className="text-sm font-normal">Function Calling</Label>
                                                <p className="text-xs text-muted-foreground">Supports tool/function calls</p>
                                            </div>
                                            <Switch
                                                id="supports_functions"
                                                checked={data.supports_functions}
                                                onCheckedChange={(v) => setData('supports_functions', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="supports_streaming" className="text-sm font-normal">Streaming</Label>
                                                <p className="text-xs text-muted-foreground">Supports response streaming</p>
                                            </div>
                                            <Switch
                                                id="supports_streaming"
                                                checked={data.supports_streaming}
                                                onCheckedChange={(v) => setData('supports_streaming', v)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Capabilities */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Capabilities</CardTitle>
                                <CardDescription>
                                    Select what this model can do
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {capabilityOptions.map((cap) => (
                                        <div
                                            key={cap.key}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                                                data.capabilities.includes(cap.key) ? 'border-primary bg-primary/5' : ''
                                            }`}
                                            onClick={() => toggleCapability(cap.key)}
                                        >
                                            <span className="text-sm">{cap.label}</span>
                                            <Switch
                                                checked={data.capabilities.includes(cap.key)}
                                                onCheckedChange={() => toggleCapability(cap.key)}
                                            />
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
                                    Control model availability
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="is_enabled" className="text-base">Enable Model</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Make this model available for tenant use
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
                        <Link href="/master/ai/models">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Create Model'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
