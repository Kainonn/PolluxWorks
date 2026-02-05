import { Head, Link, router, usePage } from '@inertiajs/react';
import { Copy, Edit, MoreHorizontal, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TenantLayout from '@/layouts/tenant-layout';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
    is_system: boolean;
    users_count: number;
    permissions_count: number;
    created_at: string;
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    roles: {
        data: Role[];
    };
    filters: {
        search?: string;
        per_page?: string;
    };
}

export default function TenantRolesIndex({ tenant, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const handleSearch = () => {
        router.get('/roles', { ...filters, search }, { preserveState: true });
    };

    const handleDelete = (roleId: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(`/roles/${roleId}`);
        }
    };

    const handleDuplicate = (roleId: number) => {
        router.post(`/roles/${roleId}/duplicate`);
    };

    const rolesData = Array.isArray(roles) ? roles : roles.data || [];

    return (
        <TenantLayout tenant={tenant} breadcrumbs={[{ title: 'Roles', href: '/roles' }]}>
            <Head title={`Roles - ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
                        <p className="text-muted-foreground">Manage roles and permissions for your team</p>
                    </div>
                    <Button asChild>
                        <Link href="/roles/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Link>
                    </Button>
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

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search roles..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" onClick={handleSearch}>
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Roles</CardTitle>
                        <CardDescription>A list of all roles in your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rolesData.length > 0 ? (
                                    rolesData.map((role) => (
                                        <TableRow key={role.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                                        <Shield className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{role.display_name}</p>
                                                        <p className="text-xs text-muted-foreground">{role.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-muted-foreground">
                                                {role.description || '-'}
                                            </TableCell>
                                            <TableCell>{role.users_count}</TableCell>
                                            <TableCell>{role.permissions_count}</TableCell>
                                            <TableCell>
                                                {role.is_system ? (
                                                    <Badge variant="secondary">System</Badge>
                                                ) : (
                                                    <Badge variant="outline">Custom</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/roles/${role.id}`}>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {!role.is_system && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/roles/${role.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleDuplicate(role.id)}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        {!role.is_system && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDelete(role.id)}
                                                                    disabled={role.users_count > 0}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No roles found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TenantLayout>
    );
}
