import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TenantLayout from '@/layouts/tenant-layout';

interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    roles: Array<{ id: number; name: string; display_name: string }>;
}

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    users: {
        data: User[];
        meta?: {
            current_page: number;
            last_page: number;
            total: number;
        };
    };
    roles: Array<{ id: number; name: string; display_name: string }>;
    filters: {
        search?: string;
        role?: string;
        active?: string;
        per_page?: string;
    };
    limits: {
        seats_used: number;
        seats_limit: number;
        can_create: boolean;
    };
}

export default function TenantUsersIndex({ tenant, users, roles, filters, limits }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const handleSearch = () => {
        router.get('/users', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get('/users', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleToggleActive = (userId: number) => {
        router.post(`/users/${userId}/toggle-active`, {}, { preserveState: true });
    };

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/users/${userId}`);
        }
    };

    const usersData = useMemo(() => {
        return Array.isArray(users) ? users : users.data || [];
    }, [users]);

    return (
        <TenantLayout tenant={tenant} breadcrumbs={[{ title: 'Users', href: '/users' }]}>
            <Head title={`Users - ${tenant.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                        <p className="text-muted-foreground">
                            Manage your team members and their access
                            {limits.seats_limit !== -1 && (
                                <span className="ml-2">
                                    ({limits.seats_used} / {limits.seats_limit} seats used)
                                </span>
                            )}
                        </p>
                    </div>
                    <Button asChild disabled={!limits.can_create}>
                        <Link href="/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
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

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-1 items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
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

                            <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All roles</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.name}>
                                            {role.display_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.active ?? 'all'} onValueChange={(value) => handleFilterChange('active', value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="All status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All status</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>A list of all users in your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersData.length > 0 ? (
                                    usersData.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role: User['roles'][number]) => (
                                                        <Badge key={role.id} variant="secondary">
                                                            {role.display_name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.last_login_at
                                                    ? new Date(user.last_login_at).toLocaleDateString()
                                                    : 'Never'}
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
                                                            <Link href={`/users/${user.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                                                            {user.is_active ? (
                                                                <>
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No users found.
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
