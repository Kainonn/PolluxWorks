/**
 * Normalized routes - wraps Wayfinder routes to use relative URLs
 * This file provides route helpers that work correctly regardless of port
 */

// Helper function to normalize URLs (remove //domain prefix)
const normalizeUrl = (url: string): string => {
    if (url.startsWith('//')) {
        const match = url.match(/^\/\/[^\/]+(\/.*)?$/);
        if (match) {
            return match[1] || '/';
        }
    }
    return url;
};

// Re-export commonly used routes with normalized URLs
export const routes = {
    home: () => '/',
    login: () => '/login',
    logout: () => '/logout',
    register: () => '/register',
    dashboard: () => '/dashboard',
    forgotPassword: () => '/forgot-password',
    resetPassword: (token: string) => `/reset-password/${token}`,
    verifyEmail: () => '/email/verify',
    profile: () => '/settings/profile',
    password: () => '/settings/password',
    appearance: () => '/settings/appearance',

    // Master admin routes
    users: {
        index: () => '/users',
        create: () => '/users/create',
        show: (id: number | string) => `/users/${id}`,
        edit: (id: number | string) => `/users/${id}/edit`,
    },
    roles: {
        index: () => '/roles',
        create: () => '/roles/create',
        show: (id: number | string) => `/roles/${id}`,
        edit: (id: number | string) => `/roles/${id}/edit`,
    },
    plans: {
        index: () => '/plans',
        create: () => '/plans/create',
        show: (id: number | string) => `/plans/${id}`,
        edit: (id: number | string) => `/plans/${id}/edit`,
    },
    tenants: {
        index: () => '/tenants',
        create: () => '/tenants/create',
        show: (id: number | string) => `/tenants/${id}`,
        edit: (id: number | string) => `/tenants/${id}/edit`,
    },
    subscriptions: {
        index: () => '/subscriptions',
        show: (id: number | string) => `/subscriptions/${id}`,
        edit: (id: number | string) => `/subscriptions/${id}/edit`,
    },
    systemLogs: {
        index: () => '/system-logs',
        show: (id: number | string) => `/system-logs/${id}`,
    },
    auditEntries: {
        index: () => '/audit-entries',
        show: (id: number | string) => `/audit-entries/${id}`,
    },
};

export default routes;
