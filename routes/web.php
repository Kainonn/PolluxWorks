<?php

use App\Http\Controllers\Master\PlanController;
use App\Http\Controllers\Master\RoleController;
use App\Http\Controllers\Master\TenantController;
use App\Http\Controllers\Master\UserController;
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
});

// API Routes for Tenant Heartbeat (no web middleware)
Route::prefix('api')->group(function () {
    Route::post('heartbeat', [HeartbeatController::class, 'store'])->name('api.heartbeat');
    Route::get('heartbeat/status', [HeartbeatController::class, 'status'])->name('api.heartbeat.status');
});

require __DIR__.'/settings.php';
