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

interface AiProviderConfig {
    id: number;
    provider: string;
    name: string;
    is_enabled: boolean;
    status: string;
    api_endpoint: string | null;
    api_version: string | null;
    org_id: string | null;
    rate_limit_rpm: number | null;
    rate_limit_tpm: number | null;
    default_timeout_ms: number;
    additional_config: Record<string, unknown> | null;
    has_api_key: boolean;
}

interface Props {
    provider: AiProviderConfig;
    providers: Record<string, string>;
    statuses: Record<string, string>;
}

export default function Edit({ provider, providers = {}, statuses = {} }: Props) {
    const [showApiKey, setShowApiKey] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Control Center', href: '/master/ai/models' },
        { title: 'Providers', href: '/master/ai/providers' },
        { title: provider.name, href: `/master/ai/providers/${provider.id}` },
        { title: 'Edit', href: `/master/ai/providers/${provider.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        provider: provider.provider,
        name: provider.name,
        api_key: '',
        api_endpoint: provider.api_endpoint || '',
        api_version: provider.api_version || '',
        org_id: provider.org_id || '',
        rate_limit_rpm: provider.rate_limit_rpm ?? '',
        rate_limit_tpm: provider.rate_limit_tpm ?? '',
        default_timeout_ms: provider.default_timeout_ms,
        additional_config: provider.additional_config ? JSON.stringify(provider.additional_config, null, 2) : '{}',
        status: provider.status,
        is_enabled: provider.is_enabled,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master/ai/providers/${provider.id}`);
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
            <Head title={`Edit ${provider.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/master/ai/providers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {provider.name}</h1>
                        <p className="text-muted-foreground">
                            Update AI provider configuration
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
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider Type *</Label>
                                    <Select
                                        value={data.provider}
                                        onValueChange={(v) => setData('provider', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(providers).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    {provider.has_api_key
                                        ? 'API key is configured. Leave empty to keep existing key.'
                                        : 'No API key configured yet.'}
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
                                            placeholder={provider.has_api_key ? '••••••••••••••••' : 'sk-...'}
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
                                        Leave empty to keep current key
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
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="rate_limit_rpm">Requests / Minute</Label>
                                        <Input
                                            id="rate_limit_rpm"
                                            type="number"
                                            value={data.rate_limit_rpm}
                                            onChange={(e) => setData('rate_limit_rpm', e.target.value ? parseInt(e.target.value) : '')}
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
                                            onChange={(e) => setData('rate_limit_tpm', e.target.value ? parseInt(e.target.value) : '')}
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="additional_config">Config (JSON)</Label>
                                    <Textarea
                                        id="additional_config"
                                        value={data.additional_config}
                                        onChange={(e) => setData('additional_config', e.target.value)}
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
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between max-w-md">
                                    <div>
                                        <Label className="text-base">Enable Provider</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Make available for AI models
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
                            {processing ? 'Saving...' : 'Update Provider'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
