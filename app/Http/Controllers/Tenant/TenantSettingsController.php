<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TenantSettingsController extends Controller
{
    /**
     * Display all settings grouped.
     */
    public function index()
    {
        $settings = TenantSetting::all()
            ->groupBy('group')
            ->map(function ($items) {
                return $items->mapWithKeys(fn($item) => [$item->key => $item->value]);
            });

        $tenant = app('tenant');

        return Inertia::render('tenant/settings/index', [
            'settings' => $settings,
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
                'domain' => $tenant->custom_domain ?? null,
                'plan' => $tenant->plan?->only(['name', 'display_name']),
            ],
        ]);
    }

    /**
     * Update general settings.
     */
    public function updateGeneral(Request $request)
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:50'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_website' => ['nullable', 'url', 'max:255'],
            'timezone' => ['required', 'string', 'timezone'],
            'date_format' => ['required', 'string', 'max:50'],
            'time_format' => ['required', 'string', 'max:50'],
        ]);

        foreach ($validated as $key => $value) {
            TenantSetting::set($key, $value, 'general');
        }

        $this->clearSettingsCache();

        return back()->with('success', 'General settings updated.');
    }

    /**
     * Update branding settings.
     */
    public function updateBranding(Request $request)
    {
        $validated = $request->validate([
            'primary_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'dark_mode' => ['boolean'],
        ]);

        foreach ($validated as $key => $value) {
            TenantSetting::set($key, $value, 'branding');
        }

        $this->clearSettingsCache();

        return back()->with('success', 'Branding settings updated.');
    }

    /**
     * Update notification settings.
     */
    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'email_notifications' => ['boolean'],
            'slack_notifications' => ['boolean'],
            'slack_webhook_url' => ['nullable', 'url', 'max:500'],
            'notify_new_user' => ['boolean'],
            'notify_user_login' => ['boolean'],
            'notify_data_export' => ['boolean'],
            'daily_summary' => ['boolean'],
            'weekly_summary' => ['boolean'],
        ]);

        foreach ($validated as $key => $value) {
            TenantSetting::set($key, $value, 'notifications');
        }

        $this->clearSettingsCache();

        return back()->with('success', 'Notification settings updated.');
    }

    /**
     * Update security settings.
     */
    public function updateSecurity(Request $request)
    {
        $validated = $request->validate([
            'password_min_length' => ['required', 'integer', 'min:8', 'max:128'],
            'password_require_uppercase' => ['boolean'],
            'password_require_numbers' => ['boolean'],
            'password_require_symbols' => ['boolean'],
            'session_timeout' => ['required', 'integer', 'min:5', 'max:1440'], // 5 min to 24 hours
            'max_login_attempts' => ['required', 'integer', 'min:3', 'max:20'],
            'lockout_duration' => ['required', 'integer', 'min:1', 'max:1440'], // 1 min to 24 hours
            'two_factor_required' => ['boolean'],
            'ip_whitelist' => ['nullable', 'string', 'max:2000'],
        ]);

        foreach ($validated as $key => $value) {
            TenantSetting::set($key, $value, 'security');
        }

        $this->clearSettingsCache();

        return back()->with('success', 'Security settings updated.');
    }

    /**
     * Update locale settings.
     */
    public function updateLocale(Request $request)
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:en,es,fr,de,pt,it'],
            'currency' => ['required', 'string', 'size:3'],
            'currency_symbol' => ['required', 'string', 'max:5'],
            'number_format' => ['required', 'string', 'in:1,234.56,1.234,56,1 234.56,1 234,56'],
        ]);

        foreach ($validated as $key => $value) {
            TenantSetting::set($key, $value, 'locale');
        }

        $this->clearSettingsCache();

        return back()->with('success', 'Locale settings updated.');
    }

    /**
     * Upload logo.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,svg,webp', 'max:2048'],
        ]);

        $tenant = app('tenant');

        // Store the logo
        $path = $request->file('logo')->store("tenants/{$tenant->slug}/logos", 'public');

        // Update tenant
        $tenant->update(['logo_url' => $path]);

        return back()->with('success', 'Logo uploaded successfully.');
    }

    /**
     * Remove logo.
     */
    public function removeLogo()
    {
        $tenant = app('tenant');

        if ($tenant->logo_url) {
            Storage::disk('public')->delete($tenant->logo_url);
            $tenant->update(['logo_url' => null]);
        }

        return back()->with('success', 'Logo removed.');
    }

    /**
     * Get all settings as JSON (for API).
     */
    public function getSettings()
    {
        $settings = TenantSetting::all()
            ->groupBy('group')
            ->map(function ($items) {
                return $items->mapWithKeys(fn($item) => [$item->key => $item->value]);
            });

        return response()->json($settings);
    }

    /**
     * Get settings by group.
     */
    public function getGroup(string $group)
    {
        $settings = TenantSetting::where('group', $group)
            ->get()
            ->mapWithKeys(fn($item) => [$item->key => $item->value]);

        return response()->json($settings);
    }

    /**
     * Clear settings cache.
     */
    protected function clearSettingsCache(): void
    {
        $tenant = app('tenant');
        Cache::forget("tenant.{$tenant->id}.settings");
    }
}
