import { Head } from '@inertiajs/react';
import { Activity, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down';
    trendValue?: string;
}

function StatCard({ title, value, description, icon, trend, trendValue }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:shadow-indigo-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500/20 to-purple-500/20 p-2 text-indigo-600 dark:text-indigo-400">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trend && (
                        <span className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {trendValue}
                        </span>
                    )}
                    <CardDescription className="text-xs">{description}</CardDescription>
                </div>
            </CardContent>
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        </Card>
    );
}

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Welcome Section */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome to <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PolluxWorks</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Here's what's happening with your platform today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value="2,847"
                        description="from last month"
                        icon={<Users className="h-4 w-4" />}
                        trend="up"
                        trendValue="+12.5%"
                    />
                    <StatCard
                        title="Active Sessions"
                        value="423"
                        description="currently online"
                        icon={<Activity className="h-4 w-4" />}
                        trend="up"
                        trendValue="+8.2%"
                    />
                    <StatCard
                        title="Growth Rate"
                        value="24.5%"
                        description="vs previous period"
                        icon={<TrendingUp className="h-4 w-4" />}
                        trend="up"
                        trendValue="+4.1%"
                    />
                    <StatCard
                        title="Avg. Session"
                        value="12m 34s"
                        description="engagement time"
                        icon={<Clock className="h-4 w-4" />}
                        trend="down"
                        trendValue="-2.3%"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid gap-4 md:grid-cols-7">
                    {/* Activity Chart Placeholder */}
                    <Card className="md:col-span-4">
                        <CardHeader>
                            <CardTitle>Activity Overview</CardTitle>
                            <CardDescription>
                                User activity for the last 30 days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-75 flex items-center justify-center rounded-lg bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                                <div className="text-center">
                                    <Activity className="h-12 w-12 mx-auto text-indigo-500/50 mb-2" />
                                    <p className="text-sm text-muted-foreground">Activity chart will appear here</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Latest platform updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { action: 'New user registered', time: '2 minutes ago', color: 'bg-emerald-500' },
                                    { action: 'System update completed', time: '1 hour ago', color: 'bg-blue-500' },
                                    { action: 'Report generated', time: '3 hours ago', color: 'bg-purple-500' },
                                    { action: 'Settings updated', time: '5 hours ago', color: 'bg-amber-500' },
                                    { action: 'Backup completed', time: '1 day ago', color: 'bg-indigo-500' },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${item.color}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.action}</p>
                                            <p className="text-xs text-muted-foreground">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Info */}
                <div className="mt-auto pt-4 border-t text-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} PolluxWorks. Built with ❤️ using Laravel & React.</p>
                </div>
            </div>
        </AppLayout>
    );
}
