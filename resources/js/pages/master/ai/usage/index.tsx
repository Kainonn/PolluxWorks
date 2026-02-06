import { Head, Link, router } from '@inertiajs/react';
import {
    TrendingUp,
    Cpu,
    DollarSign,
    Zap,
    Users,
    Clock,
    AlertTriangle,
    Download,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface TenantUsage {
    tenant_id: number;
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    tenant: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

interface ModelUsage {
    ai_model_id: number;
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    model: {
        id: number;
        key: string;
        name: string;
        provider: string;
    } | null;
}

interface DailyTrend {
    date: string;
    requests: number;
    tokens: number;
    cost: number;
}

interface OverallStats {
    active_tenants: number;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    total_tokens_in: number;
    total_tokens_out: number;
    total_tokens: number;
    total_cost: number;
    total_tool_calls: number;
    total_timeouts: number;
    total_rate_limits: number;
}

interface Props {
    overallStats: OverallStats;
    usageByTenant: TenantUsage[];
    usageByModel: ModelUsage[];
    dailyTrend: DailyTrend[];
    filters: {
        from: string;
        to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Control Center', href: '/master/ai/models' },
    { title: 'Usage & Metrics', href: '/master/ai/usage' },
];

export default function Index({ overallStats, usageByTenant, usageByModel, dailyTrend, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from);
    const [toDate, setToDate] = useState(filters.to);

    const applyDateFilter = () => {
        router.get('/master/ai/usage', { from: fromDate, to: toDate }, { preserveState: true });
    };

    const formatNumber = (num: number | null | undefined) => {
        if (num == null) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    const formatCost = (cost: number | null | undefined) => {
        if (cost == null) return '$0.00';
        return `$${cost.toFixed(2)}`;
    };

    const stats = overallStats || {
        active_tenants: 0,
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        total_tokens_in: 0,
        total_tokens_out: 0,
        total_tokens: 0,
        total_cost: 0,
        total_tool_calls: 0,
        total_timeouts: 0,
        total_rate_limits: 0,
    };

    const successRate = stats.total_requests > 0
        ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(1)
        : '0';

    const errorRate = stats.total_requests > 0
        ? ((stats.failed_requests / stats.total_requests) * 100).toFixed(1)
        : '0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Usage & Metrics" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">AI Usage & Metrics</h1>
                        <p className="text-muted-foreground">
                            Monitor AI usage, costs, and performance across all tenants
                        </p>
                    </div>
                    <Link href={`/master/ai/usage/export?from=${fromDate}&to=${toDate}`}>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </Link>
                </div>

                {/* Date Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-40"
                                />
                                <span className="text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-40"
                                />
                                <Button onClick={applyDateFilter} size="sm">
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(stats.total_requests)}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge className="bg-green-500/10 text-green-600 text-xs">
                                    {successRate}% success
                                </Badge>
                                {parseFloat(errorRate) > 0 && (
                                    <Badge className="bg-red-500/10 text-red-600 text-xs">
                                        {errorRate}% errors
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(stats.total_tokens)}</div>
                            <p className="text-xs text-muted-foreground">
                                In: {formatNumber(stats.total_tokens_in)} / Out: {formatNumber(stats.total_tokens_out)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCost(stats.total_cost)}</div>
                            <p className="text-xs text-muted-foreground">
                                For selected period
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_tenants}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatNumber(stats.total_tool_calls)} tool calls
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics */}
                {(stats.total_timeouts > 0 || stats.total_rate_limits > 0) && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                <AlertTriangle className="h-5 w-5" />
                                Performance Issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-6">
                                {stats.total_timeouts > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm">
                                            <strong>{stats.total_timeouts}</strong> timeouts
                                        </span>
                                    </div>
                                )}
                                {stats.total_rate_limits > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm">
                                            <strong>{stats.total_rate_limits}</strong> rate limit hits
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top Tenants */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Top Tenants by Usage
                            </CardTitle>
                            <CardDescription>Top 10 tenants by request count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(!usageByTenant || usageByTenant.length === 0) ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No usage data for this period
                                    </p>
                                ) : (
                                    usageByTenant.map((usage, index) => (
                                        <div key={usage.tenant_id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                                    {index + 1}
                                                </Badge>
                                                <div>
                                                    <Link
                                                        href={`/master/ai/usage/tenant/${usage.tenant_id}`}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {usage.tenant?.name || `Tenant #${usage.tenant_id}`}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatNumber(usage.total_tokens)} tokens
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatNumber(usage.total_requests)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatCost(usage.total_cost)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage by Model */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                Usage by Model
                            </CardTitle>
                            <CardDescription>Breakdown by AI model</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(!usageByModel || usageByModel.length === 0) ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No usage data for this period
                                    </p>
                                ) : (
                                    usageByModel.map((usage) => (
                                        <div key={usage.ai_model_id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                    <Cpu className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/master/ai/usage/model/${usage.ai_model_id}`}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {usage.model?.name || `Model #${usage.ai_model_id}`}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {usage.model?.provider}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatNumber(usage.total_requests)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatCost(usage.total_cost)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Daily Trend
                        </CardTitle>
                        <CardDescription>Request and token usage over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(!dailyTrend || dailyTrend.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No usage data for this period
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 text-left font-medium">Date</th>
                                            <th className="py-2 text-right font-medium">Requests</th>
                                            <th className="py-2 text-right font-medium">Tokens</th>
                                            <th className="py-2 text-right font-medium">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyTrend.map((day) => (
                                            <tr key={day.date} className="border-b">
                                                <td className="py-2">{day.date}</td>
                                                <td className="py-2 text-right">{formatNumber(day.requests)}</td>
                                                <td className="py-2 text-right">{formatNumber(day.tokens)}</td>
                                                <td className="py-2 text-right">{formatCost(day.cost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
