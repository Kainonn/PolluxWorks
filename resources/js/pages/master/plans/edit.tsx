import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    Users,
    Boxes,
    Sparkles,
    HardDrive,
    Calendar,
    Settings,
    Check,
    Info,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price_monthly: string;
    price_yearly: string;
    currency: string;
    max_users: number;
    max_modules: number;
    max_ai_requests: number;
    max_storage_mb: number;
    trial_days: number;
    features: string[] | null;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    plan: Plan;
    availableFeatures: Record<string, string>;
}

const breadcrumbs = (planId: number): BreadcrumbItem[] => [
    {
        title: 'Plans',
        href: '/plans',
    },
    {
        title: 'Edit',
        href: `/plans/${planId}/edit`,
    },
];

export default function Edit({ plan, availableFeatures }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
        max_users: String(plan.max_users),
        max_modules: String(plan.max_modules),
        max_ai_requests: String(plan.max_ai_requests),
        max_storage_mb: String(plan.max_storage_mb),
        trial_days: String(plan.trial_days),
        features: plan.features || [],
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        sort_order: String(plan.sort_order),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/plans/${plan.id}`);
    };

    const toggleFeature = (feature: string) => {
        const newFeatures = data.features.includes(feature)
            ? data.features.filter((f) => f !== feature)
            : [...data.features, feature];
        setData('features', newFeatures);
    };

    const calculateYearlyDiscount = () => {
        const monthly = parseFloat(data.price_monthly) || 0;
        const yearly = parseFloat(data.price_yearly) || 0;
        if (monthly <= 0) return 0;
        const yearlyIfMonthly = monthly * 12;
        const discount = ((yearlyIfMonthly - yearly) / yearlyIfMonthly) * 100;
        return Math.max(0, Math.round(discount));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(plan.id)}>
            <Head title={`Edit ${plan.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/plans/${plan.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Plan
                        </h1>
                        <p className="text-muted-foreground">
                            Update {plan.name} plan details
                        </p>
                    </div>
                </div>

                {/* Preview Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{plan.name}</p>
                                {plan.is_featured && (
                                    <Badge variant="secondary">Featured</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {plan.slug}
                            </p>
                        </div>
                        <Badge variant="secondary">ID: #{plan.id}</Badge>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Update the plan's name and description
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Plan Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Starter, Pro, Enterprise"
                                        className="h-11"
                                        autoFocus
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        placeholder="Auto-generated from name"
                                        className="h-11"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to auto-generate from name
                                    </p>
                                    <InputError message={errors.slug} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Brief description of what this plan offers..."
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Make this plan available for purchase
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Featured</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Highlight this plan as recommended
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_featured}
                                        onCheckedChange={(checked) => setData('is_featured', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', e.target.value)}
                                        min="0"
                                        className="h-11"
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Pricing
                                </CardTitle>
                                <CardDescription>
                                    Update monthly and yearly prices
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Price changes will not affect existing subscriptions
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input
                                        id="currency"
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                                        placeholder="USD"
                                        maxLength={3}
                                        className="h-11 w-24"
                                    />
                                    <InputError message={errors.currency} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="price_monthly">Monthly Price *</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="price_monthly"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.price_monthly}
                                                onChange={(e) => setData('price_monthly', e.target.value)}
                                                className="h-11 pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.price_monthly} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="price_yearly">Yearly Price *</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="price_yearly"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.price_yearly}
                                                onChange={(e) => setData('price_yearly', e.target.value)}
                                                className="h-11 pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.price_yearly} />
                                    </div>
                                </div>

                                {calculateYearlyDiscount() > 0 && (
                                    <p className="text-sm text-green-600">
                                        💰 {calculateYearlyDiscount()}% discount on yearly billing
                                    </p>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="trial_days" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Trial Days
                                    </Label>
                                    <Input
                                        id="trial_days"
                                        type="number"
                                        min="0"
                                        value={data.trial_days}
                                        onChange={(e) => setData('trial_days', e.target.value)}
                                        className="h-11 w-32"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Set to 0 for no trial period
                                    </p>
                                    <InputError message={errors.trial_days} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Limits */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Resource Limits
                                </CardTitle>
                                <CardDescription>
                                    Update usage limits (use -1 for unlimited)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_users" className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            Max Users
                                        </Label>
                                        <Input
                                            id="max_users"
                                            type="number"
                                            min="-1"
                                            value={data.max_users}
                                            onChange={(e) => setData('max_users', e.target.value)}
                                            className="h-11"
                                        />
                                        <InputError message={errors.max_users} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_modules" className="flex items-center gap-2">
                                            <Boxes className="h-4 w-4 text-muted-foreground" />
                                            Max Modules
                                        </Label>
                                        <Input
                                            id="max_modules"
                                            type="number"
                                            min="-1"
                                            value={data.max_modules}
                                            onChange={(e) => setData('max_modules', e.target.value)}
                                            className="h-11"
                                        />
                                        <InputError message={errors.max_modules} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_ai_requests" className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                                            Max AI Requests
                                        </Label>
                                        <Input
                                            id="max_ai_requests"
                                            type="number"
                                            min="-1"
                                            value={data.max_ai_requests}
                                            onChange={(e) => setData('max_ai_requests', e.target.value)}
                                            className="h-11"
                                        />
                                        <InputError message={errors.max_ai_requests} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_storage_mb" className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                                            Max Storage (MB)
                                        </Label>
                                        <Input
                                            id="max_storage_mb"
                                            type="number"
                                            min="-1"
                                            value={data.max_storage_mb}
                                            onChange={(e) => setData('max_storage_mb', e.target.value)}
                                            className="h-11"
                                        />
                                        <InputError message={errors.max_storage_mb} />
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    💡 Use -1 for unlimited resources
                                </p>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Feature Flags
                                </CardTitle>
                                <CardDescription>
                                    Update features included in this plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {Object.entries(availableFeatures).map(([key, label]) => (
                                        <div
                                            key={key}
                                            className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                id={key}
                                                checked={data.features.includes(key)}
                                                onCheckedChange={() => toggleFeature(key)}
                                            />
                                            <Label
                                                htmlFor={key}
                                                className="flex-1 cursor-pointer text-sm font-normal"
                                            >
                                                {label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <InputError message={errors.features} className="mt-2" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <Link href={`/plans/${plan.id}`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
