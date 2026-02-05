<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantApiToken;
use App\Services\Tenant\TenantHealthService;
use Illuminate\Http\Request;

class HeartbeatController extends Controller
{
    public function __construct(
        protected TenantHealthService $healthService,
    ) {}

    /**
     * Receive heartbeat from tenant.
     */
    public function store(Request $request)
    {
        // Authenticate via API token
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $apiToken = TenantApiToken::where('token', $token)->first();

        if (!$apiToken || $apiToken->isExpired() || !$apiToken->can('heartbeat')) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $tenant = $apiToken->tenant;

        if (!$tenant || $tenant->status === Tenant::STATUS_CANCELLED) {
            return response()->json(['error' => 'Tenant not found or cancelled'], 404);
        }

        // Mark token as used
        $apiToken->markAsUsed();

        // Validate heartbeat data
        $validated = $request->validate([
            'app_version' => ['nullable', 'string', 'max:50'],
            'uptime_seconds' => ['nullable', 'integer', 'min:0'],
            'queue_depth' => ['nullable', 'integer', 'min:0'],
            'active_users' => ['nullable', 'integer', 'min:0'],
            'error_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'response_time_ms' => ['nullable', 'numeric', 'min:0'],
            'seats_used' => ['nullable', 'integer', 'min:0'],
            'storage_used_mb' => ['nullable', 'integer', 'min:0'],
            'ai_requests_used' => ['nullable', 'integer', 'min:0'],
            'extra_data' => ['nullable', 'array'],
        ]);

        // Record heartbeat
        $heartbeat = $this->healthService->recordHeartbeat($tenant, $validated);

        return response()->json([
            'success' => true,
            'heartbeat_id' => $heartbeat->id,
            'received_at' => now()->toISOString(),
            'tenant_status' => $tenant->status,
        ]);
    }

    /**
     * Get tenant status (for tenant app to check if it should continue operating).
     */
    public function status(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $apiToken = TenantApiToken::where('token', $token)->first();

        if (!$apiToken || $apiToken->isExpired()) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $tenant = $apiToken->tenant;

        return response()->json([
            'status' => $tenant->status,
            'is_suspended' => $tenant->status === Tenant::STATUS_SUSPENDED,
            'suspended_reason' => $tenant->suspended_reason,
            'is_trial' => $tenant->status === Tenant::STATUS_TRIAL,
            'trial_ends_at' => $tenant->trial_ends_at?->toISOString(),
            'trial_days_remaining' => $tenant->trial_days_remaining,
        ]);
    }
}
