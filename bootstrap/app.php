<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\IdentifyTenant;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        using: function () {
            // Register tenant routes FIRST for subdomain-based tenants
            // These must be registered before main web routes

            // For local development with localhost subdomains
            // Example: endex.localhost:8000
            if (app()->environment('local')) {
                Route::middleware(['web', IdentifyTenant::class])
                    ->domain('{tenant}.localhost')
                    ->group(base_path('routes/tenant.php'));
            }

            // Production: acme.polluxworks.com
            $domain = config('app.domain', 'localhost');
            Route::middleware(['web', IdentifyTenant::class])
                ->domain("{tenant}.{$domain}")
                ->group(base_path('routes/tenant.php'));

            // Register main web routes AFTER tenant routes
            // Restrict to main domain only (no subdomains)
            if (app()->environment('local')) {
                Route::middleware('web')
                    ->domain('localhost')
                    ->group(base_path('routes/web.php'));
            } else {
                Route::middleware('web')
                    ->domain($domain)
                    ->group(base_path('routes/web.php'));
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Enable CORS handling
        $middleware->use([
            HandleCors::class,
        ]);

        // Prepend IdentifyTenant to web middleware so it runs BEFORE session/auth
        $middleware->web(prepend: [
            IdentifyTenant::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'tenant' => IdentifyTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
