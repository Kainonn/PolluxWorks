import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TenantLayout from '@/layouts/tenant-layout';
import { Switch } from '@/components/ui/switch';

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    department: string | null;
    is_active: boolean;
    roles: Role[];
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    user: User;
    roles: Role[];
}

export default function TenantUsersEdit({ tenant, user, roles }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        department: user.department || '',
        is_active: user.is_active,
        roles: user.roles.map((r) => r.id),
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        put(`/users/${user.id}`);
    }

    function toggleRole(roleId: number) {
        setData('roles', data.roles.includes(roleId)
            ? data.roles.filter((id) => id !== roleId)
            : [...data.roles, roleId]
        );
    }

    return (
        <TenantLayout
            tenant={tenant}
            breadcrumbs={[
                { title: 'Users', href: '/users' },
                { title: user.name, href: `/users/${user.id}` },
                { title: 'Edit', href: `/users/${user.id}/edit` }
            ]}
        >
            <Head title={`Edit ${user.name} - ${tenant.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
                        <p className="text-muted-foreground">Update user information and permissions</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                            <CardDescription>Basic information about the user</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="john@example.com"
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Leave blank to keep current"
                                    />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+1 234 567 8900"
                                    />
                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="job_title">Job Title</Label>
                                    <Input
                                        id="job_title"
                                        value={data.job_title}
                                        onChange={(e) => setData('job_title', e.target.value)}
                                        placeholder="Developer"
                                    />
                                    {errors.job_title && <p className="text-sm text-red-500">{errors.job_title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                        placeholder="Engineering"
                                    />
                                    {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label htmlFor="is_active">Account Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {data.is_active ? 'User can log in and access the system' : 'User cannot log in'}
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>Assign roles to define user permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.roles.includes(role.id)}
                                            onCheckedChange={() => toggleRole(role.id)}
                                        />
                                        <Label
                                            htmlFor={`role-${role.id}`}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {role.display_name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && <p className="mt-2 text-sm text-red-500">{errors.roles}</p>}
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </TenantLayout>
    );
}
