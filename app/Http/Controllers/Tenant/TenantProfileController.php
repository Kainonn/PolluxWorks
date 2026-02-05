<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class TenantProfileController extends Controller
{
    /**
     * Get the authenticated tenant user.
     */
    protected function user(): TenantUser
    {
        /** @var TenantUser $user */
        $user = Auth::guard('tenant')->user();
        return $user;
    }

    /**
     * Display the user's profile.
     */
    public function show()
    {
        $tenant = app('tenant');
        $user = $this->user();
        $user->load('roles:id,name,display_name');

        return Inertia::render('tenant/profile/show', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
            'user' => $user,
            'sessions' => $this->getActiveSessions(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $user = $this->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tenant.users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request)
    {
        $user = $this->user();

        $validated = $request->validate([
            'current_password' => ['required', 'current_password:tenant'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }

    /**
     * Upload avatar.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        $user = $this->user();
        $tenant = app('tenant');

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store("tenants/{$tenant->slug}/avatars", 'public');

        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar uploaded successfully.');
    }

    /**
     * Remove avatar.
     */
    public function removeAvatar()
    {
        $user = $this->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return back()->with('success', 'Avatar removed.');
    }

    /**
     * Enable two-factor authentication.
     */
    public function enableTwoFactor(Request $request)
    {
        $user = $this->user();

        // Generate secret key
        $google2fa = new \PragmaRX\Google2FA\Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user->update([
            'two_factor_secret' => encrypt($secret),
        ]);

        return back()->with([
            'two_factor_secret' => $secret,
            'two_factor_qr' => $google2fa->getQRCodeUrl(
                config('app.name'),
                $user->email,
                $secret
            ),
        ]);
    }

    /**
     * Confirm two-factor authentication.
     */
    public function confirmTwoFactor(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $this->user();
        $google2fa = new \PragmaRX\Google2FA\Google2FA();

        $secret = decrypt($user->two_factor_secret);
        $valid = $google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            return back()->withErrors(['code' => 'The code is invalid.']);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
        ]);

        // Generate recovery codes
        $recoveryCodes = collect(range(1, 8))->map(fn() => Str::random(10))->all();
        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return back()->with([
            'success' => 'Two-factor authentication enabled.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Disable two-factor authentication.
     */
    public function disableTwoFactor(Request $request)
    {
        $request->validate([
            'password' => ['required', 'current_password:tenant'],
        ]);

        $user = $this->user();

        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return back()->with('success', 'Two-factor authentication disabled.');
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes()
    {
        $user = $this->user();

        if (!$user->two_factor_confirmed_at) {
            return back()->withErrors(['error' => 'Two-factor is not enabled.']);
        }

        $recoveryCodes = collect(range(1, 8))->map(fn() => Str::random(10))->all();
        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return back()->with([
            'success' => 'Recovery codes regenerated.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'password' => ['required', 'current_password:tenant'],
        ]);

        $user = $this->user();

        // Logout
        Auth::guard('tenant')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Soft delete
        $user->delete();

        return redirect()->route('tenant.welcome')
            ->with('success', 'Your account has been deleted.');
    }

    /**
     * Get active sessions for current user.
     */
    protected function getActiveSessions(): array
    {
        // This would typically query a sessions table
        // For now, return mock data
        return [
            [
                'device' => 'Current Device',
                'ip' => request()->ip(),
                'last_activity' => now()->toIso8601String(),
                'is_current' => true,
            ],
        ];
    }

    /**
     * Logout other browser sessions.
     */
    public function logoutOtherSessions(Request $request)
    {
        $request->validate([
            'password' => ['required', 'current_password:tenant'],
        ]);

        // Invalidate other sessions
        // This would typically update session tokens in database

        return back()->with('success', 'Other sessions logged out.');
    }
}
