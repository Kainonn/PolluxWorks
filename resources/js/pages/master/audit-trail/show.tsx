import { Head, Link, router } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowLeftRight,
    Ban,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FileText,
    Globe,
    Hash,
    Key,
    Lock,
    Monitor,
    Pencil,
    Plus,
    Shield,
    Trash2,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    id: string;
    name: string;
    email: string;
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: string;
}

interface Change {
    field: string;
    old: unknown;
    new: unknown;
}

interface AuditEntry {
    id: string;
    occurred_at: string;
    actor_type: string;
    actor_id: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_label: string | null;
    tenant_id: string | null;
    ip: string | null;
    user_agent: string | null;
    reason: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    changes: Change[] | null;
    changes_count: number;
    checksum: string;
    correlation_id: string | null;
    created_at: string;
    actor?: Actor | null;
    tenant?: Tenant | null;
}

interface HistoryEntry {
    id: string;
    occurred_at: string;
    action: string;
    changes_count: number;
    actor?: Actor | null;
}

interface Props {
    entry: AuditEntry;
    entityHistory: HistoryEntry[];
    integrityValid: boolean;
}

const breadcrumbs = (entry: AuditEntry): BreadcrumbItem[] => [
    { title: 'Master', href: '/master' },
    { title: 'Audit Trail', href: '/master/audit-trail' },
    { title: `#${entry.id.substring(0, 8)}`, href: '#' },
];

interface ActionConfig {
    label: string;
    color: string;
    icon: LucideIcon;
}

const actionConfig: Record<string, ActionConfig> = {
    created: { label: 'Creado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Plus },
    updated: { label: 'Actualizado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Pencil },
    deleted: { label: 'Eliminado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Trash2 },
    suspended: { label: 'Suspendido', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Ban },
    reactivated: { label: 'Reactivado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Check },
    plan_changed: { label: 'Plan Cambiado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: CreditCard },
    role_assigned: { label: 'Rol Asignado', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Shield },
    role_removed: { label: 'Rol Removido', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400', icon: Key },
    mfa_enabled: { label: 'MFA Activado', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: Lock },
    mfa_disabled: { label: 'MFA Desactivado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Lock },
    trial_extended: { label: 'Trial Extendido', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Clock },
    cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: X },
    key_rotated: { label: 'Clave Rotada', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: Key },
};

const entityTypeLabels: Record<string, string> = {
    Tenant: 'Tenant',
    User: 'Usuario',
    Subscription: 'Suscripción',
    Plan: 'Plan',
    Role: 'Rol',
    ApiToken: 'API Token',
    WebhookEndpoint: 'Webhook',
    TenantSetting: 'Configuración',
    Invoice: 'Factura',
    Payment: 'Pago',
};

const actorTypeLabels: Record<string, string> = {
    user: 'Usuario',
    system: 'Sistema',
    api: 'API',
    scheduler: 'Scheduler',
    webhook: 'Webhook',
};

export default function AuditTrailShow({ entry, entityHistory, integrityValid }: Props) {
    const getActionConfig = (action: string): ActionConfig => {
        return actionConfig[action] || {
            label: action,
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
            icon: FileText,
        };
    };

    const renderActionBadge = (action: string, size: 'sm' | 'lg' = 'sm') => {
        const config = getActionConfig(action);
        const Icon = config.icon;
        return (
            <Badge
                className={`${config.color} gap-1 ${size === 'lg' ? 'text-base px-3 py-1' : ''}`}
                variant="outline"
            >
                <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />
                {config.label}
            </Badge>
        );
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            try {
                return format(new Date(value), 'dd MMM yyyy HH:mm', { locale: es });
            } catch {
                return value;
            }
        }
        return String(value);
    };

    const renderDiffValue = (value: unknown, type: 'old' | 'new') => {
        const formatted = formatValue(value);
        const isNull = value === null || value === undefined;

        return (
            <div
                className={`p-2 rounded font-mono text-sm ${
                    type === 'old'
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                } ${isNull ? 'italic opacity-60' : ''}`}
            >
                {formatted}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(entry)}>
            <Head title={`Audit: ${entry.entity_label || entry.entity_id.substring(0, 8)}`} />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/master/audit-trail">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Detalle de Auditoría
                                </h1>
                                {renderActionBadge(entry.action, 'lg')}
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {entry.entity_label || entry.entity_id} • {entityTypeLabels[entry.entity_type] || entry.entity_type}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {integrityValid ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Integridad verificada
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>El checksum del registro coincide</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Integridad fallida
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>El registro puede haber sido alterado</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Changes Card */}
                        {entry.changes && entry.changes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowLeftRight className="h-5 w-5" />
                                        Cambios Detectados
                                    </CardTitle>
                                    <CardDescription>
                                        {entry.changes.length} campo{entry.changes.length !== 1 ? 's' : ''} modificado{entry.changes.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {entry.changes.map((change, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant="secondary" className="font-mono">
                                                        {change.field}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                                            Valor anterior
                                                        </p>
                                                        {renderDiffValue(change.old, 'old')}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                                            Valor nuevo
                                                        </p>
                                                        {renderDiffValue(change.new, 'new')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Before/After Snapshots */}
                        {(entry.before || entry.after) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Snapshots de Datos</CardTitle>
                                    <CardDescription>
                                        Estado completo de la entidad antes y después del cambio
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {entry.before && (
                                            <div>
                                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                                    Estado Anterior
                                                </h4>
                                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                                                    {JSON.stringify(entry.before, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {entry.after && (
                                            <div>
                                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                                    Estado Posterior
                                                </h4>
                                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                                                    {JSON.stringify(entry.after, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reason Card */}
                        {entry.reason && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Justificación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{entry.reason}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Entity History */}
                        {entityHistory.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Historial de la Entidad
                                    </CardTitle>
                                    <CardDescription>
                                        Otros cambios registrados para {entry.entity_label || entry.entity_id.substring(0, 8)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Acción</TableHead>
                                                    <TableHead>Actor</TableHead>
                                                    <TableHead className="text-center">Cambios</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {entityHistory.map((historyEntry) => (
                                                    <TableRow key={historyEntry.id}>
                                                        <TableCell className="text-sm">
                                                            {format(new Date(historyEntry.occurred_at), 'dd MMM yyyy HH:mm', { locale: es })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {renderActionBadge(historyEntry.action)}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {historyEntry.actor?.name || 'Sistema'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline">
                                                                {historyEntry.changes_count}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/master/audit-trail/${historyEntry.id}`}>
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Entry Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles del Registro</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Fecha y Hora</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(entry.occurred_at), 'dd MMMM yyyy, HH:mm:ss', { locale: es })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(entry.occurred_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-start gap-3">
                                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Actor</p>
                                        <Badge variant="secondary" className="mb-1">
                                            {actorTypeLabels[entry.actor_type] || entry.actor_type}
                                        </Badge>
                                        {entry.actor ? (
                                            <>
                                                <p className="text-sm">{entry.actor.name}</p>
                                                <p className="text-xs text-muted-foreground">{entry.actor.email}</p>
                                            </>
                                        ) : entry.actor_email ? (
                                            <p className="text-sm">{entry.actor_email}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {entry.actor_type === 'system' ? 'Proceso automático' : '—'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {entry.tenant && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Tenant</p>
                                                <p className="text-sm">{entry.tenant.name}</p>
                                                <p className="text-xs text-muted-foreground">{entry.tenant.slug}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {entry.ip && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">IP</p>
                                                <p className="text-sm font-mono">{entry.ip}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {entry.user_agent && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">User Agent</p>
                                                <p className="text-xs text-muted-foreground break-all">
                                                    {entry.user_agent}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Technical Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Técnica</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                        ID del Registro
                                    </p>
                                    <p className="text-sm font-mono break-all">{entry.id}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                        Entity ID
                                    </p>
                                    <p className="text-sm font-mono break-all">{entry.entity_id}</p>
                                </div>

                                {entry.correlation_id && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                            Correlation ID
                                        </p>
                                        <p className="text-sm font-mono break-all">{entry.correlation_id}</p>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 mt-1"
                                            onClick={() =>
                                                router.get('/master/audit-trail', {
                                                    search: entry.correlation_id,
                                                })
                                            }
                                        >
                                            <Hash className="h-3 w-3 mr-1" />
                                            Ver correlaciones
                                        </Button>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                        Checksum
                                    </p>
                                    <p className="text-xs font-mono break-all text-muted-foreground">
                                        {entry.checksum}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
