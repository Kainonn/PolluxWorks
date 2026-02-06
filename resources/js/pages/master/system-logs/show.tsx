import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Bot,
    Calendar,
    CheckCircle2,
    Clock,
    Code,
    Copy,
    ExternalLink,
    FileText,
    Globe,
    Info,
    Link2,
    Server,
    Shield,
    User,
    Users,
    Webhook,
    XCircle,
    Zap,
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
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Actor {
    id: number;
    name: string;
    email: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
}

interface SystemLog {
    id: string;
    occurred_at: string;
    event_type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    status: 'success' | 'failed';
    actor_type: 'user' | 'system' | 'api' | 'webhook' | 'scheduler';
    actor_id: number | null;
    tenant_id: number | null;
    target_type: string | null;
    target_id: string | null;
    ip: string | null;
    user_agent: string | null;
    correlation_id: string | null;
    request_id: string | null;
    message: string;
    context: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    actor: Actor | null;
    tenant: Tenant | null;
}

interface Props {
    log: SystemLog;
    relatedLogs: SystemLog[];
}

// Severity configuration
const severityConfig: Record<string, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
    info: {
        label: 'Info',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        bgColor: 'bg-blue-500',
        icon: Info
    },
    warning: {
        label: 'Warning',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        bgColor: 'bg-yellow-500',
        icon: AlertTriangle
    },
    error: {
        label: 'Error',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        bgColor: 'bg-red-500',
        icon: XCircle
    },
    critical: {
        label: 'Critical',
        color: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200',
        bgColor: 'bg-red-700',
        icon: AlertCircle
    },
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    success: {
        label: 'Success',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle2
    },
    failed: {
        label: 'Failed',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle
    },
};

// Actor type configuration
const actorTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    user: { label: 'User', icon: User },
    system: { label: 'System', icon: Server },
    api: { label: 'API', icon: Zap },
    webhook: { label: 'Webhook', icon: Webhook },
    scheduler: { label: 'Scheduler', icon: Clock },
};

// Category configuration
const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    auth: { label: 'Authentication', icon: Shield, color: 'text-purple-500' },
    tenant: { label: 'Tenant', icon: Users, color: 'text-blue-500' },
    subscription: { label: 'Subscription', icon: FileText, color: 'text-green-500' },
    billing: { label: 'Billing', icon: Activity, color: 'text-yellow-500' },
    admin: { label: 'Administration', icon: Users, color: 'text-orange-500' },
    ai: { label: 'AI', icon: Bot, color: 'text-pink-500' },
    system: { label: 'System', icon: Server, color: 'text-gray-500' },
    plan: { label: 'Plan', icon: FileText, color: 'text-indigo-500' },
};

const CopyButton = ({
    text,
    field,
    copiedField,
    onCopy,
}: {
    text: string;
    field: string;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onCopy(text, field)}
                >
                    {copiedField === field ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                        <Copy className="h-3 w-3" />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {copiedField === field ? 'Copied!' : 'Copy to clipboard'}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export default function Show({ log, relatedLogs }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'System Logs', href: '/system-logs' },
        { title: log.event_type, href: `/system-logs/${log.id}` },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    };

    const formatRelativeTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return formatDate(date);
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getEventCategory = (eventType: string) => {
        return eventType.split('.')[0];
    };

    const category = getEventCategory(log.event_type);
    const catConfig = categoryConfig[category];
    const CategoryIcon = catConfig?.icon || Activity;
    const severityData = severityConfig[log.severity];
    const SeverityIcon = severityData?.icon || Info;
    const statusData = statusConfig[log.status];
    const StatusIcon = statusData?.icon || CheckCircle2;
    const actorConfig = actorTypeConfig[log.actor_type];
    const ActorIcon = actorConfig?.icon || User;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Log: ${log.event_type}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/system-logs">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <CategoryIcon className={`h-5 w-5 ${catConfig?.color || 'text-gray-500'}`} />
                                <h1 className="text-2xl font-bold">{log.message}</h1>
                            </div>
                            <p className="text-muted-foreground font-mono text-sm">{log.event_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={severityData?.color}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                            {severityData?.label || log.severity}
                        </Badge>
                        <Badge className={statusData?.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusData?.label || log.status}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Event Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Occurred At</p>
                                        <p className="text-sm">{formatDate(log.occurred_at)}</p>
                                        <p className="text-xs text-muted-foreground">{formatRelativeTime(log.occurred_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon className={`h-4 w-4 ${catConfig?.color}`} />
                                            <span className="text-sm">{catConfig?.label || category}</span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Event Type</p>
                                    <div className="flex items-center gap-2">
                                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                                            {log.event_type}
                                        </code>
                                        <CopyButton
                                            text={log.event_type}
                                            field="event_type"
                                            copiedField={copiedField}
                                            onCopy={copyToClipboard}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Message</p>
                                    <p className="text-sm">{log.message}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Context Card */}
                        {log.context && Object.keys(log.context).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        Context Data
                                    </CardTitle>
                                    <CardDescription>
                                        Detailed metadata for this event (sanitized)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm font-mono">
                                            {JSON.stringify(log.context, null, 2)}
                                        </pre>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="absolute right-2 top-2"
                                            onClick={() => copyToClipboard(JSON.stringify(log.context, null, 2), 'context')}
                                        >
                                            {copiedField === 'context' ? (
                                                <>
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-1 h-3 w-3" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Related Logs */}
                        {relatedLogs.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Link2 className="h-4 w-4" />
                                        Related Events
                                    </CardTitle>
                                    <CardDescription>
                                        Other events with the same correlation ID
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Severity</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {relatedLogs.map((relLog) => {
                                                const relSeverity = severityConfig[relLog.severity];
                                                const RelSeverityIcon = relSeverity?.icon || Info;
                                                const relStatus = statusConfig[relLog.status];
                                                const RelStatusIcon = relStatus?.icon || CheckCircle2;

                                                return (
                                                    <TableRow key={relLog.id}>
                                                        <TableCell className="font-mono text-xs">
                                                            {new Date(relLog.occurred_at).toLocaleTimeString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/system-logs/${relLog.id}`}
                                                                className="hover:text-primary hover:underline"
                                                            >
                                                                <div className="font-medium text-sm">{relLog.message}</div>
                                                                <div className="text-xs text-muted-foreground font-mono">
                                                                    {relLog.event_type}
                                                                </div>
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={relSeverity?.color} variant="secondary">
                                                                <RelSeverityIcon className="mr-1 h-3 w-3" />
                                                                {relSeverity?.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={relStatus?.color} variant="secondary">
                                                                <RelStatusIcon className="mr-1 h-3 w-3" />
                                                                {relStatus?.label}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Actor Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ActorIcon className="h-4 w-4" />
                                    Actor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                        <ActorIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        {log.actor ? (
                                            <>
                                                <p className="font-medium">{log.actor.name}</p>
                                                <p className="text-sm text-muted-foreground">{log.actor.email}</p>
                                            </>
                                        ) : (
                                            <p className="font-medium capitalize">{log.actor_type}</p>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Actor Type</p>
                                    <Badge variant="outline">{actorConfig?.label || log.actor_type}</Badge>
                                </div>
                                {log.actor_id && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Actor ID</p>
                                        <p className="font-mono text-sm">{log.actor_id}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Target Card */}
                        {(log.target_type || log.tenant) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Target
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {log.target_type && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Target Type</p>
                                            <Badge variant="outline" className="capitalize">{log.target_type}</Badge>
                                        </div>
                                    )}
                                    {log.target_id && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Target ID</p>
                                            <div className="flex items-center gap-2">
                                                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                                                    {log.target_id}
                                                </code>
                                                <CopyButton
                                                    text={log.target_id}
                                                    field="target_id"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {log.tenant && (
                                        <>
                                            <Separator />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Tenant</p>
                                                <Link
                                                    href={`/tenants/${log.tenant.id}`}
                                                    className="flex items-center gap-2 text-primary hover:underline"
                                                >
                                                    <Users className="h-4 w-4" />
                                                    {log.tenant.name}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {log.tenant.slug} • {log.tenant.status}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Request Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Request Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {log.ip && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                                                {log.ip}
                                            </code>
                                            <CopyButton
                                                text={log.ip}
                                                field="ip"
                                                copiedField={copiedField}
                                                onCopy={copyToClipboard}
                                            />
                                        </div>
                                    </div>
                                )}
                                {log.user_agent && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                                        <p className="text-xs text-muted-foreground break-all">
                                            {log.user_agent}
                                        </p>
                                    </div>
                                )}
                                {log.request_id && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Request ID</p>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-muted px-2 py-1 text-xs font-mono truncate max-w-40">
                                                {log.request_id}
                                            </code>
                                            <CopyButton
                                                text={log.request_id}
                                                field="request_id"
                                                copiedField={copiedField}
                                                onCopy={copyToClipboard}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tracing Card */}
                        {log.correlation_id && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Link2 className="h-4 w-4" />
                                        Tracing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Correlation ID</p>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-muted px-2 py-1 text-xs font-mono truncate max-w-40">
                                                {log.correlation_id}
                                            </code>
                                            <CopyButton
                                                text={log.correlation_id}
                                                field="correlation_id"
                                                copiedField={copiedField}
                                                onCopy={copyToClipboard}
                                            />
                                        </div>
                                    </div>
                                    <Link
                                        href={`/system-logs?correlation_id=${log.correlation_id}`}
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        View all related events
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timestamps Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Timestamps
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Occurred At</p>
                                    <p className="text-sm">{formatDate(log.occurred_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                                    <p className="text-sm">{formatDate(log.created_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Log ID</p>
                                    <div className="flex items-center gap-2">
                                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono truncate max-w-40">
                                            {log.id}
                                        </code>
                                        <CopyButton
                                            text={log.id}
                                            field="id"
                                            copiedField={copiedField}
                                            onCopy={copyToClipboard}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
