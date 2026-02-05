import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    FileText,
    Save,
    Shield,
    Users,
    X,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';


interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
    {
        title: 'Create Role',
        href: '/roles/create',
    },
];

export default function Create({ users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        users: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/roles');
    };

    const toggleUser = (userId: number) => {
        setData(
            'users',
            data.users.includes(userId)
                ? data.users.filter((id) => id !== userId)
                : [...data.users, userId]
        );
    };

    const selectAllUsers = () => {
        setData(
            'users',
            users.map((user) => user.id)
        );
    };

    const deselectAllUsers = () => {
        setData('users', []);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Role" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/roles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Role
                        </h1>
                        <p className="text-muted-foreground">
                            Create a new role and assign users to it
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Role Information
                                    </CardTitle>
                                    <CardDescription>
                                        Define the role name and description
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Role Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Administrator"
                                                className="pl-10"
                                                autoFocus
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                    setData(
                                                        'description',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Describe the purpose and permissions of this role..."
                                                className="min-h-24 pl-10"
                                            />
                                        </div>
                                        {errors.description && (
                                            <p className="text-sm text-destructive">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Assignment */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Users className="h-5 w-5 text-primary" />
                                                Assign Users
                                            </CardTitle>
                                            <CardDescription>
                                                Select users to assign to this
                                                role
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={selectAllUsers}
                                            >
                                                <Check className="mr-1 h-3 w-3" />
                                                Select All
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={deselectAllUsers}
                                            >
                                                <X className="mr-1 h-3 w-3" />
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {users.length === 0 ? (
                                        <Alert>
                                            <AlertDescription>
                                                No users available. Create users
                                                first before assigning them to
                                                roles.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2">
                                            {users.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                                                        data.users.includes(
                                                            user.id
                                                        )
                                                            ? 'bg-primary/5 ring-1 ring-primary/20'
                                                            : 'hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        id={`user-${user.id}`}
                                                        checked={data.users.includes(
                                                            user.id
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleUser(user.id)
                                                        }
                                                    />
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-sm font-medium text-primary">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <label
                                                        htmlFor={`user-${user.id}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <p className="font-medium">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.users && (
                                        <p className="mt-2 text-sm text-destructive">
                                            {errors.users}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Preview Card */}
                            <Card className="sticky top-6">
                                <CardHeader className="bg-linear-to-br from-primary/5 to-primary/10">
                                    <CardTitle className="text-lg">
                                        Role Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10">
                                            <Shield className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="mt-4 font-semibold">
                                            {data.name || 'Role Name'}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {data.description ||
                                                'No description provided'}
                                        </p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="gap-1"
                                            >
                                                <Users className="h-3 w-3" />
                                                {data.users.length} user
                                                {data.users.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing
                                                ? 'Creating...'
                                                : 'Create Role'}
                                        </Button>
                                        <Link
                                            href="/roles"
                                            className="block"
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
