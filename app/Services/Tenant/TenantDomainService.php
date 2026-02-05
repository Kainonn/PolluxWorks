<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TenantDomainService
{
    /**
     * Base domain for tenant subdomains.
     */
    protected string $baseDomain;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->baseDomain = config('app.tenant_domain', 'polluxworks.com');
    }

    /**
     * Get subdomain URL for tenant.
     */
    public function getSubdomainUrl(Tenant $tenant): string
    {
        $protocol = app()->environment('production') ? 'https' : 'http';
        $baseDomain = $this->getBaseDomain();

        return "{$protocol}://{$tenant->slug}.{$baseDomain}";
    }

    /**
     * Get base domain based on environment.
     */
    public function getBaseDomain(): string
    {
        if (app()->environment('local')) {
            return config('app.tenant_domain_local', 'polluxworks.test');
        }

        return $this->baseDomain;
    }

    /**
     * Check if a slug is available.
     */
    public function isSlugAvailable(string $slug, ?int $excludeTenantId = null): bool
    {
        $query = Tenant::withTrashed()->where('slug', $slug);

        if ($excludeTenantId) {
            $query->where('id', '!=', $excludeTenantId);
        }

        return !$query->exists();
    }

    /**
     * Add a custom domain to tenant.
     */
    public function addCustomDomain(Tenant $tenant, string $domain): void
    {
        $domain = $this->normalizeDomain($domain);

        // Check if domain is already in use
        if ($this->isDomainInUse($domain, $tenant->id)) {
            throw new \Exception("Domain {$domain} is already in use");
        }

        $customDomains = $tenant->custom_domains ?? [];
        if (!in_array($domain, $customDomains)) {
            $customDomains[] = $domain;
        }

        $domainStatus = $tenant->domain_status ?? [];
        $domainStatus[$domain] = [
            'dns' => 'pending',
            'ssl' => 'pending',
            'added_at' => now()->toISOString(),
        ];

        $tenant->update([
            'custom_domains' => $customDomains,
            'domain_status' => $domainStatus,
        ]);

        $tenant->logActivity('domain_added', "Custom domain '{$domain}' was added");
    }

    /**
     * Remove a custom domain from tenant.
     */
    public function removeCustomDomain(Tenant $tenant, string $domain): void
    {
        $domain = $this->normalizeDomain($domain);

        $customDomains = $tenant->custom_domains ?? [];
        $customDomains = array_values(array_filter($customDomains, fn($d) => $d !== $domain));

        $domainStatus = $tenant->domain_status ?? [];
        unset($domainStatus[$domain]);

        $tenant->update([
            'custom_domains' => $customDomains ?: null,
            'domain_status' => $domainStatus ?: null,
        ]);

        $tenant->logActivity('domain_removed', "Custom domain '{$domain}' was removed");
    }

    /**
     * Set primary domain for tenant.
     */
    public function setPrimaryDomain(Tenant $tenant, ?string $domain): void
    {
        if ($domain) {
            $domain = $this->normalizeDomain($domain);
        }

        $oldDomain = $tenant->primary_domain;
        $tenant->update(['primary_domain' => $domain]);

        $tenant->logActivity(
            'primary_domain_changed',
            "Primary domain changed from '{$oldDomain}' to '{$domain}'"
        );
    }

    /**
     * Verify DNS for a custom domain.
     */
    public function verifyDns(Tenant $tenant, string $domain): array
    {
        $domain = $this->normalizeDomain($domain);

        $expectedCname = "{$tenant->slug}.{$this->baseDomain}";
        $result = [
            'verified' => false,
            'expected' => $expectedCname,
            'found' => null,
            'error' => null,
        ];

        try {
            $records = dns_get_record($domain, DNS_CNAME);

            if (!empty($records)) {
                $result['found'] = $records[0]['target'] ?? null;
                $result['verified'] = $result['found'] === $expectedCname;
            }

            // Update domain status
            $domainStatus = $tenant->domain_status ?? [];
            $domainStatus[$domain] = array_merge($domainStatus[$domain] ?? [], [
                'dns' => $result['verified'] ? 'active' : 'pending',
                'dns_checked_at' => now()->toISOString(),
            ]);
            $tenant->update(['domain_status' => $domainStatus]);

        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            Log::warning("DNS verification failed for {$domain}: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Check SSL certificate status for a domain.
     */
    public function checkSslStatus(string $domain): array
    {
        $domain = $this->normalizeDomain($domain);
        $result = [
            'valid' => false,
            'issuer' => null,
            'expires_at' => null,
            'error' => null,
        ];

        try {
            $streamContext = stream_context_create([
                'ssl' => [
                    'capture_peer_cert' => true,
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ]);

            $client = @stream_socket_client(
                "ssl://{$domain}:443",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $streamContext
            );

            if ($client) {
                $params = stream_context_get_params($client);
                $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate'] ?? null);

                if ($cert) {
                    $result['valid'] = true;
                    $result['issuer'] = $cert['issuer']['O'] ?? 'Unknown';
                    $result['expires_at'] = date('Y-m-d H:i:s', $cert['validTo_time_t']);
                }

                fclose($client);
            }
        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
        }

        return $result;
    }

    /**
     * Check if a domain is already in use.
     */
    protected function isDomainInUse(string $domain, ?int $excludeTenantId = null): bool
    {
        $query = Tenant::withTrashed()
            ->where(function ($q) use ($domain) {
                $q->where('primary_domain', $domain)
                  ->orWhereJsonContains('custom_domains', $domain);
            });

        if ($excludeTenantId) {
            $query->where('id', '!=', $excludeTenantId);
        }

        return $query->exists();
    }

    /**
     * Normalize domain name.
     */
    protected function normalizeDomain(string $domain): string
    {
        $domain = strtolower(trim($domain));
        $domain = preg_replace('/^(https?:\/\/)?/', '', $domain);
        $domain = rtrim($domain, '/');

        return $domain;
    }

    /**
     * Get all domains for a tenant.
     */
    public function getAllDomains(Tenant $tenant): array
    {
        $domains = [];

        // Subdomain
        $domains[] = [
            'domain' => "{$tenant->slug}.{$this->getBaseDomain()}",
            'type' => 'subdomain',
            'is_primary' => empty($tenant->primary_domain),
            'status' => [
                'dns' => 'active',
                'ssl' => 'active',
            ],
        ];

        // Primary custom domain
        if ($tenant->primary_domain) {
            $status = $tenant->domain_status[$tenant->primary_domain] ?? [];
            $domains[] = [
                'domain' => $tenant->primary_domain,
                'type' => 'custom',
                'is_primary' => true,
                'status' => [
                    'dns' => $status['dns'] ?? 'pending',
                    'ssl' => $status['ssl'] ?? 'pending',
                ],
            ];
        }

        // Additional custom domains
        foreach ($tenant->custom_domains ?? [] as $customDomain) {
            if ($customDomain === $tenant->primary_domain) {
                continue;
            }

            $status = $tenant->domain_status[$customDomain] ?? [];
            $domains[] = [
                'domain' => $customDomain,
                'type' => 'custom',
                'is_primary' => false,
                'status' => [
                    'dns' => $status['dns'] ?? 'pending',
                    'ssl' => $status['ssl'] ?? 'pending',
                ],
            ];
        }

        return $domains;
    }
}
