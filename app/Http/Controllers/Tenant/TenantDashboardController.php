<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantUser;
use App\Models\Tenant\TenantSetting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TenantDashboardController extends Controller
{
    /**
     * Show tenant dashboard.
     */
    public function index()
    {
        $tenant = app('tenant');
        $user = Auth::guard('tenant')->user();

        // Get roles count safely
        $rolesCount = 0;
        try {
            $rolesCount = DB::connection('tenant')->table('roles')->count();
        } catch (\Exception $e) {
            // Table might not exist
        }

        // Get activity count safely
        $recentActivityCount = 0;
        $recentActivities = collect();
        try {
            $recentActivityCount = DB::connection('tenant')
                ->table('activity_logs')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            $recentActivities = DB::connection('tenant')
                ->table('activity_logs')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'description' => $activity->description ?? $activity->action ?? 'Activity',
                        'created_at' => $activity->created_at,
                        'user' => null,
                    ];
                });
        } catch (\Exception $e) {
            // Table might not exist
        }

        // Get stats
        $stats = [
            'total_users' => TenantUser::count(),
            'active_users' => TenantUser::where('is_active', true)->count(),
            'roles_count' => $rolesCount,
            'recent_activity_count' => $recentActivityCount,
        ];

        // Quick stats
        $quickStats = [
            'users_this_week' => TenantUser::where('created_at', '>=', now()->subDays(7))->count(),
            'logins_today' => TenantUser::whereDate('last_login_at', today())->count(),
        ];

        return Inertia::render('tenant/dashboard', [
            'stats' => $stats,
            'quick_stats' => $quickStats,
            'recent_activities' => $recentActivities,
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
        ]);
    }
}
