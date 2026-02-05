import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Mail,
    CheckCircle,
    XCircle,
    Pencil,
    Trash2,
    MoreHorizontal,
    Calendar,
    Hash,
    Clock,
    Shield,
    UserCircle,
    Copy,
    Check,
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
import { Separator } from '@/components/ui/separator';
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
    const [copied, setCopied] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/users/${user.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
            },
        });
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(user.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffInDays = Math.floor(
            (now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    const accountAge = Math.floor(
        (new Date().getTime() - new Date(user.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs(user)}>
            <Head title={user.name} />

            <div className="space-y-6">
                {/* Header with back button and actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <MoreHorizontal className="h-4 w-4" />
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/users/${user.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit User
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={copyEmail}>
                                {copied ? (
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="mr-2 h-4 w-4" />
                                )}
                                {copied ? 'Copied!' : 'Copy Email'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* User Profile Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                                        <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
                                            user.email_verified_at
                                                ? 'bg-green-500'
                                                : 'bg-orange-500'
                                        }`}
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <CardTitle className="text-2xl">
                                        {user.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-base">
                                        <Mail className="h-4 w-4" />
                                        {user.email}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={copyEmail}
                                                    >
                                                        {copied ? (
                                                            <Check className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {copied
                                                            ? 'Copied!'
                                                            : 'Copy email'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardDescription>
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        {user.email_verified_at ? (
                                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-orange-300 text-orange-600"
                                            >
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Pending Verification
                                            </Badge>
                                        )}
                                        <Badge variant="secondary">
                                            ID: #{user.id}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="mb-6" />

                            {/* Account Status Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        Account Status
                                    </h3>
                                    <div
                                        className={`rounded-lg border p-4 ${
                                            user.email_verified_at
                                                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                                : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {user.email_verified_at ? (
                                                <>
                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                    <div>
                                                        <p className="font-semibold text-green-700 dark:text-green-400">
                                                            Email Verified
                                                        </p>
                                                        <p className="text-sm text-green-600 dark:text-green-500">
                                                            Verified on{' '}
                                                            {formatDate(
                                                                user.email_verified_at
                                                            )}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-6 w-6 text-orange-600" />
                                                    <div>
                                                        <p className="font-semibold text-orange-700 dark:text-orange-400">
                                                            Email Not Verified
                                                        </p>
                                                        <p className="text-sm text-orange-600 dark:text-orange-500">
                                                            User needs to verify
                                                            their email address
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Account Information */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        <UserCircle className="h-4 w-4" />
                                        Account Information
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                <Hash className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    User ID
                                                </p>
                                                <p className="font-semibold">
                                                    #{user.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Member Since
                                                </p>
                                                <p className="font-semibold">
                                                    {formatRelativeTime(
                                                        user.created_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 sm:col-span-2">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Last Updated
                                                </p>
                                                <p className="font-semibold">
                                                    {formatDate(user.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <span className="text-sm text-muted-foreground">
                                        Account Age
                                    </span>
                                    <Badge variant="secondary" className="font-mono">
                                        {accountAge} days
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <span className="text-sm text-muted-foreground">
                                        Status
                                    </span>
                                    <Badge
                                        className={
                                            user.email_verified_at
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-orange-500/10 text-orange-600'
                                        }
                                    >
                                        {user.email_verified_at
                                            ? 'Active'
                                            : 'Pending'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <span className="text-sm text-muted-foreground">
                                        Created
                                    </span>
                                    <span className="text-sm font-medium">
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">
                                    Quick Actions
                                </CardTitle>
                                <CardDescription>
                                    Manage this user
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link
                                    href={`/users/${user.id}/edit`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit User
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
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

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{user.name}</span>?
                            This action cannot be undone and will permanently
                            remove all user data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
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
