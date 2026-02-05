import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    HardDrive,
    Save,
    Settings,
    Sparkles,
    Users,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    trial_days: number;
    max_users: number;
    max_storage_mb: number;
    max_ai_requests: number;
    features: string[] | null;
    price_monthly: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
    plan_id: number;
    plan: Plan | null;
    timezone: string;
    locale: string;
    region: string | null;
    industry_type: string | null;
    seats_limit: number | null;
    storage_limit_mb: number | null;
    ai_requests_limit: number | null;
    enabled_modules: string[] | null;
}

interface Props {
    tenant: Tenant;
    plans: Plan[];
    timezones: string[];
    locales: Record<string, string>;
    baseDomain: string;
}

export default function Edit({ tenant, timezones, locales, baseDomain }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tenants', href: '/tenants' },
        { title: tenant.name, href: `/tenants/${tenant.id}` },
        { title: 'Edit', href: `/tenants/${tenant.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name,
        timezone: tenant.timezone,
        locale: tenant.locale,
        region: tenant.region || '',
        industry_type: tenant.industry_type || '',
        seats_limit: tenant.seats_limit ? String(tenant.seats_limit) : '',
        storage_limit_mb: tenant.storage_limit_mb ? String(tenant.storage_limit_mb) : '',
        ai_requests_limit: tenant.ai_requests_limit ? String(tenant.ai_requests_limit) : '',
        enabled_modules: tenant.enabled_modules || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/tenants/${tenant.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/tenants/${tenant.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Tenant</h1>
                        <p className="text-muted-foreground">
                            {tenant.slug}.{baseDomain}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Core tenant identity settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company / Tenant Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={data.timezone}
                                        onValueChange={(value) => setData('timezone', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.timezone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="locale">Language / Locale</Label>
                                    <Select
                                        value={data.locale}
                                        onValueChange={(value) => setData('locale', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(locales).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.locale} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="region">Region</Label>
                                    <Input
                                        id="region"
                                        value={data.region}
                                        onChange={(e) => setData('region', e.target.value)}
                                        placeholder="e.g., North America"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry_type">Industry</Label>
                                    <Input
                                        id="industry_type"
                                        value={data.industry_type}
                                        onChange={(e) => setData('industry_type', e.target.value)}
                                        placeholder="e.g., Manufacturing"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Limits Override */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Custom Limits
                            </CardTitle>
                            <CardDescription>
                                Override plan defaults for this tenant (leave empty to use plan defaults)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm">
                                    Current plan: <strong>{tenant.plan?.name}</strong>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Default limits: {tenant.plan?.max_users === -1 ? 'Unlimited' : tenant.plan?.max_users} users,{' '}
                                    {tenant.plan?.max_storage_mb === -1 ? 'Unlimited' : tenant.plan?.max_storage_mb} MB storage,{' '}
                                    {tenant.plan?.max_ai_requests === -1 ? 'Unlimited' : tenant.plan?.max_ai_requests} AI requests
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="seats_limit" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Seats Limit
                                    </Label>
                                    <Input
                                        id="seats_limit"
                                        type="number"
                                        value={data.seats_limit}
                                        onChange={(e) => setData('seats_limit', e.target.value)}
                                        placeholder={String(tenant.plan?.max_users || 'Plan default')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use -1 for unlimited
                                    </p>
                                    <InputError message={errors.seats_limit} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="storage_limit_mb" className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4" />
                                        Storage (MB)
                                    </Label>
                                    <Input
                                        id="storage_limit_mb"
                                        type="number"
                                        value={data.storage_limit_mb}
                                        onChange={(e) => setData('storage_limit_mb', e.target.value)}
                                        placeholder={String(tenant.plan?.max_storage_mb || 'Plan default')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use -1 for unlimited
                                    </p>
                                    <InputError message={errors.storage_limit_mb} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ai_requests_limit" className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        AI Requests
                                    </Label>
                                    <Input
                                        id="ai_requests_limit"
                                        type="number"
                                        value={data.ai_requests_limit}
                                        onChange={(e) => setData('ai_requests_limit', e.target.value)}
                                        placeholder={String(tenant.plan?.max_ai_requests || 'Plan default')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Monthly limit, -1 for unlimited
                                    </p>
                                    <InputError message={errors.ai_requests_limit} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Link href={`/tenants/${tenant.id}`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
