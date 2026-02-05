import { Head, useForm, usePage } from '@inertiajs/react';
import { Camera, Key, Loader2, Shield, Trash2, User } from 'lucide-react';
import type { FormEvent} from 'react';
import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import TenantLayout from '@/layouts/tenant-layout';

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    department: string | null;
    avatar: string | null;
    two_factor_confirmed_at: string | null;
    roles: Role[];
    created_at: string;
}

interface Session {
    device: string;
    ip: string;
    last_activity: string;
    is_current: boolean;
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    user: UserData;
    sessions: Session[];
}

export default function TenantProfileShow({ tenant, user, sessions }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string; recovery_codes?: string[] } };
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Profile form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        job_title: user.job_title || '',
        department: user.department || '',
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Avatar form
    const avatarForm = useForm({
        avatar: null as File | null,
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        profileForm.put('/profile');
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            avatarForm.setData('avatar', file);
            avatarForm.post('/profile/avatar');
        }
    };

    const handleRemoveAvatar = () => {
        if (confirm('Are you sure you want to remove your avatar?')) {
            avatarForm.delete('/profile/avatar');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <TenantLayout tenant={tenant} breadcrumbs={[{ title: 'Profile', href: '/profile' }]}>
            <Head title={`Profile - ${tenant.name}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences</p>
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
                {flash?.recovery_codes && (
                    <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/30">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">Recovery Codes</p>
                        <p className="mb-2 text-sm text-yellow-700 dark:text-yellow-300">
                            Save these codes in a safe place. You can use them to access your account if you lose your two-factor device.
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            {flash.recovery_codes.map((code, index) => (
                                <code key={index} className="rounded bg-yellow-100 px-2 py-1 dark:bg-yellow-800">
                                    {code}
                                </code>
                            ))}
                        </div>
                    </div>
                )}

                {/* Avatar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Avatar
                        </CardTitle>
                        <CardDescription>Your profile picture</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user.avatar ? `/storage/${user.avatar}` : undefined} />
                                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    JPG, PNG or WEBP. Max 2MB.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={avatarForm.processing}
                                    >
                                        {avatarForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Upload
                                    </Button>
                                    {user.avatar && (
                                        <Button variant="outline" size="sm" onClick={handleRemoveAvatar}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your account&apos;s profile information and email address</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        required
                                    />
                                    {profileForm.errors.name && (
                                        <p className="text-sm text-red-500">{profileForm.errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        required
                                    />
                                    {profileForm.errors.email && (
                                        <p className="text-sm text-red-500">{profileForm.errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="job_title">Job Title</Label>
                                    <Input
                                        id="job_title"
                                        value={profileForm.data.job_title}
                                        onChange={(e) => profileForm.setData('job_title', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={profileForm.data.department}
                                        onChange={(e) => profileForm.setData('department', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4" />
                                    Roles:
                                    {user.roles.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.display_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={profileForm.processing}>
                                    {profileForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Update Password
                        </CardTitle>
                        <CardDescription>Ensure your account is using a secure password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    required
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="text-sm text-red-500">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        required
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="text-sm text-red-500">{passwordForm.errors.password}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={passwordForm.processing}>
                                    {passwordForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>Add additional security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {user.two_factor_confirmed_at ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-green-600">
                                        Enabled
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Two-factor authentication is enabled
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex gap-2">
                                    <Button variant="outline" asChild>
                                        <a href="/profile/two-factor/recovery-codes">Regenerate Recovery Codes</a>
                                    </Button>
                                    <Button variant="destructive" asChild>
                                        <a href="/profile/two-factor" data-method="delete">
                                            Disable
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication.
                                </p>
                                <Button asChild>
                                    <a href="/profile/two-factor/enable" data-method="post">
                                        Enable Two-Factor Authentication
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Browser Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Browser Sessions</CardTitle>
                        <CardDescription>Manage and log out your active sessions on other browsers and devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sessions.map((session, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {session.device}
                                            {session.is_current && (
                                                <Badge variant="secondary" className="ml-2">
                                                    This device
                                                </Badge>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {session.ip} • Last active {new Date(session.last_activity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-4" />
                        <Button variant="outline" asChild>
                            <a href="/profile/sessions" data-method="delete">
                                Log Out Other Browser Sessions
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </TenantLayout>
    );
}
