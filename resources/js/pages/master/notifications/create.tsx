import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    plans: Plan[];
    tenants: Tenant[];
    categories: string[];
    severities: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Notifications',
        href: '/master/notifications',
    },
    {
        title: 'Create',
        href: '/master/notifications/create',
    },
];

const categoryLabels: Record<string, string> = {
    maintenance: 'Maintenance',
    release: 'Release / Update',
    incident: 'Incident',
    announcement: 'Announcement',
};

const severityLabels: Record<string, string> = {
    info: 'Info',
    warning: 'Warning',
    critical: 'Critical',
};

const roleOptions = [
    { value: 'tenant_admin', label: 'Tenant Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'User' },
];

type TargetingType = 'all' | 'plans' | 'tenants' | 'roles';

export default function Create({ plans, tenants, categories, severities }: Props) {
    const [targetingType, setTargetingType] = useState<TargetingType>('all');

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        body: '',
        category: 'announcement',
        severity: 'info',
        cta_label: '',
        cta_url: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
        is_sticky: false,
        targeting: {
            all: true,
            plans: [] as number[],
            tenants: [] as number[],
            roles: [] as string[],
        },
    });

    const handleTargetingTypeChange = (type: TargetingType) => {
        setTargetingType(type);
        setData('targeting', {
            all: type === 'all',
            plans: type === 'plans' ? data.targeting.plans : [],
            tenants: type === 'tenants' ? data.targeting.tenants : [],
            roles: type === 'roles' ? data.targeting.roles : [],
        });
    };

    const togglePlan = (planId: number) => {
        const current = data.targeting.plans || [];
        const newPlans = current.includes(planId)
            ? current.filter(id => id !== planId)
            : [...current, planId];
        setData('targeting', { ...data.targeting, plans: newPlans });
    };

    const toggleTenant = (tenantId: number) => {
        const current = data.targeting.tenants || [];
        const newTenants = current.includes(tenantId)
            ? current.filter(id => id !== tenantId)
            : [...current, tenantId];
        setData('targeting', { ...data.targeting, tenants: newTenants });
    };

    const toggleRole = (role: string) => {
        const current = data.targeting.roles || [];
        const newRoles = current.includes(role)
            ? current.filter(r => r !== role)
            : [...current, role];
        setData('targeting', { ...data.targeting, roles: newRoles });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master/notifications');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Notification" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/master/notifications">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Create Notification</h1>
                            <p className="text-muted-foreground">
                                Send a new notification to tenants
                            </p>
                        </div>
                    </div>
                    <Button type="submit" disabled={processing}>
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Creating...' : 'Create Notification'}
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Content</CardTitle>
                                <CardDescription>
                                    The message that will be shown to users
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g., Scheduled Maintenance"
                                        maxLength={255}
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="body">Message *</Label>
                                    <Textarea
                                        id="body"
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                        placeholder="Enter the notification message..."
                                        rows={4}
                                        maxLength={5000}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {data.body.length}/5000 characters
                                    </p>
                                    <InputError message={errors.body} />
                                </div>

                                <Separator />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cta_label">Button Label (optional)</Label>
                                        <Input
                                            id="cta_label"
                                            value={data.cta_label}
                                            onChange={(e) => setData('cta_label', e.target.value)}
                                            placeholder="e.g., Learn More"
                                            maxLength={100}
                                        />
                                        <InputError message={errors.cta_label} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cta_url">Button URL (optional)</Label>
                                        <Input
                                            id="cta_url"
                                            type="url"
                                            value={data.cta_url}
                                            onChange={(e) => setData('cta_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                        <InputError message={errors.cta_url} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Targeting */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Targeting</CardTitle>
                                <CardDescription>
                                    Choose who should see this notification
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={targetingType === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTargetingTypeChange('all')}
                                    >
                                        All Tenants
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={targetingType === 'plans' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTargetingTypeChange('plans')}
                                    >
                                        By Plan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={targetingType === 'tenants' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTargetingTypeChange('tenants')}
                                    >
                                        Specific Tenants
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={targetingType === 'roles' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTargetingTypeChange('roles')}
                                    >
                                        By Role
                                    </Button>
                                </div>

                                {targetingType === 'all' && (
                                    <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                                        This notification will be visible to all tenants
                                    </div>
                                )}

                                {targetingType === 'plans' && (
                                    <div className="space-y-2">
                                        <Label>Select Plans</Label>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {plans.map((plan) => (
                                                <label
                                                    key={plan.id}
                                                    className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                                                >
                                                    <Checkbox
                                                        checked={data.targeting.plans?.includes(plan.id)}
                                                        onCheckedChange={() => togglePlan(plan.id)}
                                                    />
                                                    <span>{plan.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {data.targeting.plans?.length === 0 && (
                                            <p className="text-sm text-destructive">
                                                Select at least one plan
                                            </p>
                                        )}
                                    </div>
                                )}

                                {targetingType === 'tenants' && (
                                    <div className="space-y-2">
                                        <Label>Select Tenants</Label>
                                        <div className="max-h-60 overflow-y-auto rounded-lg border">
                                            {tenants.map((tenant) => (
                                                <label
                                                    key={tenant.id}
                                                    className="flex items-center gap-2 border-b p-3 cursor-pointer hover:bg-muted/50 last:border-b-0"
                                                >
                                                    <Checkbox
                                                        checked={data.targeting.tenants?.includes(tenant.id)}
                                                        onCheckedChange={() => toggleTenant(tenant.id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{tenant.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {tenant.slug}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {data.targeting.tenants?.length === 0 && (
                                            <p className="text-sm text-destructive">
                                                Select at least one tenant
                                            </p>
                                        )}
                                    </div>
                                )}

                                {targetingType === 'roles' && (
                                    <div className="space-y-2">
                                        <Label>Select Roles</Label>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {roleOptions.map((role) => (
                                                <label
                                                    key={role.value}
                                                    className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                                                >
                                                    <Checkbox
                                                        checked={data.targeting.roles?.includes(role.value)}
                                                        onCheckedChange={() => toggleRole(role.value)}
                                                    />
                                                    <span>{role.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {data.targeting.roles?.length === 0 && (
                                            <p className="text-sm text-destructive">
                                                Select at least one role
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Classification */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Classification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {categoryLabels[category] || category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="severity">Severity *</Label>
                                    <Select
                                        value={data.severity}
                                        onValueChange={(value) => setData('severity', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {severities.map((severity) => (
                                                <SelectItem key={severity} value={severity}>
                                                    {severityLabels[severity] || severity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.severity} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scheduling */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Scheduling</CardTitle>
                                <CardDescription>
                                    When should this notification be visible?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="starts_at">Start Date (optional)</Label>
                                    <Input
                                        id="starts_at"
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                    />
                                    <InputError message={errors.starts_at} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ends_at">End Date (optional)</Label>
                                    <Input
                                        id="ends_at"
                                        type="datetime-local"
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                    />
                                    <InputError message={errors.ends_at} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Options</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Publish immediately
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Sticky</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Can't dismiss until read
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_sticky}
                                        onCheckedChange={(checked) => setData('is_sticky', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
