import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    Filter,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    User as UserIcon,
    Users,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    SlidersHorizontal,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    const [showFilters, setShowFilters] = useState(
        !!(filters.search || filters.status)
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        router.get('/users', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        router.get('/users');
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

    const hasActiveFilters = filters.search || filters.status;

    // Stats calculations
    const verifiedCount = users.data.filter((u) => u.email_verified_at).length;
    const unverifiedCount = users.data.length - verifiedCount;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Users
                        </h1>
                        <p className="text-muted-foreground">
                            Manage system users and their permissions
                        </p>
                    </div>
                    <Link href="/users/create">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New User
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Users
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {users.total}
                                    </p>
                                </div>
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Verified
                                    </p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {verifiedCount}
                                    </p>
                                </div>
                                <div className="rounded-full bg-green-500/10 p-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Pending
                                    </p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {unverifiedCount}
                                    </p>
                                </div>
                                <div className="rounded-full bg-orange-500/10 p-3">
                                    <XCircle className="h-5 w-5 text-orange-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Card */}
                <Card>
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    User List
                                </CardTitle>
                                <CardDescription>
                                    Showing {users.from || 0} to {users.to || 0}{' '}
                                    of {users.total} users
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <form
                                    onSubmit={handleSearch}
                                    className="relative"
                                >
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="w-full pl-10 sm:w-62.5"
                                    />
                                </form>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={
                                                    showFilters
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                size="icon"
                                                onClick={() =>
                                                    setShowFilters(!showFilters)
                                                }
                                                className="relative"
                                            >
                                                <SlidersHorizontal className="h-4 w-4" />
                                                {hasActiveFilters && (
                                                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Toggle filters</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border bg-background p-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Filters:
                                    </span>
                                </div>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(value);
                                    }}
                                >
                                    <SelectTrigger className="w-37.5">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="verified">
                                            Verified
                                        </SelectItem>
                                        <SelectItem value="unverified">
                                            Unverified
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={applyFilters}
                                    size="sm"
                                    className="ml-auto"
                                >
                                    Apply
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <X className="mr-1 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="rounded-full bg-muted p-4">
                                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">
                                    No users found
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {hasActiveFilters
                                        ? 'Try adjusting your filters'
                                        : 'Get started by creating a new user'}
                                </p>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="mt-4"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="w-75">
                                            User
                                        </TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-center">
                                            Status
                                        </TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-17.5 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="group"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                        <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                                                            {getInitials(
                                                                user.name
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <Link
                                                            href={`/users/${user.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: #{user.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.email_verified_at ? (
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
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/users/${user.id}`}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/users/${user.id}/edit`}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit User
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() =>
                                                                setDeleteUser(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {users.current_page} of{' '}
                                    {users.last_page}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={users.current_page === 1}
                                        onClick={() =>
                                            router.get(
                                                `/users?page=1${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={users.current_page === 1}
                                        onClick={() =>
                                            router.get(
                                                `/users?page=${users.current_page - 1}${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {users.links
                                        .slice(1, -1)
                                        .map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    link.url &&
                                                    router.get(link.url)
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={
                                            users.current_page ===
                                            users.last_page
                                        }
                                        onClick={() =>
                                            router.get(
                                                `/users?page=${users.current_page + 1}${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={
                                            users.current_page ===
                                            users.last_page
                                        }
                                        onClick={() =>
                                            router.get(
                                                `/users?page=${users.last_page}${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Dialog */}
            <Dialog
                open={!!deleteUser}
                onOpenChange={() => setDeleteUser(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">
                                {deleteUser?.name}
                            </span>
                            ? This action cannot be undone.
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
