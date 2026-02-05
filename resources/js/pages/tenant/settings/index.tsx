import { Head, useForm, usePage } from '@inertiajs/react';
import { Bell, Building2, Loader2, Lock, Palette } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TenantLayout from '@/layouts/tenant-layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
    tenant: {
        name: string;
        slug: string;
        domain: string | null;
        logo: string | null;
        plan: {
            name: string;
            display_name: string;
        } | null;
    };
    settings: {
        general?: Record<string, string>;
        branding?: Record<string, string>;
        notifications?: Record<string, string | boolean>;
        security?: Record<string, string | number | boolean>;
        locale?: Record<string, string>;
    };
}

const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Mexico_City',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'UTC',
];

const dateFormats = [
    { value: 'Y-m-d', label: '2024-01-15' },
    { value: 'd/m/Y', label: '15/01/2024' },
    { value: 'm/d/Y', label: '01/15/2024' },
    { value: 'd-m-Y', label: '15-01-2024' },
    { value: 'F j, Y', label: 'January 15, 2024' },
];

const timeFormats = [
    { value: 'H:i', label: '14:30 (24h)' },
    { value: 'h:i A', label: '2:30 PM (12h)' },
];

export default function TenantSettingsIndex({ tenant, settings }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    // General Settings Form
    const generalForm = useForm({
        company_name: settings.general?.company_name || tenant.name,
        company_email: settings.general?.company_email || '',
        company_phone: settings.general?.company_phone || '',
        company_address: settings.general?.company_address || '',
        company_website: settings.general?.company_website || '',
        timezone: settings.general?.timezone || 'UTC',
        date_format: settings.general?.date_format || 'Y-m-d',
        time_format: settings.general?.time_format || 'H:i',
    });

    // Branding Settings Form
    const brandingForm = useForm({
        primary_color: settings.branding?.primary_color || '#3b82f6',
        secondary_color: settings.branding?.secondary_color || '#64748b',
        accent_color: settings.branding?.accent_color || '#f59e0b',
        dark_mode: settings.branding?.dark_mode === 'true',
    });

    // Notification Settings Form
    const notificationForm = useForm({
        email_notifications: settings.notifications?.email_notifications !== false,
        slack_notifications: settings.notifications?.slack_notifications === true,
        slack_webhook_url: settings.notifications?.slack_webhook_url || '',
        notify_new_user: settings.notifications?.notify_new_user !== false,
        notify_user_login: settings.notifications?.notify_user_login === true,
        notify_data_export: settings.notifications?.notify_data_export !== false,
        daily_summary: settings.notifications?.daily_summary === true,
        weekly_summary: settings.notifications?.weekly_summary !== false,
    });

    // Security Settings Form
    const securityForm = useForm({
        password_min_length: Number(settings.security?.password_min_length) || 8,
        password_require_uppercase: settings.security?.password_require_uppercase !== false,
        password_require_numbers: settings.security?.password_require_numbers !== false,
        password_require_symbols: settings.security?.password_require_symbols === true,
        session_timeout: Number(settings.security?.session_timeout) || 60,
        max_login_attempts: Number(settings.security?.max_login_attempts) || 5,
        lockout_duration: Number(settings.security?.lockout_duration) || 15,
        two_factor_required: settings.security?.two_factor_required === true,
        ip_whitelist: settings.security?.ip_whitelist || '',
    });

    const handleGeneralSubmit = (e: FormEvent) => {
        e.preventDefault();
        generalForm.put('/settings/general');
    };

    const handleBrandingSubmit = (e: FormEvent) => {
        e.preventDefault();
        brandingForm.put('/settings/branding');
    };

    const handleNotificationSubmit = (e: FormEvent) => {
        e.preventDefault();
        notificationForm.put('/settings/notifications');
    };

    const handleSecuritySubmit = (e: FormEvent) => {
        e.preventDefault();
        securityForm.put('/settings/security');
    };

    return (
        <TenantLayout tenant={tenant} breadcrumbs={[{ title: 'Settings', href: '/settings' }]}>
            <Head title={`Settings - ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your workspace settings and preferences</p>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="hidden sm:inline">General</span>
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            <span className="hidden sm:inline">Branding</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Notifications</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="hidden sm:inline">Security</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general">
                        <form onSubmit={handleGeneralSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>Basic information about your organization</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name">Company Name</Label>
                                            <Input
                                                id="company_name"
                                                value={generalForm.data.company_name}
                                                onChange={(e) => generalForm.setData('company_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company_email">Contact Email</Label>
                                            <Input
                                                id="company_email"
                                                type="email"
                                                value={generalForm.data.company_email}
                                                onChange={(e) => generalForm.setData('company_email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_phone">Phone</Label>
                                            <Input
                                                id="company_phone"
                                                value={generalForm.data.company_phone}
                                                onChange={(e) => generalForm.setData('company_phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company_website">Website</Label>
                                            <Input
                                                id="company_website"
                                                type="url"
                                                value={generalForm.data.company_website}
                                                onChange={(e) => generalForm.setData('company_website', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company_address">Address</Label>
                                        <Input
                                            id="company_address"
                                            value={generalForm.data.company_address}
                                            onChange={(e) => generalForm.setData('company_address', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select
                                                value={generalForm.data.timezone}
                                                onValueChange={(value) => generalForm.setData('timezone', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timezones.map((tz) => (
                                                        <SelectItem key={tz} value={tz}>
                                                            {tz}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date_format">Date Format</Label>
                                            <Select
                                                value={generalForm.data.date_format}
                                                onValueChange={(value) => generalForm.setData('date_format', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dateFormats.map((format) => (
                                                        <SelectItem key={format.value} value={format.value}>
                                                            {format.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="time_format">Time Format</Label>
                                            <Select
                                                value={generalForm.data.time_format}
                                                onValueChange={(value) => generalForm.setData('time_format', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timeFormats.map((format) => (
                                                        <SelectItem key={format.value} value={format.value}>
                                                            {format.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={generalForm.processing}>
                                            {generalForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </TabsContent>

                    {/* Branding Settings */}
                    <TabsContent value="branding">
                        <form onSubmit={handleBrandingSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Branding Settings</CardTitle>
                                    <CardDescription>Customize the look and feel of your workspace</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="primary_color">Primary Color</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="primary_color"
                                                    type="color"
                                                    value={brandingForm.data.primary_color}
                                                    onChange={(e) => brandingForm.setData('primary_color', e.target.value)}
                                                    className="h-10 w-14 cursor-pointer p-1"
                                                />
                                                <Input
                                                    value={brandingForm.data.primary_color}
                                                    onChange={(e) => brandingForm.setData('primary_color', e.target.value)}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="secondary_color">Secondary Color</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="secondary_color"
                                                    type="color"
                                                    value={brandingForm.data.secondary_color}
                                                    onChange={(e) => brandingForm.setData('secondary_color', e.target.value)}
                                                    className="h-10 w-14 cursor-pointer p-1"
                                                />
                                                <Input
                                                    value={brandingForm.data.secondary_color}
                                                    onChange={(e) => brandingForm.setData('secondary_color', e.target.value)}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accent_color">Accent Color</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="accent_color"
                                                    type="color"
                                                    value={brandingForm.data.accent_color}
                                                    onChange={(e) => brandingForm.setData('accent_color', e.target.value)}
                                                    className="h-10 w-14 cursor-pointer p-1"
                                                />
                                                <Input
                                                    value={brandingForm.data.accent_color}
                                                    onChange={(e) => brandingForm.setData('accent_color', e.target.value)}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="dark_mode">Default to Dark Mode</Label>
                                            <p className="text-sm text-muted-foreground">Use dark theme by default for all users</p>
                                        </div>
                                        <Switch
                                            id="dark_mode"
                                            checked={brandingForm.data.dark_mode}
                                            onCheckedChange={(checked) => brandingForm.setData('dark_mode', checked)}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={brandingForm.processing}>
                                            {brandingForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </TabsContent>

                    {/* Notification Settings */}
                    <TabsContent value="notifications">
                        <form onSubmit={handleNotificationSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Settings</CardTitle>
                                    <CardDescription>Configure how and when you receive notifications</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={notificationForm.data.email_notifications}
                                                onCheckedChange={(checked) => notificationForm.setData('email_notifications', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Daily Summary</Label>
                                                <p className="text-sm text-muted-foreground">Receive a daily activity summary</p>
                                            </div>
                                            <Switch
                                                checked={notificationForm.data.daily_summary}
                                                onCheckedChange={(checked) => notificationForm.setData('daily_summary', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Weekly Summary</Label>
                                                <p className="text-sm text-muted-foreground">Receive a weekly activity summary</p>
                                            </div>
                                            <Switch
                                                checked={notificationForm.data.weekly_summary}
                                                onCheckedChange={(checked) => notificationForm.setData('weekly_summary', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>New User Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Notify admins when new users are added</p>
                                            </div>
                                            <Switch
                                                checked={notificationForm.data.notify_new_user}
                                                onCheckedChange={(checked) => notificationForm.setData('notify_new_user', checked)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={notificationForm.processing}>
                                            {notificationForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security">
                        <form onSubmit={handleSecuritySubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Configure security policies for your workspace</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password_min_length">Minimum Password Length</Label>
                                            <Input
                                                id="password_min_length"
                                                type="number"
                                                min={8}
                                                max={128}
                                                value={securityForm.data.password_min_length}
                                                onChange={(e) => securityForm.setData('password_min_length', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                                            <Input
                                                id="session_timeout"
                                                type="number"
                                                min={5}
                                                max={1440}
                                                value={securityForm.data.session_timeout}
                                                onChange={(e) => securityForm.setData('session_timeout', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                                            <Input
                                                id="max_login_attempts"
                                                type="number"
                                                min={3}
                                                max={20}
                                                value={securityForm.data.max_login_attempts}
                                                onChange={(e) => securityForm.setData('max_login_attempts', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                                            <Input
                                                id="lockout_duration"
                                                type="number"
                                                min={1}
                                                max={1440}
                                                value={securityForm.data.lockout_duration}
                                                onChange={(e) => securityForm.setData('lockout_duration', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Require Uppercase</Label>
                                                <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                                            </div>
                                            <Switch
                                                checked={securityForm.data.password_require_uppercase}
                                                onCheckedChange={(checked) => securityForm.setData('password_require_uppercase', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Require Numbers</Label>
                                                <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                                            </div>
                                            <Switch
                                                checked={securityForm.data.password_require_numbers}
                                                onCheckedChange={(checked) => securityForm.setData('password_require_numbers', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <Label>Require Two-Factor Authentication</Label>
                                                <p className="text-sm text-muted-foreground">All users must enable 2FA</p>
                                            </div>
                                            <Switch
                                                checked={securityForm.data.two_factor_required}
                                                onCheckedChange={(checked) => securityForm.setData('two_factor_required', checked)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={securityForm.processing}>
                                            {securityForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </TenantLayout>
    );
}
