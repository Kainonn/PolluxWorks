import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TenantLayout from '@/layouts/tenant-layout';

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    roles: Role[];
}

export default function TenantUsersCreate({ tenant, roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        job_title: '',
        department: '',
        roles: [] as number[],
        send_invite: true,
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/users');
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
                { title: 'Create', href: '/users/create' }
            ]}
        >
            <Head title={`Create User - ${tenant.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
                        <p className="text-muted-foreground">Add a new team member to your workspace</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                            <CardDescription>Basic information about the new user</CardDescription>
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
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
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

                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="send_invite"
                                    checked={data.send_invite}
                                    onCheckedChange={(checked) => setData('send_invite', checked as boolean)}
                                />
                                <Label htmlFor="send_invite" className="text-sm font-normal cursor-pointer">
                                    Send welcome email with login credentials
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </form>
            </div>
        </TenantLayout>
    );
}
