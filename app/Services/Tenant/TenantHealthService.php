<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\TenantHeartbeat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TenantHealthService
{
    public function __construct(
        protected TenantDomainService $domainService
    ) {}

    /**
     * Record heartbeat from tenant.
     */
    public function recordHeartbeat(Tenant $tenant, array $data): TenantHeartbeat
    {
        // Create heartbeat record
        $heartbeat = $tenant->heartbeats()->create([
            'app_version' => $data['app_version'] ?? null,
            'uptime_seconds' => $data['uptime_seconds'] ?? null,
            'queue_depth' => $data['queue_depth'] ?? null,
            'active_users' => $data['active_users'] ?? null,
            'error_rate' => $data['error_rate'] ?? null,
            'response_time_ms' => $data['response_time_ms'] ?? null,
            'extra_data' => $data['extra_data'] ?? null,
        ]);

        // Update tenant's last heartbeat
        $tenant->update([
            'last_heartbeat_at' => now(),
            'app_version' => $data['app_version'] ?? $tenant->app_version,
            'health_data' => [
                'uptime_seconds' => $data['uptime_seconds'] ?? null,
                'queue_depth' => $data['queue_depth'] ?? null,
                'active_users' => $data['active_users'] ?? null,
                'error_rate' => $data['error_rate'] ?? null,
                'response_time_ms' => $data['response_time_ms'] ?? null,
                'last_check' => now()->toISOString(),
            ],
        ]);

        // Update usage metrics if provided
        if (isset($data['seats_used'])) {
            $tenant->update(['seats_used' => $data['seats_used']]);
        }
        if (isset($data['storage_used_mb'])) {
            $tenant->update(['storage_used_mb' => $data['storage_used_mb']]);
        }
        if (isset($data['ai_requests_used'])) {
            $tenant->update(['ai_requests_used_month' => $data['ai_requests_used']]);
        }

        return $heartbeat;
    }

    /**
     * Perform health check on a tenant.
     */
    public function performHealthCheck(Tenant $tenant): array
    {
        $results = [
            'app' => $this->checkAppHealth($tenant),
            'database' => $this->checkDatabaseHealth($tenant),
            'queue' => $this->checkQueueHealth($tenant),
            'overall' => 'unknown',
        ];

        // Determine overall status
        $statuses = array_column($results, 'status');
        if (in_array('error', $statuses)) {
            $results['overall'] = 'error';
        } elseif (in_array('warning', $statuses)) {
            $results['overall'] = 'warning';
        } elseif (count(array_filter($statuses, fn($s) => $s === 'healthy')) === count($statuses) - 1) {
            $results['overall'] = 'healthy';
        }

        return $results;
    }

    /**
     * Check app health via HTTP ping.
     */
    protected function checkAppHealth(Tenant $tenant): array
    {
        $result = [
            'status' => 'unknown',
            'response_time_ms' => null,
            'message' => null,
        ];

        try {
            $url = $this->domainService->getSubdomainUrl($tenant) . '/api/health';
            $startTime = microtime(true);

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout(10)->get($url);

            $result['response_time_ms'] = round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $result['status'] = 'healthy';
                $result['message'] = 'Application responding normally';
            } else {
                $result['status'] = 'error';
                $result['message'] = 'HTTP response error';
            }
        } catch (\Exception $e) {
            $result['status'] = 'error';
            $result['message'] = $e->getMessage();
        }

        return $result;
    }

    /**
     * Check database health for tenant.
     */
    protected function checkDatabaseHealth(Tenant $tenant): array
    {
        $result = [
            'status' => 'unknown',
            'message' => null,
        ];

        if ($tenant->provisioning_status !== Tenant::PROVISIONING_READY) {
            $result['status'] = 'warning';
            $result['message'] = 'Not provisioned';
            return $result;
        }

        try {
            // Configure tenant connection
            app(TenantProvisioningService::class)->configureTenantConnection($tenant);

            // Try simple query
            DB::connection('tenant')->select('SELECT 1');

            $result['status'] = 'healthy';
            $result['message'] = 'Database connection OK';
        } catch (\Exception $e) {
            $result['status'] = 'error';
            $result['message'] = 'Database connection failed: ' . $e->getMessage();
        }

        return $result;
    }

    /**
     * Check queue health (based on last heartbeat data).
     */
    protected function checkQueueHealth(Tenant $tenant): array
    {
        $result = [
            'status' => 'unknown',
            'queue_depth' => null,
            'message' => null,
        ];

        $healthData = $tenant->health_data ?? [];

        if (!isset($healthData['queue_depth'])) {
            $result['message'] = 'No queue data available';
            return $result;
        }

        $result['queue_depth'] = $healthData['queue_depth'];

        if ($healthData['queue_depth'] > 1000) {
            $result['status'] = 'error';
            $result['message'] = 'Queue backlog is critical';
        } elseif ($healthData['queue_depth'] > 100) {
            $result['status'] = 'warning';
            $result['message'] = 'Queue backlog is building up';
        } else {
            $result['status'] = 'healthy';
            $result['message'] = 'Queue is healthy';
        }

        return $result;
    }

    /**
     * Get health statistics for all tenants.
     */
    public function getOverallHealth(): array
    {
        $stats = [
            'total' => Tenant::count(),
            'online' => Tenant::online()->count(),
            'offline' => Tenant::offline()->count(),
            'by_status' => [],
            'by_provisioning' => [],
            'issues' => [],
        ];

        // Count by status
        $stats['by_status'] = Tenant::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Count by provisioning status
        $stats['by_provisioning'] = Tenant::query()
            ->selectRaw('provisioning_status, COUNT(*) as count')
            ->groupBy('provisioning_status')
            ->pluck('count', 'provisioning_status')
            ->toArray();

        // Find issues
        $failedProvisioning = Tenant::where('provisioning_status', Tenant::PROVISIONING_FAILED)->get();
        foreach ($failedProvisioning as $tenant) {
            $stats['issues'][] = [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'type' => 'provisioning_failed',
                'message' => $tenant->provisioning_error,
            ];
        }

        // Find tenants that have been offline for too long
        $offlineTooLong = Tenant::where('provisioning_status', Tenant::PROVISIONING_READY)
            ->where('status', '!=', Tenant::STATUS_SUSPENDED)
            ->where('status', '!=', Tenant::STATUS_CANCELLED)
            ->where(function ($q) {
                $q->whereNull('last_heartbeat_at')
                  ->orWhere('last_heartbeat_at', '<', now()->subHours(1));
            })
            ->get();

        foreach ($offlineTooLong as $tenant) {
            $stats['issues'][] = [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'type' => 'offline_too_long',
                'message' => $tenant->last_heartbeat_at
                    ? "Last seen {$tenant->last_heartbeat_at->diffForHumans()}"
                    : 'Never received heartbeat',
            ];
        }

        return $stats;
    }

    /**
     * Get heartbeat history for a tenant.
     */
    public function getHeartbeatHistory(Tenant $tenant, int $hours = 24): array
    {
        return $tenant->heartbeats()
            ->where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Cleanup old heartbeat records.
     */
    public function cleanupOldHeartbeats(int $daysToKeep = 7): int
    {
        return TenantHeartbeat::where('created_at', '<', now()->subDays($daysToKeep))->delete();
    }
}
