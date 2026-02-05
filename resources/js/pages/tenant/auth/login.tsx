import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
    status?: string;
}

export default function TenantLogin({ tenant, status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title={`Login - ${tenant.name}`} />

            <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-gray-50 to-white px-4 dark:from-gray-900 dark:to-gray-800">
                <div className="w-full max-w-md">
                    {/* Logo and Title */}
                    <div className="mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-3">
                            {tenant.logo_url ? (
                                <img src={`/storage/${tenant.logo_url}`} alt={tenant.name} className="h-12 w-auto" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
                                    {tenant.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            {status}
                        </div>
                    )}

                    {/* Login Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Enter your credentials to access your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        autoFocus
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="remember" className="text-sm font-normal">
                                        Remember me
                                    </Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign In
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Powered by{' '}
                        <a href="https://polluxworks.com" className="text-primary hover:underline">
                            PolluxWorks
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
