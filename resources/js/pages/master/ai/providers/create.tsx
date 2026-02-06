import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Server, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
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
    statuses: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Providers', href: '/master/ai/providers' },
    { title: 'New Provider', href: '/master/ai/providers/create' },
];

export default function Create({ providers = {}, statuses = {} }: Props) {
    const [showApiKey, setShowApiKey] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        provider: '',
        name: '',
        api_key: '',
        api_endpoint: '',
        api_version: '',
        org_id: '',
        rate_limit_rpm: '',
        rate_limit_tpm: '',
        default_timeout_ms: 30000,
        additional_config: '{}',
        status: 'operational',
        is_enabled: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master/ai/providers');
    };

    const getEndpointPlaceholder = () => {
        switch (data.provider) {
            case 'openai':
                return 'https://api.openai.com/v1';
            case 'anthropic':
                return 'https://api.anthropic.com';
            case 'azure_openai':
                return 'https://{resource}.openai.azure.com';
            case 'google':
                return 'https://generativelanguage.googleapis.com';
            default:
                return 'https://api.example.com';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New AI Provider" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/providers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New AI Provider</h1>
                        <p className="text-muted-foreground">
                            Configure a new AI provider connection
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Provider identifier and display settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider Type *</Label>
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
                                    <Label htmlFor="name">Display Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="OpenAI Production"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive">{errors.name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Friendly name for this configuration
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v) => setData('status', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statuses).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* API Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>API Configuration</CardTitle>
                                <CardDescription>
                                    Connection credentials and endpoints
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="api_key">API Key</Label>
                                    <div className="relative">
                                        <Input
                                            id="api_key"
                                            type={showApiKey ? 'text' : 'password'}
                                            value={data.api_key}
                                            onChange={(e) => setData('api_key', e.target.value)}
                                            placeholder="sk-..."
                                            className="pr-10"
                                            autoComplete="off"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            {showApiKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Stored encrypted. Leave empty to skip.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="api_endpoint">API Endpoint</Label>
                                    <Input
                                        id="api_endpoint"
                                        value={data.api_endpoint}
                                        onChange={(e) => setData('api_endpoint', e.target.value)}
                                        placeholder={getEndpointPlaceholder()}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Override default endpoint (optional)
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="api_version">API Version</Label>
                                        <Input
                                            id="api_version"
                                            value={data.api_version}
                                            onChange={(e) => setData('api_version', e.target.value)}
                                            placeholder="2024-02-01"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="org_id">Organization ID</Label>
                                        <Input
                                            id="org_id"
                                            value={data.org_id}
                                            onChange={(e) => setData('org_id', e.target.value)}
                                            placeholder="org-..."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rate Limits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Rate Limits</CardTitle>
                                <CardDescription>
                                    Provider-level rate limiting
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="rate_limit_rpm">Requests / Minute</Label>
                                        <Input
                                            id="rate_limit_rpm"
                                            type="number"
                                            value={data.rate_limit_rpm}
                                            onChange={(e) => setData('rate_limit_rpm', e.target.value)}
                                            placeholder="3500"
                                            min={0}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rate_limit_tpm">Tokens / Minute</Label>
                                        <Input
                                            id="rate_limit_tpm"
                                            type="number"
                                            value={data.rate_limit_tpm}
                                            onChange={(e) => setData('rate_limit_tpm', e.target.value)}
                                            placeholder="90000"
                                            min={0}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="default_timeout_ms">Default Timeout (ms)</Label>
                                    <Input
                                        id="default_timeout_ms"
                                        type="number"
                                        value={data.default_timeout_ms}
                                        onChange={(e) => setData('default_timeout_ms', parseInt(e.target.value) || 0)}
                                        min={1000}
                                        step={1000}
                                        className="max-w-50"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Config */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Configuration</CardTitle>
                                <CardDescription>
                                    Provider-specific settings (JSON)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="additional_config">Config (JSON)</Label>
                                    <Textarea
                                        id="additional_config"
                                        value={data.additional_config}
                                        onChange={(e) => setData('additional_config', e.target.value)}
                                        placeholder="{}"
                                        rows={5}
                                        className={`font-mono text-sm ${errors.additional_config ? 'border-destructive' : ''}`}
                                    />
                                    {errors.additional_config && (
                                        <p className="text-xs text-destructive">{errors.additional_config}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Activation</CardTitle>
                                <CardDescription>
                                    Control provider availability
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between max-w-md">
                                    <div>
                                        <Label className="text-base">Enable Provider</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Make this provider available for AI models
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
                        <Link href="/master/ai/providers">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Create Provider'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
