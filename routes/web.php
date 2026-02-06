<?php

use App\Http\Controllers\Master\PlanController;
use App\Http\Controllers\Master\RoleController;
use App\Http\Controllers\Master\TenantController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\SubscriptionController;
use App\Http\Controllers\Master\SystemLogController;
use App\Http\Controllers\Master\AuditEntryController;
use App\Http\Controllers\Master\Billing\BillingCustomerController;
use App\Http\Controllers\Master\Billing\PaymentMethodController;
use App\Http\Controllers\Master\Billing\PaymentController;
use App\Http\Controllers\Master\Billing\InvoiceController;
use App\Http\Controllers\Master\Billing\WebhookEventController;
use App\Http\Controllers\Master\AI\AiModelController;
use App\Http\Controllers\Master\AI\AiToolController;
use App\Http\Controllers\Master\AI\AiPlanLimitController;
use App\Http\Controllers\Master\AI\AiUsageController;
use App\Http\Controllers\Master\AI\AiFallbackRuleController;
use App\Http\Controllers\Master\AI\AiPolicyController;
use App\Http\Controllers\Master\AI\AiProviderConfigController;
use App\Http\Controllers\Api\HeartbeatController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Master Data Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('users', UserController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('plans', PlanController::class);

    // Tenant Management
    Route::get('tenants/check-slug', [TenantController::class, 'checkSlug'])->name('tenants.check-slug');
    Route::resource('tenants', TenantController::class);

    // Tenant Actions
    Route::post('tenants/{tenant}/suspend', [TenantController::class, 'suspend'])->name('tenants.suspend');
    Route::post('tenants/{tenant}/reactivate', [TenantController::class, 'reactivate'])->name('tenants.reactivate');
    Route::post('tenants/{tenant}/change-plan', [TenantController::class, 'changePlan'])->name('tenants.change-plan');
    Route::post('tenants/{tenant}/health-check', [TenantController::class, 'healthCheck'])->name('tenants.health-check');
    Route::post('tenants/{tenant}/retry-provisioning', [TenantController::class, 'retryProvisioning'])->name('tenants.retry-provisioning');
    Route::post('tenants/{tenant}/regenerate-token', [TenantController::class, 'regenerateToken'])->name('tenants.regenerate-token');

    // Tenant Domain Management
    Route::post('tenants/{tenant}/domains', [TenantController::class, 'addDomain'])->name('tenants.domains.add');
    Route::delete('tenants/{tenant}/domains', [TenantController::class, 'removeDomain'])->name('tenants.domains.remove');
    Route::post('tenants/{tenant}/domains/verify-dns', [TenantController::class, 'verifyDns'])->name('tenants.domains.verify-dns');

    // Subscription Management
    Route::resource('subscriptions', SubscriptionController::class)->only(['index', 'show', 'edit', 'update']);
    Route::post('subscriptions/{subscription}/change-plan', [SubscriptionController::class, 'changePlan'])->name('subscriptions.change-plan');
    Route::post('subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
    Route::post('subscriptions/{subscription}/reactivate', [SubscriptionController::class, 'reactivate'])->name('subscriptions.reactivate');
    Route::delete('subscriptions/{subscription}/cancel-pending-change', [SubscriptionController::class, 'cancelPendingChange'])->name('subscriptions.cancel-pending-change');

    // Billing Management
    Route::prefix('billing')->name('billing.')->group(function () {
        // Billing Customers
        Route::resource('customers', BillingCustomerController::class)->only(['index', 'show', 'update']);

        // Payment Methods
        Route::resource('payment-methods', PaymentMethodController::class)->only(['index', 'show', 'update']);

        // Payments (read-only)
        Route::resource('payments', PaymentController::class)->only(['index', 'show']);

        // Invoices
        Route::resource('invoices', InvoiceController::class)->only(['index', 'show', 'update']);
        Route::post('invoices/{invoice}/mark-as-paid', [InvoiceController::class, 'markAsPaid'])->name('invoices.mark-as-paid');
        Route::post('invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');

        // Webhook Events
        Route::resource('webhooks', WebhookEventController::class)->only(['index', 'show']);
        Route::post('webhooks/{webhookEvent}/retry', [WebhookEventController::class, 'retry'])->name('webhooks.retry');
        Route::post('webhooks/{webhookEvent}/ignore', [WebhookEventController::class, 'ignore'])->name('webhooks.ignore');
    });

    // Operational Logs
    Route::resource('system-logs', SystemLogController::class)->only(['index', 'show']);
    Route::get('system-logs/export', [SystemLogController::class, 'export'])->name('system-logs.export');

    // Audit Trail (Compliance/Enterprise)
    Route::prefix('master')->name('master.')->group(function () {
        Route::get('audit-trail', [AuditEntryController::class, 'index'])->name('audit-trail.index');
        Route::get('audit-trail/export', [AuditEntryController::class, 'export'])->name('audit-trail.export');
        Route::get('audit-trail/entity-history', [AuditEntryController::class, 'entityHistory'])->name('audit-trail.entity-history');
        Route::get('audit-trail/{auditEntry}', [AuditEntryController::class, 'show'])->name('audit-trail.show');

        // AI Control Center
        Route::prefix('ai')->name('ai.')->group(function () {
            // AI Models Management
            Route::resource('models', AiModelController::class);

            // AI Tools Registry
            Route::post('tools/{tool}/toggle', [AiToolController::class, 'toggle'])->name('tools.toggle');
            Route::resource('tools', AiToolController::class);

            // AI Plan Limits
            Route::resource('plan-limits', AiPlanLimitController::class)->parameters([
                'plan-limits' => 'planLimit',
            ]);

            // AI Usage & Metrics
            Route::get('usage', [AiUsageController::class, 'index'])->name('usage.index');
            Route::get('usage/export', [AiUsageController::class, 'export'])->name('usage.export');
            Route::get('usage/tenant/{tenant}', [AiUsageController::class, 'byTenant'])->name('usage.tenant');
            Route::get('usage/model/{model}', [AiUsageController::class, 'byModel'])->name('usage.model');

            // AI Fallback Rules
            Route::post('fallback-rules/{fallbackRule}/toggle', [AiFallbackRuleController::class, 'toggle'])->name('fallback-rules.toggle');
            Route::resource('fallback-rules', AiFallbackRuleController::class)->parameters([
                'fallback-rules' => 'fallbackRule',
            ]);

            // AI Policies & Guardrails
            Route::post('policies/{policy}/toggle', [AiPolicyController::class, 'toggle'])->name('policies.toggle');
            Route::resource('policies', AiPolicyController::class);

            // AI Provider Configs
            Route::post('providers/{provider}/toggle', [AiProviderConfigController::class, 'toggle'])->name('providers.toggle');
            Route::post('providers/{provider}/test', [AiProviderConfigController::class, 'test'])->name('providers.test');
            Route::resource('providers', AiProviderConfigController::class);
        });
    });
});

// API Routes for Tenant Heartbeat (no web middleware)
Route::prefix('api')->group(function () {
    Route::post('heartbeat', [HeartbeatController::class, 'store'])->name('api.heartbeat');
    Route::get('heartbeat/status', [HeartbeatController::class, 'status'])->name('api.heartbeat.status');
});

require __DIR__.'/settings.php';
