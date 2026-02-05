import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    CreditCard,
    HardDrive,
    Shield,
    Sparkles,
    User,
    Users,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { Switch } from '@/components/ui/switch';

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

interface Props {
    plans: Plan[];
    timezones: string[];
    locales: Record<string, string>;
    industries: Record<string, string>;
    baseDomain: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tenants',
        href: '/tenants',
    },
    {
        title: 'Create',
        href: '/tenants/create',
    },
];

const steps = [
    { id: 1, name: 'Identity', icon: Building2 },
    { id: 2, name: 'Plan & Limits', icon: CreditCard },
    { id: 3, name: 'Admin User', icon: User },
];

export default function Create({ plans, timezones, locales, industries, baseDomain }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        // Step 1: Identity
        name: '',
        slug: '',
        timezone: 'America/Mexico_City',
        locale: 'es-MX',
        region: '',
        industry_type: '',

        // Step 2: Plan & Limits
        plan_id: '',
        trial_days: '',
        seats_limit: '',
        storage_limit_mb: '',
        ai_requests_limit: '',
        enabled_modules: [] as string[],

        // Step 3: Admin User
        admin_name: '',
        admin_email: '',
        admin_password: '',
        send_invite: true,
        require_mfa: false,
    });

    // Generate slug from name
    const generateSlug = useCallback((name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }, []);

    const resetSlugStatus = useCallback((slug: string) => {
        if (!slug || slug.length < 3) {
            setSlugAvailable(null);
            setCheckingSlug(false);
        }
    }, []);

    // Auto-generate slug from name when name changes
    const handleNameChange = useCallback((name: string) => {
        setData((prev) => {
            const nextSlug = prev.slug || generateSlug(name);
            resetSlugStatus(nextSlug);

            return {
                ...prev,
                name,
                slug: nextSlug,
            };
        });
    }, [setData, generateSlug, resetSlugStatus]);

    // Check slug availability
    useEffect(() => {
        const slug = data.slug;
        if (!slug || slug.length < 3) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setCheckingSlug(true);
            try {
                const response = await fetch(`/tenants/check-slug?slug=${slug}`, {
                    signal: controller.signal,
                });
                const result = await response.json();
                setSlugAvailable(result.available);
            } catch (e) {
                if (e instanceof Error && e.name !== 'AbortError') {
                    setSlugAvailable(null);
                }
            }
            setCheckingSlug(false);
        }, 500);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [data.slug]);

    const selectedPlan = plans.find((p) => p.id === Number(data.plan_id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tenants');
    };

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const canProceed = () => {
        if (currentStep === 1) {
            return data.name && data.slug && slugAvailable && data.timezone && data.locale;
        }
        if (currentStep === 2) {
            return data.plan_id;
        }
        if (currentStep === 3) {
            return data.admin_name && data.admin_email;
        }
        return false;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tenant" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/tenants">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Tenant</h1>
                        <p className="text-muted-foreground">
                            Set up a new tenant with their own database and subdomain
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="mx-auto max-w-3xl">
                    <nav aria-label="Progress">
                        <ol className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isCompleted = currentStep > step.id;
                                const isCurrent = currentStep === step.id;

                                return (
                                    <li key={step.id} className="flex flex-1 items-center">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                                                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                                                    isCurrent && 'border-primary text-primary',
                                                    !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <StepIcon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'mt-2 text-sm font-medium',
                                                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                                                )}
                                            >
                                                {step.name}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={cn(
                                                    'mx-4 h-0.5 flex-1',
                                                    isCompleted ? 'bg-primary' : 'bg-muted'
                                                )}
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Identity */}
                    {currentStep === 1 && (
                        <Card className="mx-auto max-w-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Tenant Identity
                                </CardTitle>
                                <CardDescription>
                                    Basic information about the tenant organization
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company / Tenant Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="e.g., Acme Corporation"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Slug / Subdomain */}
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Subdomain *</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => {
                                                const nextSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                setData('slug', nextSlug);
                                                resetSlugStatus(nextSlug);
                                            }}
                                            placeholder="acme"
                                            className="max-w-50"
                                        />
                                        <span className="text-muted-foreground">.{baseDomain}</span>
                                        {checkingSlug && (
                                            <span className="text-sm text-muted-foreground">Checking...</span>
                                        )}
                                        {!checkingSlug && slugAvailable === true && (
                                            <Badge variant="outline" className="border-green-500 text-green-600">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Available
                                            </Badge>
                                        )}
                                        {!checkingSlug && slugAvailable === false && (
                                            <Badge variant="destructive">Taken</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This will be the tenant's subdomain URL
                                    </p>
                                    <InputError message={errors.slug} />
                                </div>

                                <Separator />

                                {/* Timezone & Locale */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone *</Label>
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
                                        <Label htmlFor="locale">Language / Locale *</Label>
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

                                {/* Region & Industry */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="region">Region (optional)</Label>
                                        <Input
                                            id="region"
                                            value={data.region}
                                            onChange={(e) => setData('region', e.target.value)}
                                            placeholder="e.g., North America"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="industry_type">Industry (optional)</Label>
                                        <Select
                                            value={data.industry_type}
                                            onValueChange={(value) => setData('industry_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(industries).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Plan & Limits */}
                    {currentStep === 2 && (
                        <Card className="mx-auto max-w-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Plan & Limits
                                </CardTitle>
                                <CardDescription>
                                    Select a subscription plan and configure limits
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Plan Selection */}
                                <div className="space-y-4">
                                    <Label>Select Plan *</Label>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {plans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => setData('plan_id', String(plan.id))}
                                                className={cn(
                                                    'cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50',
                                                    data.plan_id === String(plan.id)
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-muted'
                                                )}
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <h4 className="font-semibold">{plan.name}</h4>
                                                    {data.plan_id === String(plan.id) && (
                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <p className="mb-3 text-2xl font-bold">
                                                    ${plan.price_monthly}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        /mo
                                                    </span>
                                                </p>
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <Users className="h-3 w-3" />
                                                        {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <HardDrive className="h-3 w-3" />
                                                        {plan.max_storage_mb === -1 ? 'Unlimited' : `${plan.max_storage_mb} MB`}
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Sparkles className="h-3 w-3" />
                                                        {plan.max_ai_requests === -1 ? 'Unlimited' : plan.max_ai_requests} AI reqs
                                                    </li>
                                                </ul>
                                                {plan.trial_days > 0 && (
                                                    <Badge className="mt-3" variant="secondary">
                                                        {plan.trial_days} day trial
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.plan_id} />
                                </div>

                                <Separator />

                                {/* Custom Limits (Optional) */}
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base">Custom Limits (Optional)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Override plan defaults for this specific tenant
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="trial_days">Trial Days</Label>
                                            <Input
                                                id="trial_days"
                                                type="number"
                                                value={data.trial_days}
                                                onChange={(e) => setData('trial_days', e.target.value)}
                                                placeholder={selectedPlan ? String(selectedPlan.trial_days) : '14'}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Leave empty to use plan default
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="seats_limit">Seats Limit</Label>
                                            <Input
                                                id="seats_limit"
                                                type="number"
                                                value={data.seats_limit}
                                                onChange={(e) => setData('seats_limit', e.target.value)}
                                                placeholder={selectedPlan ? String(selectedPlan.max_users) : 'Auto'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storage_limit_mb">Storage Limit (MB)</Label>
                                            <Input
                                                id="storage_limit_mb"
                                                type="number"
                                                value={data.storage_limit_mb}
                                                onChange={(e) => setData('storage_limit_mb', e.target.value)}
                                                placeholder={selectedPlan ? String(selectedPlan.max_storage_mb) : 'Auto'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ai_requests_limit">AI Requests Limit</Label>
                                            <Input
                                                id="ai_requests_limit"
                                                type="number"
                                                value={data.ai_requests_limit}
                                                onChange={(e) => setData('ai_requests_limit', e.target.value)}
                                                placeholder={selectedPlan ? String(selectedPlan.max_ai_requests) : 'Auto'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Admin User */}
                    {currentStep === 3 && (
                        <Card className="mx-auto max-w-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Initial Admin User
                                </CardTitle>
                                <CardDescription>
                                    Set up the first administrator for this tenant
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Admin Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_name">Full Name *</Label>
                                    <Input
                                        id="admin_name"
                                        value={data.admin_name}
                                        onChange={(e) => setData('admin_name', e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    <InputError message={errors.admin_name} />
                                </div>

                                {/* Admin Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">Email Address *</Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        value={data.admin_email}
                                        onChange={(e) => setData('admin_email', e.target.value)}
                                        placeholder="admin@company.com"
                                    />
                                    <InputError message={errors.admin_email} />
                                </div>

                                {/* Password Options */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Send Invitation Email</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Send an email to set up their own password
                                            </p>
                                        </div>
                                        <Switch
                                            checked={data.send_invite}
                                            onCheckedChange={(checked) => setData('send_invite', checked)}
                                        />
                                    </div>

                                    {!data.send_invite && (
                                        <div className="space-y-2">
                                            <Label htmlFor="admin_password">Temporary Password</Label>
                                            <Input
                                                id="admin_password"
                                                type="password"
                                                value={data.admin_password}
                                                onChange={(e) => setData('admin_password', e.target.value)}
                                                placeholder="Min. 8 characters"
                                            />
                                            <InputError message={errors.admin_password} />
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Security Options */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Require MFA
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Force admin to set up two-factor authentication
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.require_mfa}
                                        onCheckedChange={(checked) => setData('require_mfa', checked)}
                                    />
                                </div>

                                {/* Summary */}
                                <Card className="bg-muted/50">
                                    <CardContent className="pt-6">
                                        <h4 className="mb-3 font-medium">Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tenant:</span>
                                                <span className="font-medium">{data.name || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subdomain:</span>
                                                <span className="font-medium">
                                                    {data.slug ? `${data.slug}.${baseDomain}` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Plan:</span>
                                                <span className="font-medium">
                                                    {selectedPlan?.name || '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Admin:</span>
                                                <span className="font-medium">
                                                    {data.admin_email || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation */}
                    <div className="mx-auto mt-6 flex max-w-3xl justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!canProceed()}
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={processing || !canProceed()}>
                                {processing ? 'Creating...' : 'Create Tenant'}
                                <CheckCircle2 className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
