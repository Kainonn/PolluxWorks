<?php

use App\Http\Controllers\Tenant\TenantAuthController;
use App\Http\Controllers\Tenant\TenantDashboardController;
use App\Http\Controllers\Tenant\TenantProfileController;
use App\Http\Controllers\Tenant\TenantRoleController;
use App\Http\Controllers\Tenant\TenantSettingsController;
use App\Http\Controllers\Tenant\TenantUserController;
use App\Http\Controllers\Tenant\TenantWelcomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by RouteServiceProvider and all of them will
| be assigned to the "tenant" middleware group which identifies the
| tenant from subdomain/custom domain.
|
*/

// Public tenant routes (no auth required)
Route::get('/', [TenantWelcomeController::class, 'index'])->name('tenant.welcome');

// Auth routes (guest only)
Route::middleware('guest:tenant')->group(function () {
    Route::get('/login', [TenantAuthController::class, 'showLogin'])->name('tenant.login');
    Route::post('/login', [TenantAuthController::class, 'login'])->name('tenant.login.store');
    Route::get('/forgot-password', [TenantAuthController::class, 'showForgotPassword'])->name('tenant.password.request');
    Route::post('/forgot-password', [TenantAuthController::class, 'sendResetLink'])->name('tenant.password.email');
    Route::get('/reset-password/{token}', [TenantAuthController::class, 'showResetPassword'])->name('tenant.password.reset');
    Route::post('/reset-password', [TenantAuthController::class, 'resetPassword'])->name('tenant.password.update');
});

// Two-factor authentication routes
Route::middleware('guest:tenant')->group(function () {
    Route::get('/two-factor-challenge', [TenantAuthController::class, 'showTwoFactorChallenge'])->name('tenant.two-factor.login');
    Route::post('/two-factor-challenge', [TenantAuthController::class, 'twoFactorChallenge']);
});

// Protected routes (auth required)
Route::middleware('auth:tenant')->group(function () {
    // Logout
    Route::post('/logout', [TenantAuthController::class, 'logout'])->name('tenant.logout');

    // Dashboard
    Route::get('/dashboard', [TenantDashboardController::class, 'index'])->name('tenant.dashboard');

    // Profile
    Route::prefix('profile')->name('tenant.profile.')->group(function () {
        Route::get('/', [TenantProfileController::class, 'show'])->name('show');
        Route::put('/', [TenantProfileController::class, 'update'])->name('update');
        Route::put('/password', [TenantProfileController::class, 'updatePassword'])->name('password');
        Route::post('/avatar', [TenantProfileController::class, 'uploadAvatar'])->name('avatar.upload');
        Route::delete('/avatar', [TenantProfileController::class, 'removeAvatar'])->name('avatar.remove');
        Route::post('/two-factor/enable', [TenantProfileController::class, 'enableTwoFactor'])->name('two-factor.enable');
        Route::post('/two-factor/confirm', [TenantProfileController::class, 'confirmTwoFactor'])->name('two-factor.confirm');
        Route::delete('/two-factor', [TenantProfileController::class, 'disableTwoFactor'])->name('two-factor.disable');
        Route::post('/two-factor/recovery-codes', [TenantProfileController::class, 'regenerateRecoveryCodes'])->name('two-factor.recovery');
        Route::delete('/sessions', [TenantProfileController::class, 'logoutOtherSessions'])->name('sessions.destroy');
        Route::delete('/', [TenantProfileController::class, 'destroy'])->name('destroy');
    });

    // Users management
    Route::resource('users', TenantUserController::class)->names([
        'index' => 'tenant.users.index',
        'create' => 'tenant.users.create',
        'store' => 'tenant.users.store',
        'show' => 'tenant.users.show',
        'edit' => 'tenant.users.edit',
        'update' => 'tenant.users.update',
        'destroy' => 'tenant.users.destroy',
    ]);
    Route::post('/users/{user}/toggle-active', [TenantUserController::class, 'toggleActive'])->name('tenant.users.toggle-active');

    // Roles management
    Route::resource('roles', TenantRoleController::class)->names([
        'index' => 'tenant.roles.index',
        'create' => 'tenant.roles.create',
        'store' => 'tenant.roles.store',
        'show' => 'tenant.roles.show',
        'edit' => 'tenant.roles.edit',
        'update' => 'tenant.roles.update',
        'destroy' => 'tenant.roles.destroy',
    ]);
    Route::post('/roles/{role}/duplicate', [TenantRoleController::class, 'duplicate'])->name('tenant.roles.duplicate');

    // Platform Notifications (Tenant view)
    Route::prefix('notifications')->name('tenant.notifications.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'index'])->name('index');
        Route::get('/dropdown', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'dropdown'])->name('dropdown');
        Route::get('/unread-count', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'unreadCount'])->name('unread-count');
        Route::post('/read-all', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::post('/viewed', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'markAsViewed'])->name('viewed');
        Route::post('/{notificationId}/read', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'markAsRead'])->name('read');
        Route::post('/{notificationId}/dismiss', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'dismiss'])->name('dismiss');
        Route::post('/{notificationId}/click', [\App\Http\Controllers\Tenant\TenantNotificationController::class, 'trackClick'])->name('click');
    });

    // Settings
    Route::prefix('settings')->name('tenant.settings.')->group(function () {
        Route::get('/', [TenantSettingsController::class, 'index'])->name('index');
        Route::put('/general', [TenantSettingsController::class, 'updateGeneral'])->name('general');
        Route::put('/branding', [TenantSettingsController::class, 'updateBranding'])->name('branding');
        Route::put('/notifications', [TenantSettingsController::class, 'updateNotifications'])->name('notifications');
        Route::put('/security', [TenantSettingsController::class, 'updateSecurity'])->name('security');
        Route::put('/locale', [TenantSettingsController::class, 'updateLocale'])->name('locale');
        Route::post('/logo', [TenantSettingsController::class, 'uploadLogo'])->name('logo.upload');
        Route::delete('/logo', [TenantSettingsController::class, 'removeLogo'])->name('logo.remove');
    });

    // API endpoints for settings
    Route::prefix('api')->group(function () {
        Route::get('/settings', [TenantSettingsController::class, 'getSettings'])->name('tenant.api.settings');
        Route::get('/settings/{group}', [TenantSettingsController::class, 'getGroup'])->name('tenant.api.settings.group');
    });
});
