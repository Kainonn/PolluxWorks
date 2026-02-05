<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TenantAuthController extends Controller
{
    /**
     * Show login page.
     */
    public function showLogin()
    {
        $tenant = app('tenant');

        return Inertia::render('tenant/auth/login', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url,
            ],
        ]);
    }

    /**
     * Handle login request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Debug: Log connection info
        Log::info('Tenant Login Attempt', [
            'email' => $credentials['email'],
            'tenant' => app()->bound('tenant') ? app('tenant')->slug : 'NOT SET',
            'connection' => config('database.connections.tenant.database', 'NOT SET'),
        ]);

        $user = TenantUser::where('email', $credentials['email'])->first();

        Log::info('User lookup', [
            'found' => $user ? true : false,
            'user_id' => $user?->id,
            'password_hash' => $user ? substr($user->password, 0, 20) . '...' : null,
        ]);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            Log::info('Hash check failed', [
                'user_exists' => $user ? true : false,
                'hash_result' => $user ? Hash::check($credentials['password'], $user->password) : 'no user',
            ]);
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        // Log in the user with tenant guard
        Auth::guard('tenant')->login($user, $request->boolean('remember'));

        // Record login
        $user->recordLogin($request->ip());

        $request->session()->regenerate();

        return redirect()->intended(route('tenant.dashboard'));
    }

    /**
     * Handle logout request.
     */
    public function logout(Request $request)
    {
        Auth::guard('tenant')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('tenant.login');
    }

    /**
     * Show forgot password page.
     */
    public function showForgotPassword()
    {
        return Inertia::render('tenant/auth/forgot-password');
    }

    /**
     * Handle forgot password request.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // TODO: Implement password reset logic
        // This would typically send an email with a reset link

        return back()->with('status', 'If an account with that email exists, a password reset link has been sent.');
    }
}
