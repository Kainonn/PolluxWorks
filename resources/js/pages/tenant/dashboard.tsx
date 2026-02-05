import { Head } from '@inertiajs/react';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TenantLayout from '@/layouts/tenant-layout';

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    stats: {
        total_users: number;
        active_users: number;
        roles_count: number;
        recent_activity_count: number;
    };
    recent_activities: Array<{
        id: number;
        description: string;
        created_at: string;
        user?: {
            name: string;
        };
    }>;
    quick_stats: {
        users_this_week: number;
        logins_today: number;
    };
}

export default function TenantDashboard({ tenant, stats, recent_activities, quick_stats }: Props) {
    const statCards = [
        {
            title: 'Total Users',
            value: stats.total_users,
            icon: Users,
            description: `${stats.active_users} active`,
            color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Roles',
            value: stats.roles_count,
            icon: Activity,
            description: 'Configured roles',
            color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        },
        {
            title: 'New This Week',
            value: quick_stats.users_this_week,
            icon: TrendingUp,
            description: 'New users',
            color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        },
        {
            title: 'Logins Today',
            value: quick_stats.logins_today,
            icon: Clock,
            description: 'Active sessions',
            color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
        },
    ];

    return (
        <TenantLayout tenant={tenant} breadcrumbs={[{ title: 'Dashboard', href: '/tenant/dashboard' }]}>
            <Head title={`Dashboard - ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions in your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recent_activities.length > 0 ? (
                            <div className="space-y-4">
                                {recent_activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm">{activity.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {activity.user && <span>{activity.user.name}</span>}
                                                <span>•</span>
                                                <span>{new Date(activity.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                No recent activity
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TenantLayout>
    );
}
