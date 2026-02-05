import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Edit,
    Mail,
    MoreHorizontal,
    Shield,
    Trash2,
    User,
    Users,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
}

interface Role {
    id: number;
    name: string;
    description: string | null;
    users: UserData[];
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    role: Role;
}

export default function Show({ role }: Props) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Roles',
            href: '/roles',
        },
        {
            title: role.name,
            href: `/roles/${role.id}`,
        },
    ];

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/roles/${role.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDelete(false);
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={role.name} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/roles">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {role.name}
                                </h1>
                                <p className="text-muted-foreground">
                                    {role.description || 'No description'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/roles/${role.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Role
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setShowDelete(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Role
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Assigned Users
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {role.users_count}
                                    </p>
                                </div>
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Created
                                    </p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        {formatDate(role.created_at)}
                                    </p>
                                </div>
                                <div className="rounded-full bg-blue-500/10 p-3">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatDate(role.updated_at)}
                                    </p>
                                </div>
                                <div className="rounded-full bg-green-500/10 p-3">
                                    <Calendar className="h-5 w-5 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Role Details */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-primary" />
                                    Assigned Users
                                </CardTitle>
                                <CardDescription>
                                    Users that belong to this role
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {role.users.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="rounded-full bg-muted p-4">
                                            <User className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold">
                                            No users assigned
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Assign users to this role in the
                                            edit page
                                        </p>
                                        <Link href={`/roles/${role.id}/edit`}>
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Role
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {role.users.map((user) => (
                                                <TableRow
                                                    key={user.id}
                                                    className="group"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                                                                    {user.name
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
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
                                                                    ID: #
                                                                    {user.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Mail className="h-4 w-4" />
                                                            {user.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.email_verified_at ? (
                                                            <Badge variant="default">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link
                                                            href={`/users/${user.id}`}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Role Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Role Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Name
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {role.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </p>
                                    <p className="mt-1">
                                        {role.description || (
                                            <span className="italic text-muted-foreground">
                                                No description provided
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Role ID
                                    </p>
                                    <p className="mt-1 font-mono text-sm">
                                        #{role.id}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Timestamps
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Created At
                                    </p>
                                    <p className="mt-1">
                                        {formatDateTime(role.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Updated At
                                    </p>
                                    <p className="mt-1">
                                        {formatDateTime(role.updated_at)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    <Link
                                        href={`/roles/${role.id}/edit`}
                                        className="block"
                                    >
                                        <Button
                                            variant="default"
                                            className="w-full"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Role
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowDelete(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Role
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Role
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{role.name}</span>?
                            This action cannot be undone and will remove the
                            role from all {role.users_count} assigned user
                            {role.users_count !== 1 ? 's' : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
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
