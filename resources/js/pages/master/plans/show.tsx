import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    MoreHorizontal,
    Pencil,
    Trash2,
    Copy,
    Check,
    DollarSign,
    Users,
    Boxes,
    Sparkles,
    HardDrive,
    Calendar,
    Clock,
    Hash,
    Star,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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

const breadcrumbs = (plan: Plan): BreadcrumbItem[] => [
    {
        title: 'Plans',
        href: '/plans',
    },
    {
        title: plan.name,
        href: `/plans/${plan.id}`,
    },
];

export default function Show({ plan, availableFeatures }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/plans/${plan.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
            },
        });
    };

    const copySlug = () => {
        navigator.clipboard.writeText(plan.slug);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatPrice = (price: string, currency: string) => {
        const numPrice = parseFloat(price);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(numPrice);
    };

    const formatLimit = (value: number) => {
        if (value === -1) return 'Unlimited';
        return value.toLocaleString();
    };

    const formatStorage = (mb: number) => {
        if (mb === -1) return 'Unlimited';
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffInDays = Math.floor(
            (now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    const getYearlyDiscount = () => {
        const monthly = parseFloat(plan.price_monthly);
        const yearly = parseFloat(plan.price_yearly);
        if (monthly <= 0) return 0;
        const yearlyIfMonthly = monthly * 12;
        const discount = ((yearlyIfMonthly - yearly) / yearlyIfMonthly) * 100;
        return Math.max(0, Math.round(discount));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(plan)}>
            <Head title={plan.name} />

            <div className="space-y-6">
                {/* Header with back button and actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/plans">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Plan Details
                            </h1>
                            <p className="text-muted-foreground">
                                View and manage plan information
                            </p>
                        </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <MoreHorizontal className="h-4 w-4" />
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Plan Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/plans/${plan.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Plan
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={copySlug}>
                                {copied ? (
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="mr-2 h-4 w-4" />
                                )}
                                {copied ? 'Copied!' : 'Copy Slug'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Plan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Plan Profile Card */}
                    <Card className="lg:col-span-1">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/60 shadow-lg">
                                        <CreditCard className="h-10 w-10 text-primary-foreground" />
                                    </div>
                                    {plan.is_featured && (
                                        <div className="absolute -right-1 -top-1 rounded-full bg-yellow-400 p-1">
                                            <Star className="h-4 w-4 fill-white text-white" />
                                        </div>
                                    )}
                                </div>

                                <h2 className="mt-4 text-2xl font-bold">{plan.name}</h2>
                                <p className="text-sm text-muted-foreground">{plan.slug}</p>

                                <div className="mt-3 flex items-center gap-2">
                                    {plan.is_active ? (
                                        <Badge className="bg-green-500/10 text-green-600">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="border-orange-300 text-orange-600"
                                        >
                                            <XCircle className="mr-1 h-3 w-3" />
                                            Inactive
                                        </Badge>
                                    )}
                                    {plan.is_featured && (
                                        <Badge variant="secondary">
                                            <Star className="mr-1 h-3 w-3" />
                                            Featured
                                        </Badge>
                                    )}
                                </div>

                                {plan.description && (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        {plan.description}
                                    </p>
                                )}

                                <Separator className="my-6" />

                                {/* Pricing */}
                                <div className="w-full space-y-4">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold">
                                            {formatPrice(plan.price_monthly, plan.currency)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">per month</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-semibold">
                                            {formatPrice(plan.price_yearly, plan.currency)}
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            per year
                                            {getYearlyDiscount() > 0 && (
                                                <Badge className="bg-green-500/10 text-green-600">
                                                    Save {getYearlyDiscount()}%
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {plan.trial_days > 0 && (
                                        <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 p-3">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-600">
                                                {plan.trial_days} days free trial
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-6" />

                                {/* Quick Info */}
                                <div className="w-full space-y-3">
                                    <TooltipProvider>
                                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                            <Hash className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Plan ID: <strong>#{plan.id}</strong>
                                            </span>
                                        </div>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex cursor-help items-center gap-3 rounded-lg bg-muted/50 p-3">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        Created:{' '}
                                                        <strong>
                                                            {formatRelativeTime(plan.created_at)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {formatDate(plan.created_at)}
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex cursor-help items-center gap-3 rounded-lg bg-muted/50 p-3">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        Updated:{' '}
                                                        <strong>
                                                            {formatRelativeTime(plan.updated_at)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {formatDate(plan.updated_at)}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Resource Limits */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Resource Limits
                                </CardTitle>
                                <CardDescription>
                                    Usage limits included in this plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">
                                                Max Users
                                            </div>
                                            <div className="text-xl font-bold">
                                                {formatLimit(plan.max_users)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                                            <Boxes className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">
                                                Max Modules
                                            </div>
                                            <div className="text-xl font-bold">
                                                {formatLimit(plan.max_modules)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                                            <Sparkles className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">
                                                AI Requests
                                            </div>
                                            <div className="text-xl font-bold">
                                                {formatLimit(plan.max_ai_requests)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                                            <HardDrive className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">
                                                Storage
                                            </div>
                                            <div className="text-xl font-bold">
                                                {formatStorage(plan.max_storage_mb)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Features
                                </CardTitle>
                                <CardDescription>
                                    Features included in this plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {plan.features && plan.features.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {Object.entries(availableFeatures).map(([key, label]) => {
                                            const isIncluded = plan.features?.includes(key);
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                                                        isIncluded
                                                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                                            : 'opacity-50'
                                                    }`}
                                                >
                                                    {isIncluded ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                    <span
                                                        className={
                                                            isIncluded
                                                                ? 'font-medium'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <XCircle className="h-12 w-12 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            No features enabled for this plan
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Plan
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{plan.name}</span>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
