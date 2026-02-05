import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Role {
    id: number;
    name: string;
    description: string | null;
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedRoles {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    roles: PaginatedRoles;
    filters: {
        search?: string;
        per_page?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

export default function Index({ roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteRole, setDeleteRole] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/roles', params, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/roles', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        router.get('/roles', params, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteRole) return;

        setIsDeleting(true);
        router.delete(`/roles/${deleteRole.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteRole(null);
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Column definitions
    const columns: Column<Role>[] = useMemo(
        () => [
            {
                key: 'role',
                header: 'Role',
                headerClassName: 'w-56',
                cell: (role) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <Link
                                href={`/roles/${role.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {role.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                ID: #{role.id}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'description',
                header: 'Description',
                cell: (role) => (
                    <span className="text-muted-foreground">
                        {role.description || (
                            <span className="italic text-muted-foreground/50">
                                No description
                            </span>
                        )}
                    </span>
                ),
            },
            {
                key: 'users',
                header: 'Users',
                headerClassName: 'text-center w-32',
                className: 'text-center',
                cell: (role) => (
                    <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {role.users_count}
                    </Badge>
                ),
            },
            {
                key: 'created',
                header: 'Created',
                headerClassName: 'w-32',
                cell: (role) => (
                    <span className="text-muted-foreground">
                        {formatDate(role.created_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-17.5',
                className: 'text-right',
                cell: (role) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/roles/${role.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/roles/${role.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Role
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteRole(role)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Role
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    // Empty state component
    const emptyState = (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-3">
                <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No roles found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {filters.search
                    ? 'Try adjusting your search'
                    : 'Get started by creating a new role'}
            </p>
        </div>
    );

    // Toolbar with create button
    const toolbar = (
        <Link href="/roles/create">
            <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Role
            </Button>
        </Link>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground">
                        Manage system roles and permissions
                    </p>
                </div>

                {/* DataTable */}
                <DataTable
                    data={roles.data}
                    columns={columns}
                    pagination={roles}
                    searchValue={search}
                    searchPlaceholder="Search roles..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[10, 25, 50, 100]}
                    getRowKey={(role) => role.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Role
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteRole?.name}</span>?
                            This action cannot be undone and will remove the role from
                            all assigned users.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteRole(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
