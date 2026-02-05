import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
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

interface Props {
    user: User;
}

const breadcrumbs = (user: User): BreadcrumbItem[] => [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: user.name,
        href: `/users/${user.id}`,
    },
];

export default function Show({ user }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/users/${user.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(user)}>
            <Head title={user.name} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/users">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                User Details
                            </h1>
                            <p className="text-muted-foreground">
                                View and manage user information
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/users/${user.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="text-xl">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">
                                        {user.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {user.email}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="mb-6" />

                            <div className="space-y-6">
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                        Account Status
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {user.email_verified_at ? (
                                            <>
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <div>
                                                    <p className="font-medium">
                                                        Email Verified
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Verified on{' '}
                                                        {formatDate(
                                                            user.email_verified_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-5 w-5 text-orange-500" />
                                                <div>
                                                    <p className="font-medium">
                                                        Email Not Verified
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        User needs to verify
                                                        their email
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                        Account Information
                                    </h3>
                                    <dl className="space-y-3">
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-muted-foreground">
                                                User ID
                                            </dt>
                                            <dd className="text-sm font-medium">
                                                #{user.id}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-muted-foreground">
                                                Created
                                            </dt>
                                            <dd className="text-sm font-medium">
                                                {formatDate(user.created_at)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-muted-foreground">
                                                Last Updated
                                            </dt>
                                            <dd className="text-sm font-medium">
                                                {formatDate(user.updated_at)}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Account Age
                                    </span>
                                    <Badge variant="secondary">
                                        {Math.floor(
                                            (new Date().getTime() -
                                                new Date(
                                                    user.created_at,
                                                ).getTime()) /
                                                (1000 * 60 * 60 * 24),
                                        )}{' '}
                                        days
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Status
                                    </span>
                                    <Badge
                                        variant={
                                            user.email_verified_at
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        {user.email_verified_at
                                            ? 'Active'
                                            : 'Pending'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Actions
                                </CardTitle>
                                <CardDescription>
                                    Available actions for this user
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/users/${user.id}/edit`}>
                                    <Button variant="outline" className="w-full">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit User
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {user.name}? This
                            action cannot be undone and will permanently remove
                            all user data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
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
