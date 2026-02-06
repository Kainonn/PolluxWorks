<?php

namespace Database\Seeders;

use App\Models\SystemLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SystemLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $tenants = Tenant::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        // Sample events to create
        $events = [
            // Auth events
            [
                'event_type' => 'auth.login.success',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'User logged in successfully',
                'actor_type' => 'user',
            ],
            [
                'event_type' => 'auth.login.failed',
                'severity' => 'warning',
                'status' => 'failed',
                'message' => 'Login attempt failed - invalid credentials',
                'actor_type' => 'user',
            ],
            [
                'event_type' => 'auth.password.reset_requested',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Password reset requested',
                'actor_type' => 'user',
            ],
            [
                'event_type' => 'auth.logout',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'User logged out',
                'actor_type' => 'user',
            ],

            // Tenant events
            [
                'event_type' => 'tenant.created',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'New tenant created',
                'actor_type' => 'user',
                'target_type' => 'tenant',
                'context' => ['plan' => 'starter', 'trial_days' => 14],
            ],
            [
                'event_type' => 'tenant.suspended',
                'severity' => 'warning',
                'status' => 'success',
                'message' => 'Tenant suspended due to payment failure',
                'actor_type' => 'system',
                'target_type' => 'tenant',
                'context' => ['reason' => 'payment_overdue', 'days_overdue' => 15],
            ],
            [
                'event_type' => 'tenant.reactivated',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Tenant reactivated after payment',
                'actor_type' => 'user',
                'target_type' => 'tenant',
            ],
            [
                'event_type' => 'tenant.provisioning.started',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Tenant provisioning started',
                'actor_type' => 'system',
                'target_type' => 'tenant',
            ],
            [
                'event_type' => 'tenant.provisioning.completed',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Tenant provisioning completed successfully',
                'actor_type' => 'system',
                'target_type' => 'tenant',
                'context' => ['duration_seconds' => 45],
            ],
            [
                'event_type' => 'tenant.provisioning.failed',
                'severity' => 'error',
                'status' => 'failed',
                'message' => 'Tenant provisioning failed - database creation error',
                'actor_type' => 'system',
                'target_type' => 'tenant',
                'context' => ['error' => 'Connection refused', 'attempt' => 3],
            ],

            // Subscription events
            [
                'event_type' => 'subscription.plan_changed',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Subscription plan upgraded from Starter to Pro',
                'actor_type' => 'user',
                'target_type' => 'subscription',
                'context' => ['from_plan' => 'starter', 'to_plan' => 'pro', 'effective_at' => now()->addDays(30)->toDateString()],
            ],
            [
                'event_type' => 'subscription.cancelled',
                'severity' => 'warning',
                'status' => 'success',
                'message' => 'Subscription cancelled by user',
                'actor_type' => 'user',
                'target_type' => 'subscription',
                'context' => ['reason' => 'too_expensive', 'feedback' => 'Will reconsider later'],
            ],

            // Billing events
            [
                'event_type' => 'billing.payment.succeeded',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Payment processed successfully',
                'actor_type' => 'webhook',
                'target_type' => 'payment',
                'context' => ['amount' => 4999, 'currency' => 'USD', 'provider' => 'stripe'],
            ],
            [
                'event_type' => 'billing.payment.failed',
                'severity' => 'error',
                'status' => 'failed',
                'message' => 'Payment failed - card declined',
                'actor_type' => 'webhook',
                'target_type' => 'payment',
                'context' => ['amount' => 4999, 'currency' => 'USD', 'provider' => 'stripe', 'decline_code' => 'insufficient_funds'],
            ],
            [
                'event_type' => 'billing.webhook.received',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Webhook received from Stripe',
                'actor_type' => 'webhook',
                'target_type' => 'webhook',
                'context' => ['event_type' => 'invoice.paid', 'provider' => 'stripe'],
            ],
            [
                'event_type' => 'billing.webhook.failed',
                'severity' => 'error',
                'status' => 'failed',
                'message' => 'Webhook processing failed - invalid signature',
                'actor_type' => 'webhook',
                'target_type' => 'webhook',
                'context' => ['provider' => 'stripe', 'error' => 'Signature verification failed'],
            ],

            // Admin events
            [
                'event_type' => 'admin.user.created',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'New admin user created',
                'actor_type' => 'user',
                'target_type' => 'user',
            ],
            [
                'event_type' => 'admin.role.assigned',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Role "Super Admin" assigned to user',
                'actor_type' => 'user',
                'target_type' => 'role',
                'context' => ['role' => 'super_admin', 'user_email' => 'admin@example.com'],
            ],

            // AI events
            [
                'event_type' => 'ai.request.executed',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'AI request executed successfully',
                'actor_type' => 'api',
                'target_type' => 'ai',
                'context' => ['model' => 'gpt-4', 'tokens_used' => 1250, 'latency_ms' => 2340],
            ],
            [
                'event_type' => 'ai.tool.called',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'AI tool "FindClientTool" invoked',
                'actor_type' => 'api',
                'target_type' => 'ai',
                'context' => ['tool' => 'FindClientTool', 'execution_time_ms' => 150],
            ],
            [
                'event_type' => 'ai.request.blocked',
                'severity' => 'warning',
                'status' => 'failed',
                'message' => 'AI request blocked by content policy',
                'actor_type' => 'api',
                'target_type' => 'ai',
                'context' => ['reason' => 'content_policy_violation'],
            ],
            [
                'event_type' => 'ai.usage_limit.reached',
                'severity' => 'warning',
                'status' => 'success',
                'message' => 'Monthly AI request limit reached',
                'actor_type' => 'system',
                'target_type' => 'ai',
                'context' => ['limit' => 1000, 'used' => 1000, 'reset_at' => now()->endOfMonth()->toDateString()],
            ],

            // System events
            [
                'event_type' => 'system.health_check.failed',
                'severity' => 'critical',
                'status' => 'failed',
                'message' => 'Health check failed - database unreachable',
                'actor_type' => 'scheduler',
                'target_type' => 'system',
                'context' => ['service' => 'database', 'error' => 'Connection timed out'],
            ],
            [
                'event_type' => 'system.health_check.recovered',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'Health check recovered - database is back online',
                'actor_type' => 'scheduler',
                'target_type' => 'system',
                'context' => ['service' => 'database', 'downtime_minutes' => 5],
            ],
            [
                'event_type' => 'system.backup.completed',
                'severity' => 'info',
                'status' => 'success',
                'message' => 'System backup completed successfully',
                'actor_type' => 'scheduler',
                'target_type' => 'system',
                'context' => ['size_mb' => 256, 'duration_seconds' => 120, 'destination' => 's3://backups/'],
            ],
            [
                'event_type' => 'system.backup.failed',
                'severity' => 'error',
                'status' => 'failed',
                'message' => 'System backup failed - storage full',
                'actor_type' => 'scheduler',
                'target_type' => 'system',
                'context' => ['error' => 'No space left on device'],
            ],
            [
                'event_type' => 'system.queue.stalled',
                'severity' => 'error',
                'status' => 'failed',
                'message' => 'Queue worker stalled - jobs not processing',
                'actor_type' => 'scheduler',
                'target_type' => 'system',
                'context' => ['queue' => 'default', 'pending_jobs' => 150],
            ],
        ];

        $correlationId = Str::uuid()->toString();
        $ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.45', null];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            null,
        ];

        // Create logs spanning the last 30 days
        foreach (range(0, 200) as $i) {
            $event = $events[array_rand($events)];
            $user = $users->random();
            $tenant = $tenants->isNotEmpty() ? $tenants->random() : null;
            $occurredAt = now()->subMinutes(rand(0, 43200)); // Random time in last 30 days

            // Use correlation ID for some related events
            $useCorrelation = rand(0, 10) > 7;

            SystemLog::create([
                'id' => Str::uuid()->toString(),
                'occurred_at' => $occurredAt,
                'event_type' => $event['event_type'],
                'severity' => $event['severity'],
                'status' => $event['status'],
                'actor_type' => $event['actor_type'],
                'actor_id' => $event['actor_type'] === 'user' ? $user->id : null,
                'tenant_id' => $tenant?->id,
                'target_type' => $event['target_type'] ?? null,
                'target_id' => $tenant?->id ?? ($user->id ?? null),
                'ip' => $ips[array_rand($ips)],
                'user_agent' => $userAgents[array_rand($userAgents)],
                'correlation_id' => $useCorrelation ? $correlationId : (rand(0, 10) > 8 ? Str::uuid()->toString() : null),
                'request_id' => rand(0, 10) > 5 ? Str::uuid()->toString() : null,
                'message' => $event['message'],
                'context' => $event['context'] ?? null,
                'created_at' => $occurredAt,
                'updated_at' => $occurredAt,
            ]);
        }

        $this->command->info('Created 200+ sample system log entries.');
    }
}
