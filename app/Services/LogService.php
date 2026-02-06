<?php

namespace App\Services;

use App\Models\SystemLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

class LogService
{
    /**
     * Current correlation ID for tracking related events.
     */
    protected static ?string $correlationId = null;

    /**
     * Create a new system log entry.
     */
    public static function record(
        string $eventType,
        string $message,
        string $severity = SystemLog::SEVERITY_INFO,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        ?int $tenantId = null,
        ?string $targetType = null,
        ?string $targetId = null,
        ?string $actorType = null,
        ?int $actorId = null,
    ): SystemLog {
        // Auto-detect actor if not provided
        if ($actorType === null) {
            $actorType = self::detectActorType();
        }
        if ($actorId === null && $actorType === SystemLog::ACTOR_USER) {
            $actorId = Auth::id();
        }

        // Sanitize context (remove sensitive data)
        $context = self::sanitizeContext($context);

        return SystemLog::create([
            'id' => Str::uuid()->toString(),
            'occurred_at' => now(),
            'event_type' => $eventType,
            'severity' => $severity,
            'status' => $status,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'tenant_id' => $tenantId,
            'target_type' => $targetType,
            'target_id' => $targetId ? (string) $targetId : null,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'correlation_id' => self::$correlationId,
            'request_id' => Request::header('X-Request-ID'),
            'message' => Str::limit($message, 497),
            'context' => $context ?: null,
        ]);
    }

    /**
     * Start a new correlation context.
     */
    public static function startCorrelation(): string
    {
        self::$correlationId = Str::uuid()->toString();
        return self::$correlationId;
    }

    /**
     * End the current correlation context.
     */
    public static function endCorrelation(): void
    {
        self::$correlationId = null;
    }

    /**
     * Set a specific correlation ID.
     */
    public static function setCorrelation(string $correlationId): void
    {
        self::$correlationId = $correlationId;
    }

    /**
     * Get the current correlation ID.
     */
    public static function getCorrelation(): ?string
    {
        return self::$correlationId;
    }

    /**
     * Detect the actor type based on the current context.
     */
    protected static function detectActorType(): string
    {
        if (app()->runningInConsole()) {
            return SystemLog::ACTOR_SCHEDULER;
        }

        if (Auth::check()) {
            return SystemLog::ACTOR_USER;
        }

        if (Request::is('api/*')) {
            return SystemLog::ACTOR_API;
        }

        if (Request::is('webhooks/*') || Request::is('*/webhooks/*')) {
            return SystemLog::ACTOR_WEBHOOK;
        }

        return SystemLog::ACTOR_SYSTEM;
    }

    /**
     * Remove sensitive data from context.
     */
    protected static function sanitizeContext(array $context): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'secret',
            'token',
            'api_key',
            'apikey',
            'api_secret',
            'access_token',
            'refresh_token',
            'card_number',
            'cvv',
            'cvc',
            'ssn',
            'social_security',
            'credit_card',
            'cc_number',
        ];

        $sanitized = [];

        foreach ($context as $key => $value) {
            $lowerKey = strtolower($key);

            // Check if key is sensitive
            foreach ($sensitiveKeys as $sensitiveKey) {
                if (str_contains($lowerKey, $sensitiveKey)) {
                    $sanitized[$key] = '[REDACTED]';
                    continue 2;
                }
            }

            // Recursively sanitize arrays
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeContext($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    // ==========================================
    // HELPER METHODS BY CATEGORY
    // ==========================================

    /**
     * Log an authentication event.
     */
    public static function logAuthEvent(
        string $action,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        ?int $userId = null,
    ): SystemLog {
        return self::record(
            eventType: "auth.{$action}",
            message: $message,
            severity: $status === SystemLog::STATUS_FAILED ? SystemLog::SEVERITY_WARNING : SystemLog::SEVERITY_INFO,
            status: $status,
            context: $context,
            targetType: SystemLog::TARGET_USER,
            targetId: $userId ?? Auth::id(),
            actorType: SystemLog::ACTOR_USER,
            actorId: $userId ?? Auth::id(),
        );
    }

    /**
     * Log a tenant-related event.
     */
    public static function logTenantEvent(
        string $action,
        Tenant $tenant,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        string $severity = SystemLog::SEVERITY_INFO,
    ): SystemLog {
        return self::record(
            eventType: "tenant.{$action}",
            message: $message,
            severity: $severity,
            status: $status,
            context: array_merge(['tenant_name' => $tenant->name, 'tenant_slug' => $tenant->slug], $context),
            tenantId: $tenant->id,
            targetType: SystemLog::TARGET_TENANT,
            targetId: $tenant->id,
        );
    }

    /**
     * Log a subscription event.
     */
    public static function logSubscriptionEvent(
        string $action,
        $subscription,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
    ): SystemLog {
        return self::record(
            eventType: "subscription.{$action}",
            message: $message,
            severity: SystemLog::SEVERITY_INFO,
            status: $status,
            context: $context,
            tenantId: $subscription->tenant_id ?? null,
            targetType: SystemLog::TARGET_SUBSCRIPTION,
            targetId: $subscription->id,
        );
    }

    /**
     * Log a billing event.
     */
    public static function logBillingEvent(
        string $action,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        ?int $tenantId = null,
        ?string $targetType = null,
        ?string $targetId = null,
    ): SystemLog {
        $severity = match($action) {
            'payment.failed' => SystemLog::SEVERITY_ERROR,
            'webhook.failed' => SystemLog::SEVERITY_WARNING,
            default => SystemLog::SEVERITY_INFO,
        };

        return self::record(
            eventType: "billing.{$action}",
            message: $message,
            severity: $severity,
            status: $status,
            context: $context,
            tenantId: $tenantId,
            targetType: $targetType ?? SystemLog::TARGET_PAYMENT,
            targetId: $targetId,
        );
    }

    /**
     * Log an admin/RBAC event.
     */
    public static function logAdminEvent(
        string $action,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        ?string $targetType = null,
        ?string $targetId = null,
    ): SystemLog {
        return self::record(
            eventType: "admin.{$action}",
            message: $message,
            severity: SystemLog::SEVERITY_INFO,
            status: $status,
            context: $context,
            targetType: $targetType ?? SystemLog::TARGET_USER,
            targetId: $targetId,
        );
    }

    /**
     * Log an AI-related event.
     */
    public static function logAiEvent(
        string $action,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        ?int $tenantId = null,
    ): SystemLog {
        $severity = match($action) {
            'request.error', 'request.timeout' => SystemLog::SEVERITY_ERROR,
            'request.blocked', 'usage_limit.reached' => SystemLog::SEVERITY_WARNING,
            'usage_limit.warning' => SystemLog::SEVERITY_WARNING,
            default => SystemLog::SEVERITY_INFO,
        };

        return self::record(
            eventType: "ai.{$action}",
            message: $message,
            severity: $severity,
            status: $status,
            context: $context,
            tenantId: $tenantId,
            targetType: SystemLog::TARGET_AI,
        );
    }

    /**
     * Log a system/infrastructure event.
     */
    public static function logSystemEvent(
        string $action,
        string $message,
        string $status = SystemLog::STATUS_SUCCESS,
        array $context = [],
        string $severity = SystemLog::SEVERITY_INFO,
    ): SystemLog {
        return self::record(
            eventType: "system.{$action}",
            message: $message,
            severity: $severity,
            status: $status,
            context: $context,
            targetType: SystemLog::TARGET_SYSTEM,
            actorType: SystemLog::ACTOR_SYSTEM,
        );
    }

    /**
     * Log a plan event.
     */
    public static function logPlanEvent(
        string $action,
        $plan,
        string $message,
        array $context = [],
    ): SystemLog {
        return self::record(
            eventType: "plan.{$action}",
            message: $message,
            severity: SystemLog::SEVERITY_INFO,
            status: SystemLog::STATUS_SUCCESS,
            context: array_merge(['plan_name' => $plan->name, 'plan_slug' => $plan->slug], $context),
            targetType: SystemLog::TARGET_PLAN,
            targetId: $plan->id,
        );
    }

    /**
     * Log an error event (convenience method).
     */
    public static function logError(
        string $eventType,
        string $message,
        array $context = [],
        ?\Throwable $exception = null,
        ?int $tenantId = null,
    ): SystemLog {
        if ($exception) {
            $context['exception'] = [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
                'code' => $exception->getCode(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }

        return self::record(
            eventType: $eventType,
            message: $message,
            severity: SystemLog::SEVERITY_ERROR,
            status: SystemLog::STATUS_FAILED,
            context: $context,
            tenantId: $tenantId,
        );
    }

    /**
     * Log a critical event (convenience method).
     */
    public static function logCritical(
        string $eventType,
        string $message,
        array $context = [],
        ?int $tenantId = null,
    ): SystemLog {
        return self::record(
            eventType: $eventType,
            message: $message,
            severity: SystemLog::SEVERITY_CRITICAL,
            status: SystemLog::STATUS_FAILED,
            context: $context,
            tenantId: $tenantId,
        );
    }

    // ==========================================
    // QUERY HELPERS
    // ==========================================

    /**
     * Get recent logs summary for dashboard.
     */
    public static function getRecentSummary(int $hours = 24): array
    {
        $since = now()->subHours($hours);

        return [
            'total' => SystemLog::where('occurred_at', '>=', $since)->count(),
            'by_severity' => SystemLog::where('occurred_at', '>=', $since)
                ->selectRaw('severity, COUNT(*) as count')
                ->groupBy('severity')
                ->pluck('count', 'severity')
                ->toArray(),
            'by_category' => SystemLog::where('occurred_at', '>=', $since)
                ->selectRaw("SUBSTRING_INDEX(event_type, '.', 1) as category, COUNT(*) as count")
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'errors' => SystemLog::where('occurred_at', '>=', $since)
                ->whereIn('severity', [SystemLog::SEVERITY_ERROR, SystemLog::SEVERITY_CRITICAL])
                ->count(),
            'failed' => SystemLog::where('occurred_at', '>=', $since)
                ->where('status', SystemLog::STATUS_FAILED)
                ->count(),
        ];
    }

    /**
     * Get logs by correlation ID.
     */
    public static function getByCorrelation(string $correlationId)
    {
        return SystemLog::where('correlation_id', $correlationId)
            ->orderBy('occurred_at')
            ->get();
    }

    /**
     * Clean up old logs (for scheduled task).
     */
    public static function cleanup(int $daysToKeep = 90): int
    {
        $cutoff = now()->subDays($daysToKeep);

        return SystemLog::where('occurred_at', '<', $cutoff)->delete();
    }
}
