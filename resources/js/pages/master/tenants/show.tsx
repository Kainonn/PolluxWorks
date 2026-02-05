import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    Database,
    Globe,
    HardDrive,
    Key,
    MoreHorizontal,
    PauseCircle,
    Pencil,
    PlayCircle,
    Plus,
    RefreshCw,
    Server,
    Sparkles,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    max_users: number;
    max_storage_mb: number;
    max_ai_requests: number;
}

interface ActivityLog {
    id: number;
    action: string;
    description: string | null;
    user: { id: number; name: string } | null;
    created_at: string;
}

interface Domain {
    domain: string;
    type: 'subdomain' | 'custom';
    is_primary: boolean;
    status: {
        dns: 'pending' | 'active' | 'error';
        ssl: 'pending' | 'active' | 'error';
    };
}

interface ApiToken {
    id: number;
    name: string;
    abilities: string[] | null;
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

interface HealthCheck {
    app: { status: string; response_time_ms: number | null; message: string | null };
    database: { status: string; message: string | null };
    queue: { status: string; queue_depth: number | null; message: string | null };
    overall: string;
}

interface Heartbeat {
    id: number;
    app_version: string | null;
    uptime_seconds: number | null;
    queue_depth: number | null;
    active_users: number | null;
    error_rate: number | null;
    response_time_ms: number | null;
    created_at: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: 'trial' | 'active' | 'suspended' | 'overdue' | 'cancelled';
    plan_id: number;
    plan: Plan | null;
    trial_ends_at: string | null;
    next_billing_at: string | null;
    primary_domain: string | null;
    custom_domains: string[] | null;
    provisioning_status: 'pending' | 'running' | 'ready' | 'failed';
    provisioning_error: string | null;
    provisioned_at: string | null;
    last_heartbeat_at: string | null;
    app_version: string | null;
    health_data: Record<string, unknown> | null;
    seats_limit: number | null;
    storage_limit_mb: number | null;
    ai_requests_limit: number | null;
    seats_used: number;
    storage_used_mb: number;
    ai_requests_used_month: number;
    timezone: string;
    locale: string;
    region: string | null;
    industry_type: string | null;
    suspended_at: string | null;
    suspended_reason: string | null;
    created_at: string;
    updated_at: string;
    creator: { id: number; name: string } | null;
    activity_logs: ActivityLog[];
}

interface Props {
    tenant: Tenant;
    domains: Domain[];
    healthCheck: HealthCheck;
    heartbeatHistory: Heartbeat[];
    apiTokens: ApiToken[];
    baseDomain: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    suspended: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: PauseCircle },
    overdue: { label: 'Overdue', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
};

const healthStatusColor: Record<string, string> = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    unknown: 'text-gray-400',
};

export default function Show({ tenant, domains, healthCheck, heartbeatHistory, apiTokens, baseDomain }: Props) {
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [addDomainOpen, setAddDomainOpen] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tenants', href: '/tenants' },
        { title: tenant.name, href: `/tenants/${tenant.id}` },
    ];

    const StatusIcon = statusConfig[tenant.status]?.icon || AlertCircle;

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 60 * 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    const isOnline = useMemo(() => {
        if (!tenant.last_heartbeat_at || now === 0) return false;
        const lastHeartbeat = new Date(tenant.last_heartbeat_at).getTime();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        return lastHeartbeat > fiveMinutesAgo;
    }, [tenant.last_heartbeat_at, now]);

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatUptime = (seconds: number | null) => {
        if (!seconds) return '—';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const getEffectiveLimit = (tenantLimit: number | null, planLimit: number | undefined) => {
        const limit = tenantLimit ?? planLimit ?? 0;
        return limit === -1 ? '∞' : limit;
    };

    const handleSuspend = () => {
        if (!suspendReason) return;
        setIsProcessing(true);
        router.post(`/tenants/${tenant.id}/suspend`, { reason: suspendReason }, {
            onFinish: () => {
                setIsProcessing(false);
                setSuspendDialogOpen(false);
                setSuspendReason('');
            },
        });
    };

    const handleReactivate = () => {
        router.post(`/tenants/${tenant.id}/reactivate`);
    };

    const handleHealthCheck = () => {
        router.post(`/tenants/${tenant.id}/health-check`);
    };

    const handleRetryProvisioning = () => {
        router.post(`/tenants/${tenant.id}/retry-provisioning`);
    };

    const handleAddDomain = () => {
        if (!newDomain) return;
        setIsProcessing(true);
        router.post(`/tenants/${tenant.id}/domains`, { domain: newDomain }, {
            onFinish: () => {
                setIsProcessing(false);
                setAddDomainOpen(false);
                setNewDomain('');
            },
        });
    };

    const handleVerifyDns = (domain: string) => {
        router.post(`/tenants/${tenant.id}/domains/verify-dns`, { domain });
    };

    const handleRemoveDomain = (domain: string) => {
        if (confirm(`Remove domain ${domain}?`)) {
            router.delete(`/tenants/${tenant.id}/domains`, { data: { domain } });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tenant: ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tenants">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                                <Badge className={statusConfig[tenant.status].color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusConfig[tenant.status].label}
                                </Badge>
                                <div className={`flex items-center gap-1 text-sm ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    {isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                {tenant.slug}.{baseDomain}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleHealthCheck}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Health Check
                        </Button>
                        <Link href={`/tenants/${tenant.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {tenant.status === 'suspended' ? (
                                    <DropdownMenuItem onClick={handleReactivate}>
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        Reactivate
                                    </DropdownMenuItem>
                                ) : tenant.status !== 'cancelled' && (
                                    <DropdownMenuItem onClick={() => setSuspendDialogOpen(true)}>
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        Suspend
                                    </DropdownMenuItem>
                                )}
                                {tenant.provisioning_status === 'failed' && (
                                    <DropdownMenuItem onClick={handleRetryProvisioning}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Retry Provisioning
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Provisioning Error Alert */}
                {tenant.provisioning_status === 'failed' && (
                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                            <div className="flex-1">
                                <h4 className="font-medium text-red-700 dark:text-red-400">
                                    Provisioning Failed
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-500">
                                    {tenant.provisioning_error || 'Unknown error occurred'}
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleRetryProvisioning}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Suspended Alert */}
                {tenant.status === 'suspended' && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <PauseCircle className="h-8 w-8 text-yellow-500" />
                            <div className="flex-1">
                                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">
                                    Tenant Suspended
                                </h4>
                                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                    {tenant.suspended_reason || 'No reason provided'} — Suspended on{' '}
                                    {formatDate(tenant.suspended_at)}
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleReactivate}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Reactivate
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="domains">Domains</TabsTrigger>
                        <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
                        <TabsTrigger value="health">Health</TabsTrigger>
                        <TabsTrigger value="api">API Tokens</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Plan</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{tenant.plan?.name || 'N/A'}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {tenant.status === 'trial' && tenant.trial_ends_at
                                            ? `Trial ends ${formatDate(tenant.trial_ends_at)}`
                                            : 'Active subscription'}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {tenant.seats_used} / {getEffectiveLimit(tenant.seats_limit, tenant.plan?.max_users)}
                                    </div>
                                    <Progress
                                        value={tenant.seats_limit === -1 ? 0 : (tenant.seats_used / (tenant.seats_limit ?? tenant.plan?.max_users ?? 1)) * 100}
                                        className="mt-2 h-1"
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Storage</CardTitle>
                                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {tenant.storage_used_mb} MB
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        of {getEffectiveLimit(tenant.storage_limit_mb, tenant.plan?.max_storage_mb)} MB
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
                                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {tenant.ai_requests_used_month}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        of {getEffectiveLimit(tenant.ai_requests_limit, tenant.plan?.max_ai_requests)} this month
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Tenant Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tenant Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-muted-foreground">Created</Label>
                                            <p className="font-medium">{formatDate(tenant.created_at)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Created By</Label>
                                            <p className="font-medium">{tenant.creator?.name || 'System'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Timezone</Label>
                                            <p className="font-medium">{tenant.timezone}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Locale</Label>
                                            <p className="font-medium">{tenant.locale}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Region</Label>
                                            <p className="font-medium">{tenant.region || '—'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Industry</Label>
                                            <p className="font-medium capitalize">{tenant.industry_type || '—'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Health */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Health Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>Overall</span>
                                        <Badge className={healthStatusColor[healthCheck.overall]}>
                                            {healthCheck.overall}
                                        </Badge>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <Server className="h-4 w-4" />
                                                Application
                                            </span>
                                            <span className={healthStatusColor[healthCheck.app.status]}>
                                                {healthCheck.app.status}
                                                {healthCheck.app.response_time_ms && ` (${healthCheck.app.response_time_ms}ms)`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <Database className="h-4 w-4" />
                                                Database
                                            </span>
                                            <span className={healthStatusColor[healthCheck.database.status]}>
                                                {healthCheck.database.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                Queue
                                            </span>
                                            <span className={healthStatusColor[healthCheck.queue.status]}>
                                                {healthCheck.queue.status}
                                                {healthCheck.queue.queue_depth !== null && ` (${healthCheck.queue.queue_depth} jobs)`}
                                            </span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="text-sm text-muted-foreground">
                                        <p>Last heartbeat: {formatDate(tenant.last_heartbeat_at)}</p>
                                        {tenant.app_version && <p>App version: {tenant.app_version}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Domains Tab */}
                    <TabsContent value="domains" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Domains</CardTitle>
                                    <CardDescription>Manage subdomains and custom domains</CardDescription>
                                </div>
                                <Button onClick={() => setAddDomainOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Domain
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Domain</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>DNS</TableHead>
                                            <TableHead>SSL</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {domains.map((domain) => (
                                            <TableRow key={domain.domain}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        {domain.domain}
                                                        {domain.is_primary && (
                                                            <Badge variant="secondary">Primary</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">{domain.type}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={domain.status.dns === 'active' ? 'default' : 'outline'}
                                                        className={domain.status.dns === 'active' ? 'bg-green-500' : ''}
                                                    >
                                                        {domain.status.dns}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={domain.status.ssl === 'active' ? 'default' : 'outline'}
                                                        className={domain.status.ssl === 'active' ? 'bg-green-500' : ''}
                                                    >
                                                        {domain.status.ssl}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {domain.type === 'custom' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleVerifyDns(domain.domain)}
                                                            >
                                                                Verify DNS
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive"
                                                                onClick={() => handleRemoveDomain(domain.domain)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Usage Tab */}
                    <TabsContent value="usage" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Seats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {tenant.seats_used}
                                        <span className="text-lg font-normal text-muted-foreground">
                                            {' '}/ {getEffectiveLimit(tenant.seats_limit, tenant.plan?.max_users)}
                                        </span>
                                    </div>
                                    <Progress
                                        value={tenant.seats_limit === -1 ? 0 : (tenant.seats_used / (tenant.seats_limit ?? tenant.plan?.max_users ?? 1)) * 100}
                                        className="mt-4 h-2"
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <HardDrive className="h-5 w-5" />
                                        Storage
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {tenant.storage_used_mb}
                                        <span className="text-lg font-normal text-muted-foreground"> MB</span>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        of {getEffectiveLimit(tenant.storage_limit_mb, tenant.plan?.max_storage_mb)} MB limit
                                    </p>
                                    <Progress
                                        value={tenant.storage_limit_mb === -1 ? 0 : (tenant.storage_used_mb / (tenant.storage_limit_mb ?? tenant.plan?.max_storage_mb ?? 1)) * 100}
                                        className="mt-4 h-2"
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        AI Requests
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {tenant.ai_requests_used_month}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        of {getEffectiveLimit(tenant.ai_requests_limit, tenant.plan?.max_ai_requests)} this month
                                    </p>
                                    <Progress
                                        value={tenant.ai_requests_limit === -1 ? 0 : (tenant.ai_requests_used_month / (tenant.ai_requests_limit ?? tenant.plan?.max_ai_requests ?? 1)) * 100}
                                        className="mt-4 h-2"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Health Tab */}
                    <TabsContent value="health" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Heartbeat History (Last 24h)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {heartbeatHistory.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Version</TableHead>
                                                <TableHead>Uptime</TableHead>
                                                <TableHead>Queue</TableHead>
                                                <TableHead>Users</TableHead>
                                                <TableHead>Error Rate</TableHead>
                                                <TableHead>Response</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {heartbeatHistory.slice(0, 20).map((hb) => (
                                                <TableRow key={hb.id}>
                                                    <TableCell>{formatDate(hb.created_at)}</TableCell>
                                                    <TableCell>{hb.app_version || '—'}</TableCell>
                                                    <TableCell>{formatUptime(hb.uptime_seconds)}</TableCell>
                                                    <TableCell>{hb.queue_depth ?? '—'}</TableCell>
                                                    <TableCell>{hb.active_users ?? '—'}</TableCell>
                                                    <TableCell>
                                                        {hb.error_rate !== null ? `${hb.error_rate.toFixed(2)}%` : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {hb.response_time_ms ? `${hb.response_time_ms}ms` : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">
                                        No heartbeat data available
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* API Tokens Tab */}
                    <TabsContent value="api" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>API Tokens</CardTitle>
                                <CardDescription>
                                    Tokens used by the tenant application for heartbeat and sync
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Abilities</TableHead>
                                            <TableHead>Last Used</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiTokens.map((token) => (
                                            <TableRow key={token.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Key className="h-4 w-4 text-muted-foreground" />
                                                        {token.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {token.abilities?.map((a) => (
                                                        <Badge key={a} variant="secondary" className="mr-1">
                                                            {a}
                                                        </Badge>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {token.last_used_at ? formatDate(token.last_used_at) : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {token.expires_at ? formatDate(token.expires_at) : 'Never'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Regenerate
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {tenant.activity_logs.map((log) => (
                                        <div key={log.id} className="flex gap-4 border-l-2 border-muted pl-4">
                                            <div className="flex-1">
                                                <p className="font-medium capitalize">
                                                    {log.action.replace('_', ' ')}
                                                </p>
                                                {log.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {log.description}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {log.user?.name || 'System'} • {formatDate(log.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Suspend Dialog */}
                <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Suspend Tenant</DialogTitle>
                            <DialogDescription>
                                This will block all users and API access for <strong>{tenant.name}</strong>.
                                Data will be preserved and can be reactivated.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="suspend-reason">Reason for suspension</Label>
                                <Textarea
                                    id="suspend-reason"
                                    placeholder="e.g., Non-payment, Terms violation, etc."
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleSuspend}
                                disabled={!suspendReason || isProcessing}
                            >
                                {isProcessing ? 'Suspending...' : 'Suspend Tenant'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Domain Dialog */}
                <Dialog open={addDomainOpen} onOpenChange={setAddDomainOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Custom Domain</DialogTitle>
                            <DialogDescription>
                                Add a custom domain for this tenant. You'll need to configure DNS.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-domain">Domain</Label>
                                <Input
                                    id="new-domain"
                                    placeholder="app.example.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                />
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-sm">
                                <p className="font-medium">DNS Configuration Required</p>
                                <p className="mt-1 text-muted-foreground">
                                    Create a CNAME record pointing to{' '}
                                    <code className="rounded bg-background px-1">
                                        {tenant.slug}.{baseDomain}
                                    </code>
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDomainOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddDomain}
                                disabled={!newDomain || isProcessing}
                            >
                                {isProcessing ? 'Adding...' : 'Add Domain'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
