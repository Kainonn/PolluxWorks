<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class TenantWelcomeController extends Controller
{
    /**
     * Show tenant welcome/landing page.
     */
    public function index()
    {
        $tenant = app('tenant');

        return Inertia::render('tenant/welcome', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ],
        ]);
    }
}
