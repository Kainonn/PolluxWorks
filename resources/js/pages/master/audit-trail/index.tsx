import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowLeftRight,
    Ban,
    Building2,
    Calendar,
    Check,
    Clock,
    CreditCard,
    Download,
    Eye,
    FileText,
    Filter,
    Hash,
    Key,
    Lock,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

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
    DialogTrigger,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    changes: Array<{ field: string; old: unknown; new: unknown }> | null;
    changes_count: number;
    checksum: string;
    correlation_id: string | null;
    actor?: Actor | null;
    tenant?: Tenant | null;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Stats {
    total: number;
    today: number;
    last_30_days: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
    by_actor_type: Record<string, number>;
    with_reason: number;
}

interface Filters {
    search?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    actor_type?: string;
    actor_id?: string;
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
    has_reason?: string;
    per_page?: string;
}

interface Props {
    entries: Pagination<AuditEntry>;
    stats: Stats;
    filters: Filters;
    actions: string[];
    entityTypes: string[];
    actorTypes: string[];
    tenants: Tenant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master', href: '/master' },
    { title: 'Audit Trail', href: '/master/audit-trail' },
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

export default function AuditTrailIndex({
    entries,
    stats,
    filters,
    actions,
    entityTypes,
    actorTypes,
    tenants,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isExportOpen, setIsExportOpen] = useState(false);
    const defaultExportDates = useMemo(() => {
        const now = new Date();
        const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return {
            from: dateFrom.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0],
        };
    }, []);
    const [exportDateFrom, setExportDateFrom] = useState(defaultExportDates.from);
    const [exportDateTo, setExportDateTo] = useState(defaultExportDates.to);
    const [exportFormat, setExportFormat] = useState('csv');

    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            router.get(
                '/master/audit-trail',
                { ...filters, search: value || undefined, page: 1 },
                { preserveState: true, preserveScroll: true }
            );
        }, 300);
    };

    const handleFilterChange = (key: string, value: string | undefined) => {
        router.get(
            '/master/audit-trail',
            { ...filters, [key]: value || undefined, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/master/audit-trail', {}, { preserveState: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            format: exportFormat,
            date_from: exportDateFrom,
            date_to: exportDateTo,
            ...(filters.entity_type && { entity_type: filters.entity_type }),
            ...(filters.action && { action: filters.action }),
        });

        window.location.href = '/master/audit-trail/export?' + params.toString();
        setIsExportOpen(false);
    };

    const hasActiveFilters = useMemo(() => Object.values(filters).some(v => v), [filters]);

    const getActionConfig = (action: string): ActionConfig => {
        return actionConfig[action] || {
            label: action,
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
            icon: FileText,
        };
    };

    const renderActionBadge = (action: string) => {
        const config = getActionConfig(action);
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} gap-1`} variant="outline">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const renderEntityType = (type: string) => {
        return entityTypeLabels[type] || type;
    };

    const renderActorType = (type: string) => {
        return actorTypeLabels[type] || type;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Trail" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Audit Trail
                        </h1>
                        <p className="text-muted-foreground">
                            Registro inmutable de cambios para compliance y auditoría empresarial
                        </p>
                    </div>
                    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Exportar Audit Trail</DialogTitle>
                                <DialogDescription>
                                    Exporta registros de auditoría para compliance o análisis
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Desde</Label>
                                        <Input
                                            type="date"
                                            value={exportDateFrom}
                                            onChange={(e) => setExportDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hasta</Label>
                                        <Input
                                            type="date"
                                            value={exportDateTo}
                                            onChange={(e) => setExportDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Formato</Label>
                                    <Select value={exportFormat} onValueChange={setExportFormat}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="csv">CSV</SelectItem>
                                            <SelectItem value="json">JSON</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Registros
                            </CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Registros inmutables
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today}</div>
                            <p className="text-xs text-muted-foreground">
                                Cambios registrados hoy
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Últimos 30 días
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.last_30_days.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Actividad del mes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Con Justificación
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.with_reason}</div>
                            <p className="text-xs text-muted-foreground">
                                Incluyen razón documentada
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filtros
                                </CardTitle>
                                <CardDescription>
                                    Filtra registros de auditoría por acción, entidad, actor o fecha
                                </CardDescription>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={filters.action || 'all'}
                                onValueChange={(v) => handleFilterChange('action', v === 'all' ? undefined : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Acción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las acciones</SelectItem>
                                    {actions.map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {getActionConfig(action).label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.entity_type || 'all'}
                                onValueChange={(v) => handleFilterChange('entity_type', v === 'all' ? undefined : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Entidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las entidades</SelectItem>
                                    {entityTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {renderEntityType(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.actor_type || 'all'}
                                onValueChange={(v) => handleFilterChange('actor_type', v === 'all' ? undefined : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de actor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los actores</SelectItem>
                                    {actorTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {renderActorType(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.tenant_id || 'all'}
                                onValueChange={(v) => handleFilterChange('tenant_id', v === 'all' ? undefined : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tenants</SelectItem>
                                    {tenants.map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Desde</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Hasta</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Por página</Label>
                                <Select
                                    value={filters.per_page || '25'}
                                    onValueChange={(v) => handleFilterChange('per_page', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registros de Auditoría</CardTitle>
                        <CardDescription>
                            Mostrando {entries.from || 0}-{entries.to || 0} de {entries.total} registros
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-45">Fecha</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Entidad</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead className="text-center">Cambios</TableHead>
                                        <TableHead className="w-17.5"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Shield className="h-8 w-8 text-muted-foreground/50" />
                                                    <span className="text-muted-foreground">
                                                        No se encontraron registros de auditoría
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        entries.data.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {format(new Date(entry.occurred_at), 'dd MMM yyyy', { locale: es })}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(entry.occurred_at), 'HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {renderActionBadge(entry.action)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-normal">
                                                                {renderEntityType(entry.entity_type)}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-sm font-medium mt-1">
                                                            {entry.entity_label || entry.entity_id.substring(0, 8)}
                                                        </span>
                                                        {entry.tenant && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Building2 className="h-3 w-3" />
                                                                {entry.tenant.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="font-normal text-xs">
                                                                {renderActorType(entry.actor_type)}
                                                            </Badge>
                                                        </div>
                                                        {entry.actor ? (
                                                            <span className="text-sm mt-1">
                                                                {entry.actor.name}
                                                            </span>
                                                        ) : entry.actor_email ? (
                                                            <span className="text-sm mt-1">
                                                                {entry.actor_email}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground mt-1">
                                                                {entry.actor_type === 'system' ? 'Automático' : '—'}
                                                            </span>
                                                        )}
                                                        {entry.ip && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {entry.ip}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {entry.changes_count > 0 ? (
                                                        <Badge variant="outline">
                                                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                                                            {entry.changes_count}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Acciones</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/master/audit-trail/${entry.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver detalle
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {entry.correlation_id && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleFilterChange('search', entry.correlation_id!)}
                                                                >
                                                                    <Hash className="mr-2 h-4 w-4" />
                                                                    Buscar correlación
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    handleFilterChange('entity_type', entry.entity_type);
                                                                    setTimeout(() => {
                                                                        handleFilterChange('entity_id', entry.entity_id);
                                                                    }, 100);
                                                                }}
                                                            >
                                                                <Clock className="mr-2 h-4 w-4" />
                                                                Ver historial entidad
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {entries.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Página {entries.current_page} de {entries.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {entries.links.map((link, index) => {
                                        if (link.label.includes('Previous')) {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() =>
                                                        link.url && router.get(link.url, {}, { preserveState: true })
                                                    }
                                                >
                                                    Anterior
                                                </Button>
                                            );
                                        }
                                        if (link.label.includes('Next')) {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() =>
                                                        link.url && router.get(link.url, {}, { preserveState: true })
                                                    }
                                                >
                                                    Siguiente
                                                </Button>
                                            );
                                        }
                                        return (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() =>
                                                    link.url && router.get(link.url, {}, { preserveState: true })
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
