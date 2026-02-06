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

            // Always register localhost subdomains for development/testing
            // Example: endex.localhost:8000
            // Note: Laravel domain routing ignores ports, so {tenant}.localhost
            // will match endex.localhost:8000
            Route::middleware(['web', IdentifyTenant::class])
                ->domain('{tenant}.localhost')
                ->group(base_path('routes/tenant.php'));

            // Production: acme.polluxworks.com (only if domain is not localhost)
            $domain = config('app.domain', 'localhost');
            if ($domain !== 'localhost') {
                Route::middleware(['web', IdentifyTenant::class])
                    ->domain("{tenant}.{$domain}")
                    ->group(base_path('routes/tenant.php'));
            }

            // Register main web routes AFTER tenant routes
            // Restrict to main domain only (no subdomains)
            Route::middleware('web')
                ->domain('localhost')
                ->group(base_path('routes/web.php'));

            // Production main domain (only if domain is not localhost)
            if ($domain !== 'localhost') {
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

        // Configure guest redirect based on tenant context
        $middleware->redirectGuestsTo(function ($request) {
            // Check if this is a tenant subdomain request
            $host = $request->getHost();
            $baseDomains = ['localhost', config('app.domain', 'localhost')];

            foreach ($baseDomains as $baseDomain) {
                if ($host !== $baseDomain && str_ends_with($host, ".{$baseDomain}")) {
                    // This is a tenant request, redirect to tenant login
                    return '/login'; // Relative URL stays on the same subdomain
                }
            }

            // Master domain - redirect to master login
            return '/login';
        });

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
