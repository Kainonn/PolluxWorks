import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    User as UserIcon,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedUsers {
    data: User[];
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
    users: PaginatedUsers;
    filters: {
        search?: string;
        status?: string;
        per_page?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

export default function Index({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const applyFilters = (params: Record<string, string> = {}) => {
        const newParams: Record<string, string> = { ...params };
        if (search && !('search' in params)) newParams.search = search;
        if (statusFilter && statusFilter !== 'all' && !('status' in params)) {
            newParams.status = statusFilter;
        }
        router.get('/users', newParams, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: String(page) };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/users', params, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: Record<string, string> = { per_page: String(perPage), page: '1' };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        router.get('/users', params, { preserveState: true });
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        const params: Record<string, string> = { page: '1' };
        if (search) params.search = search;
        if (value !== 'all') params.status = value;
        if (filters.per_page) params.per_page = filters.per_page;
        router.get('/users', params, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteUser) return;

        setIsDeleting(true);
        router.delete(`/users/${deleteUser.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteUser(null);
            },
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Column definitions
    const columns: Column<User>[] = useMemo(
        () => [
            {
                key: 'user',
                header: 'User',
                headerClassName: 'w-[300px]',
                cell: (user) => (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-primary/10 text-sm font-medium">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <Link
                                href={`/users/${user.id}`}
                                className="font-medium hover:text-primary hover:underline"
                            >
                                {user.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                ID: #{user.id}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'email',
                header: 'Email',
                cell: (user) => (
                    <span className="text-muted-foreground">{user.email}</span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (user) =>
                    user.email_verified_at ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Verified
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="border-orange-300 text-orange-600"
                        >
                            <XCircle className="mr-1 h-3 w-3" />
                            Pending
                        </Badge>
                    ),
            },
            {
                key: 'joined',
                header: 'Joined',
                cell: (user) => (
                    <span className="text-muted-foreground">
                        {formatDate(user.created_at)}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                headerClassName: 'w-[70px]',
                className: 'text-right',
                cell: (user) => (
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
                                <Link href={`/users/${user.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/users/${user.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit User
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteUser(user)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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
                <UserIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No users found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {filters.search || filters.status
                    ? 'Try adjusting your filters'
                    : 'Get started by creating a new user'}
            </p>
        </div>
    );

    // Toolbar with filters
    const toolbar = (
        <>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 w-32.5">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Pending</SelectItem>
                </SelectContent>
            </Select>
            <Link href="/users/create">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New User
                </Button>
            </Link>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage system users and their permissions
                    </p>
                </div>

                {/* DataTable */}
                <DataTable
                    data={users.data}
                    columns={columns}
                    pagination={users}
                    searchValue={search}
                    searchPlaceholder="Search users..."
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[10, 25, 50, 100]}
                    getRowKey={(user) => user.id}
                    emptyState={emptyState}
                    toolbar={toolbar}
                    showPerPageSelector
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{deleteUser?.name}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteUser(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
