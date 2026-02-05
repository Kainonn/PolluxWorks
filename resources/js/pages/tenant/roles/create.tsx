import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TenantLayout from '@/layouts/tenant-layout';
import { Textarea } from '@/components/ui/textarea';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    group: string;
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    permissionGroups: Record<string, Permission[]>;
}

export default function TenantRolesCreate({ tenant, permissionGroups }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        display_name: '',
        description: '',
        permissions: [] as number[],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/roles');
    }

    function togglePermission(permissionId: number) {
        setData('permissions', data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId]
        );
    }

    function toggleGroup(groupPermissions: Permission[]) {
        const groupIds = groupPermissions.map((p) => p.id);
        const allSelected = groupIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            setData('permissions', data.permissions.filter((id) => !groupIds.includes(id)));
        } else {
            setData('permissions', [...new Set([...data.permissions, ...groupIds])]);
        }
    }

    return (
        <TenantLayout
            tenant={tenant}
            breadcrumbs={[
                { title: 'Roles', href: '/roles' },
                { title: 'Create', href: '/roles/create' }
            ]}
        >
            <Head title={`Create Role - ${tenant.name}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/roles">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Role</h1>
                        <p className="text-muted-foreground">Define a new role with specific permissions</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Information</CardTitle>
                            <CardDescription>Basic information about the role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Key *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                        placeholder="manager"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Unique identifier (lowercase, no spaces)</p>
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display Name *</Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="Manager"
                                        required
                                    />
                                    {errors.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe what this role is for..."
                                    rows={3}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                            <CardDescription>Select the permissions for this role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {Object.entries(permissionGroups).map(([group, permissions]) => {
                                    const groupIds = permissions.map((p) => p.id);
                                    const allSelected = groupIds.every((id) => data.permissions.includes(id));
                                    const someSelected = groupIds.some((id) => data.permissions.includes(id));

                                    return (
                                        <div key={group} className="rounded-lg border p-4">
                                            <div className="mb-3 flex items-center space-x-2">
                                                <Checkbox
                                                    id={`group-${group}`}
                                                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                                    onCheckedChange={() => toggleGroup(permissions)}
                                                />
                                                <Label
                                                    htmlFor={`group-${group}`}
                                                    className="text-sm font-semibold capitalize cursor-pointer"
                                                >
                                                    {group.replace(/_/g, ' ')}
                                                </Label>
                                            </div>
                                            <div className="ml-6 grid gap-2 sm:grid-cols-2">
                                                {permissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`permission-${permission.id}`}
                                                            checked={data.permissions.includes(permission.id)}
                                                            onCheckedChange={() => togglePermission(permission.id)}
                                                        />
                                                        <Label
                                                            htmlFor={`permission-${permission.id}`}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {permission.display_name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.permissions && <p className="mt-2 text-sm text-red-500">{errors.permissions}</p>}
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/roles">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Role
                        </Button>
                    </div>
                </form>
            </div>
        </TenantLayout>
    );
}
