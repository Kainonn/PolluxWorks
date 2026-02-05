<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is a tenant subdomain request
        $tenantSlug = $this->extractTenantSlug($request);

        // If no tenant slug found, this is a master domain request - skip tenant identification
        if (!$tenantSlug) {
            return $next($request);
        }

        Log::info('IdentifyTenant middleware', [
            'host' => $request->getHost(),
            'tenant_slug' => $tenantSlug,
            'path' => $request->path(),
        ]);

        $tenant = Tenant::where('slug', $tenantSlug)->with('plan')->first();

        if (!$tenant) {
            Log::warning('Tenant not found', ['slug' => $tenantSlug]);
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Tenant not found'], 404);
            }
            abort(404, 'Tenant not found');
        }

        Log::info('Tenant identified', ['tenant' => $tenant->slug, 'db' => $tenant->db_name]);

        // Check tenant status
        if ($tenant->status === Tenant::STATUS_SUSPENDED) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'This account has been suspended'], 403);
            }
            return response()->view('tenant.suspended', ['tenant' => $tenant], 403);
        }

        if ($tenant->status === Tenant::STATUS_CANCELLED) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'This account has been cancelled'], 403);
            }
            return response()->view('tenant.cancelled', ['tenant' => $tenant], 403);
        }

        // Check provisioning status
        if ($tenant->provisioning_status !== Tenant::PROVISIONING_READY) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Account is being set up'], 503);
            }
            return response()->view('tenant.provisioning', ['tenant' => $tenant], 503);
        }

        // Configure tenant database connection
        $this->configureTenantConnection($tenant);

        // Store tenant in request and app container
        $request->attributes->set('tenant', $tenant);
        app()->instance('tenant', $tenant);

        // Share tenant with all views
        View::share('tenant', $tenant);

        // Set tenant-specific configuration
        Config::set('app.name', $tenant->name);
        Config::set('app.timezone', $tenant->timezone);
        Config::set('app.locale', $tenant->locale);

        return $next($request);
    }

    /**
     * Extract tenant slug from request host.
     */
    protected function extractTenantSlug(Request $request): ?string
    {
        $host = $request->getHost();

        // List of base domains (without tenant subdomain)
        $baseDomains = [
            'localhost',
            config('app.domain', 'localhost'),
            'polluxworks.test',
            'polluxworks.com',
        ];

        foreach ($baseDomains as $baseDomain) {
            // Check if host is exactly the base domain (no subdomain)
            if ($host === $baseDomain) {
                return null;
            }

            // Check if host ends with the base domain
            if (str_ends_with($host, ".{$baseDomain}")) {
                $subdomain = str_replace(".{$baseDomain}", '', $host);

                // Make sure we got a valid subdomain
                if ($subdomain && $subdomain !== $host && !str_contains($subdomain, '.')) {
                    return $subdomain;
                }
            }
        }

        return null;
    }

    /**
     * Configure database connection for tenant.
     */
    protected function configureTenantConnection(Tenant $tenant): void
    {
        $defaultConnection = config('database.default');

        if ($defaultConnection === 'sqlite') {
            Config::set('database.connections.tenant', [
                'driver' => 'sqlite',
                'database' => $tenant->db_name,
                'prefix' => '',
                'foreign_key_constraints' => true,
            ]);
        } else {
            Config::set('database.connections.tenant', [
                'driver' => $defaultConnection,
                'host' => $tenant->db_host ?? config("database.connections.{$defaultConnection}.host"),
                'port' => $tenant->db_port ?? config("database.connections.{$defaultConnection}.port"),
                'database' => $tenant->db_name,
                'username' => $tenant->db_username ?? config("database.connections.{$defaultConnection}.username"),
                'password' => $tenant->db_password ?? config("database.connections.{$defaultConnection}.password"),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]);
        }

        // Purge and reconnect
        DB::purge('tenant');
        DB::reconnect('tenant');
    }
}
