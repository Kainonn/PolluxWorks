import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    Filter,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    Users,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
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
    const [showFilters, setShowFilters] = useState(!!filters.search);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        router.get('/roles', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/roles');
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

    const hasActiveFilters = !!filters.search;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Roles
                        </h1>
                        <p className="text-muted-foreground">
                            Manage system roles and permissions
                        </p>
                    </div>
                    <Link href="/roles/create">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New Role
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Roles
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {roles.total}
                                    </p>
                                </div>
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Assigned Users
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {roles.data.reduce(
                                            (acc, role) => acc + role.users_count,
                                            0
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-full bg-blue-500/10 p-3">
                                    <Users className="h-5 w-5 text-blue-500" />
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
                                    Role List
                                </CardTitle>
                                <CardDescription>
                                    Showing {roles.from || 0} to {roles.to || 0}{' '}
                                    of {roles.total} roles
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
                                        placeholder="Search roles..."
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
                        {roles.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="rounded-full bg-muted p-4">
                                    <Shield className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">
                                    No roles found
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {hasActiveFilters
                                        ? 'Try adjusting your filters'
                                        : 'Get started by creating a new role'}
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
                                        <TableHead className="w-56">
                                            Role
                                        </TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-center w-32">
                                            Users
                                        </TableHead>
                                        <TableHead className="w-32">
                                            Created
                                        </TableHead>
                                        <TableHead className="w-17.5 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.data.map((role) => (
                                        <TableRow
                                            key={role.id}
                                            className="group"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10">
                                                        <Shield className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/roles/${role.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {role.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: #{role.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {role.description || (
                                                    <span className="italic text-muted-foreground/50">
                                                        No description
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1"
                                                >
                                                    <Users className="h-3 w-3" />
                                                    {role.users_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(role.created_at)}
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
                                                                href={`/roles/${role.id}`}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/roles/${role.id}/edit`}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Role
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() =>
                                                                setDeleteRole(
                                                                    role
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Role
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
                        {roles.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {roles.current_page} of{' '}
                                    {roles.last_page}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={roles.current_page === 1}
                                        onClick={() =>
                                            router.get(
                                                `/roles?page=1${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={roles.current_page === 1}
                                        onClick={() =>
                                            router.get(
                                                `/roles?page=${roles.current_page - 1}${filters.search ? `&search=${filters.search}` : ''}`
                                            )
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {roles.links
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
                                            roles.current_page ===
                                            roles.last_page
                                        }
                                        onClick={() =>
                                            router.get(
                                                `/roles?page=${roles.current_page + 1}${filters.search ? `&search=${filters.search}` : ''}`
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
                                            roles.current_page ===
                                            roles.last_page
                                        }
                                        onClick={() =>
                                            router.get(
                                                `/roles?page=${roles.last_page}${filters.search ? `&search=${filters.search}` : ''}`
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
                open={!!deleteRole}
                onOpenChange={() => setDeleteRole(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Role
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">
                                {deleteRole?.name}
                            </span>
                            ? This action cannot be undone and will remove the
                            role from all assigned users.
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
