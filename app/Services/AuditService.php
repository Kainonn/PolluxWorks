<?php

namespace App\Services;

use App\Models\AuditEntry;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

class AuditService
{
    /**
     * Sensitive fields that should never be stored in audit.
     */
    protected static array $sensitiveFields = [
        'password',
        'password_confirmation',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_token',
        'secret',
        'secret_key',
        'private_key',
        'access_token',
        'refresh_token',
        'db_password',
        'card_number',
        'cvv',
        'cvc',
        'ssn',
    ];

    /**
     * Fields to mask (show partial value).
     */
    protected static array $maskFields = [
        'email' => false, // Don't mask email - needed for audit
        'phone' => true,
        'card_last_four' => false,
    ];

    /**
     * Record an audit entry.
     */
    public static function record(
        string $action,
        string $entityType,
        string $entityId,
        ?string $entityLabel = null,
        ?array $changes = null,
        ?array $before = null,
        ?array $after = null,
        ?string $reason = null,
        ?int $tenantId = null,
        ?array $metadata = null,
        ?string $actorType = null,
        ?int $actorId = null,
        ?string $actorEmail = null,
    ): AuditEntry {
        // Auto-detect actor if not provided
        if ($actorType === null) {
            $actorType = self::detectActorType();
        }

        $user = Auth::user();
        if ($actorId === null && $actorType === AuditEntry::ACTOR_USER && $user) {
            $actorId = $user->id;
        }
        if ($actorEmail === null && $user) {
            $actorEmail = $user->email;
        }

        // Sanitize data
        $changes = $changes ? self::sanitizeData($changes) : null;
        $before = $before ? self::sanitizeData($before) : null;
        $after = $after ? self::sanitizeData($after) : null;

        $id = Str::uuid()->toString();

        $entry = AuditEntry::create([
            'id' => $id,
            'occurred_at' => now(),
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'actor_email' => $actorEmail,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'entity_label' => $entityLabel,
            'tenant_id' => $tenantId,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'request_id' => Request::header('X-Request-ID'),
            'correlation_id' => LogService::getCorrelation(),
            'reason' => $reason,
            'changes' => $changes,
            'before' => $before,
            'after' => $after,
            'metadata' => $metadata,
        ]);

        // Compute and store checksum for integrity
        $entry->checksum = $entry->computeChecksum();
        // Use DB::table to bypass the updating protection
        DB::table('audit_entries')
            ->where('id', $entry->id)
            ->update(['checksum' => $entry->checksum]);

        // Also create a system log entry for correlation
        LogService::record(
            eventType: self::actionToLogEvent($action, $entityType),
            message: self::generateLogMessage($action, $entityType, $entityLabel),
            context: [
                'audit_id' => $entry->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'changes_count' => $changes ? count($changes) : 0,
            ],
            tenantId: $tenantId,
            targetType: strtolower($entityType),
            targetId: $entityId,
        );

        return $entry;
    }

    /**
     * Audit a model creation.
     */
    public static function auditCreated(
        Model $model,
        ?string $reason = null,
        ?array $metadata = null,
    ): AuditEntry {
        $entityType = class_basename($model);
        $entityId = $model->getKey();
        $entityLabel = self::getEntityLabel($model);

        $after = self::getModelSnapshot($model);

        return self::record(
            action: AuditEntry::ACTION_CREATED,
            entityType: $entityType,
            entityId: $entityId,
            entityLabel: $entityLabel,
            after: $after,
            reason: $reason,
            tenantId: self::getTenantId($model),
            metadata: $metadata,
        );
    }

    /**
     * Audit a model update with diff.
     */
    public static function auditUpdated(
        Model $model,
        ?array $originalAttributes = null,
        ?string $reason = null,
        ?array $metadata = null,
        ?string $customAction = null,
    ): AuditEntry {
        $entityType = class_basename($model);
        $entityId = $model->getKey();
        $entityLabel = self::getEntityLabel($model);

        // Get the original values (before update)
        $original = $originalAttributes ?? $model->getOriginal();
        $current = $model->getAttributes();

        // Calculate diff
        $changes = self::calculateDiff($original, $current);
        $before = self::getModelSnapshot($model, $original);
        $after = self::getModelSnapshot($model);

        // Determine action based on changes
        $action = $customAction ?? AuditEntry::ACTION_UPDATED;
        if (isset($changes['status'])) {
            $action = AuditEntry::ACTION_STATUS_CHANGED;
        }

        return self::record(
            action: $action,
            entityType: $entityType,
            entityId: $entityId,
            entityLabel: $entityLabel,
            changes: $changes,
            before: $before,
            after: $after,
            reason: $reason,
            tenantId: self::getTenantId($model),
            metadata: $metadata,
        );
    }

    /**
     * Audit a model deletion.
     */
    public static function auditDeleted(
        Model $model,
        ?string $reason = null,
        ?array $metadata = null,
    ): AuditEntry {
        $entityType = class_basename($model);
        $entityId = $model->getKey();
        $entityLabel = self::getEntityLabel($model);

        $before = self::getModelSnapshot($model);

        return self::record(
            action: AuditEntry::ACTION_DELETED,
            entityType: $entityType,
            entityId: $entityId,
            entityLabel: $entityLabel,
            before: $before,
            reason: $reason,
            tenantId: self::getTenantId($model),
            metadata: $metadata,
        );
    }

    // ==========================================
    // SPECIFIC AUDIT HELPERS
    // ==========================================

    /**
     * Audit tenant suspension.
     */
    public static function auditTenantSuspended(
        Tenant $tenant,
        string $reason,
        ?array $metadata = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_SUSPENDED,
            entityType: AuditEntry::ENTITY_TENANT,
            entityId: $tenant->id,
            entityLabel: $tenant->name,
            changes: [
                'status' => ['from' => $tenant->getOriginal('status'), 'to' => 'suspended'],
                'suspended_reason' => ['from' => null, 'to' => $reason],
            ],
            reason: $reason,
            tenantId: $tenant->id,
            metadata: $metadata,
        );
    }

    /**
     * Audit tenant reactivation.
     */
    public static function auditTenantReactivated(
        Tenant $tenant,
        ?string $reason = null,
        ?array $metadata = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_REACTIVATED,
            entityType: AuditEntry::ENTITY_TENANT,
            entityId: $tenant->id,
            entityLabel: $tenant->name,
            changes: [
                'status' => ['from' => 'suspended', 'to' => $tenant->status],
            ],
            reason: $reason ?? 'Tenant reactivated',
            tenantId: $tenant->id,
            metadata: $metadata,
        );
    }

    /**
     * Audit plan change.
     */
    public static function auditPlanChanged(
        Subscription $subscription,
        Plan $fromPlan,
        Plan $toPlan,
        ?string $reason = null,
        ?array $metadata = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_PLAN_CHANGED,
            entityType: AuditEntry::ENTITY_SUBSCRIPTION,
            entityId: $subscription->id,
            entityLabel: "Subscription #{$subscription->id}",
            changes: [
                'plan_id' => ['from' => $fromPlan->id, 'to' => $toPlan->id],
                'plan_name' => ['from' => $fromPlan->name, 'to' => $toPlan->name],
                'plan_slug' => ['from' => $fromPlan->slug, 'to' => $toPlan->slug],
            ],
            reason: $reason ?? 'Plan changed',
            tenantId: $subscription->tenant_id,
            metadata: array_merge($metadata ?? [], [
                'from_plan_price' => $fromPlan->price_monthly,
                'to_plan_price' => $toPlan->price_monthly,
            ]),
        );
    }

    /**
     * Audit role assignment.
     */
    public static function auditRoleAssigned(
        User $user,
        Role $role,
        ?string $reason = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_ROLE_ASSIGNED,
            entityType: AuditEntry::ENTITY_USER,
            entityId: $user->id,
            entityLabel: $user->name,
            changes: [
                'role_id' => ['from' => $user->getOriginal('role_id'), 'to' => $role->id],
                'role_name' => ['from' => null, 'to' => $role->name],
            ],
            reason: $reason ?? "Role '{$role->name}' assigned",
        );
    }

    /**
     * Audit MFA change.
     */
    public static function auditMfaChanged(
        User $user,
        bool $enabled,
        ?string $reason = null,
    ): AuditEntry {
        return self::record(
            action: $enabled ? AuditEntry::ACTION_MFA_ENABLED : AuditEntry::ACTION_MFA_DISABLED,
            entityType: AuditEntry::ENTITY_USER,
            entityId: $user->id,
            entityLabel: $user->name,
            changes: [
                'two_factor_enabled' => ['from' => !$enabled, 'to' => $enabled],
            ],
            reason: $reason ?? ($enabled ? 'MFA enabled' : 'MFA disabled'),
        );
    }

    /**
     * Audit trial extension.
     */
    public static function auditTrialExtended(
        Tenant $tenant,
        string $oldEndDate,
        string $newEndDate,
        int $daysExtended,
        ?string $reason = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_TRIAL_EXTENDED,
            entityType: AuditEntry::ENTITY_TENANT,
            entityId: $tenant->id,
            entityLabel: $tenant->name,
            changes: [
                'trial_ends_at' => ['from' => $oldEndDate, 'to' => $newEndDate],
            ],
            reason: $reason ?? "Trial extended by {$daysExtended} days",
            tenantId: $tenant->id,
            metadata: ['days_extended' => $daysExtended],
        );
    }

    /**
     * Audit domain change.
     */
    public static function auditDomainAdded(
        Tenant $tenant,
        string $domain,
        ?string $reason = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_DOMAIN_ADDED,
            entityType: AuditEntry::ENTITY_TENANT,
            entityId: $tenant->id,
            entityLabel: $tenant->name,
            changes: [
                'domain' => ['from' => null, 'to' => $domain],
            ],
            reason: $reason ?? "Domain '{$domain}' added",
            tenantId: $tenant->id,
        );
    }

    /**
     * Audit refund.
     */
    public static function auditRefund(
        $payment,
        int $amountCents,
        string $currency,
        ?string $reason = null,
    ): AuditEntry {
        return self::record(
            action: AuditEntry::ACTION_REFUNDED,
            entityType: AuditEntry::ENTITY_PAYMENT,
            entityId: $payment->id,
            entityLabel: "Payment #{$payment->id}",
            changes: [
                'refunded_amount' => ['from' => 0, 'to' => $amountCents],
            ],
            reason: $reason ?? 'Payment refunded',
            tenantId: $payment->tenant_id ?? null,
            metadata: [
                'currency' => $currency,
                'amount_formatted' => number_format($amountCents / 100, 2),
            ],
        );
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Calculate diff between two arrays.
     */
    public static function calculateDiff(array $original, array $current): array
    {
        $diff = [];

        // Get all keys from both arrays
        $allKeys = array_unique(array_merge(array_keys($original), array_keys($current)));

        foreach ($allKeys as $key) {
            // Skip sensitive fields
            if (in_array($key, self::$sensitiveFields)) {
                continue;
            }

            // Skip timestamps and internal fields
            if (in_array($key, ['created_at', 'updated_at', 'deleted_at', 'remember_token'])) {
                continue;
            }

            $oldValue = $original[$key] ?? null;
            $newValue = $current[$key] ?? null;

            // Normalize values for comparison
            $oldValue = self::normalizeValue($oldValue);
            $newValue = self::normalizeValue($newValue);

            if ($oldValue !== $newValue) {
                $diff[$key] = [
                    'from' => $oldValue,
                    'to' => $newValue,
                ];
            }
        }

        return $diff;
    }

    /**
     * Normalize a value for comparison.
     */
    protected static function normalizeValue($value)
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_array($value)) {
            return json_encode($value);
        }

        return $value;
    }

    /**
     * Get a sanitized snapshot of a model.
     */
    public static function getModelSnapshot(Model $model, ?array $attributes = null): array
    {
        $attributes = $attributes ?? $model->getAttributes();
        return self::sanitizeData($attributes);
    }

    /**
     * Sanitize data by removing sensitive fields.
     */
    public static function sanitizeData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            // Skip sensitive fields entirely
            if (in_array(strtolower($key), self::$sensitiveFields)) {
                continue;
            }

            // Check for partial matches (e.g., 'user_password')
            foreach (self::$sensitiveFields as $sensitive) {
                if (str_contains(strtolower($key), $sensitive)) {
                    continue 2;
                }
            }

            // Recursively sanitize arrays
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Detect the actor type based on context.
     */
    protected static function detectActorType(): string
    {
        if (app()->runningInConsole()) {
            return AuditEntry::ACTOR_SCHEDULER;
        }

        if (Auth::check()) {
            return AuditEntry::ACTOR_USER;
        }

        if (Request::is('api/*')) {
            return AuditEntry::ACTOR_API;
        }

        if (Request::is('webhooks/*') || Request::is('*/webhooks/*')) {
            return AuditEntry::ACTOR_WEBHOOK;
        }

        return AuditEntry::ACTOR_SYSTEM;
    }

    /**
     * Get a human-readable label for a model.
     */
    protected static function getEntityLabel(Model $model): ?string
    {
        // Try common label fields
        $labelFields = ['name', 'title', 'email', 'slug'];

        foreach ($labelFields as $field) {
            if (isset($model->{$field})) {
                return $model->{$field};
            }
        }

        return null;
    }

    /**
     * Get tenant ID from a model if applicable.
     */
    protected static function getTenantId(Model $model): ?int
    {
        if ($model instanceof Tenant) {
            return $model->id;
        }

        if (isset($model->tenant_id)) {
            return $model->tenant_id;
        }

        return null;
    }

    /**
     * Convert action to log event type.
     */
    protected static function actionToLogEvent(string $action, string $entityType): string
    {
        $entity = strtolower($entityType);
        return "audit.{$entity}.{$action}";
    }

    /**
     * Generate a human-readable log message.
     */
    protected static function generateLogMessage(string $action, string $entityType, ?string $entityLabel): string
    {
        $actionLabel = ucfirst(str_replace('_', ' ', $action));
        $label = $entityLabel ? " '{$entityLabel}'" : '';

        return "{$entityType}{$label} {$actionLabel}";
    }

    // ==========================================
    // QUERY HELPERS
    // ==========================================

    /**
     * Get audit history for an entity.
     */
    public static function getEntityHistory(string $entityType, string $entityId, int $limit = 50)
    {
        return AuditEntry::forEntity($entityType, $entityId)
            ->orderBy('occurred_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent audit activity.
     */
    public static function getRecentActivity(int $hours = 24, int $limit = 100)
    {
        return AuditEntry::where('occurred_at', '>=', now()->subHours($hours))
            ->orderBy('occurred_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit summary for reporting.
     */
    public static function getSummary(int $days = 30): array
    {
        $since = now()->subDays($days);

        return [
            'total' => AuditEntry::where('occurred_at', '>=', $since)->count(),
            'by_action' => AuditEntry::where('occurred_at', '>=', $since)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray(),
            'by_entity' => AuditEntry::where('occurred_at', '>=', $since)
                ->selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->pluck('count', 'entity_type')
                ->toArray(),
            'by_actor' => AuditEntry::where('occurred_at', '>=', $since)
                ->selectRaw('actor_type, COUNT(*) as count')
                ->groupBy('actor_type')
                ->pluck('count', 'actor_type')
                ->toArray(),
        ];
    }
}
