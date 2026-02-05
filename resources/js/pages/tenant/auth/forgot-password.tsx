import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

export default function TenantForgotPassword({ tenant, status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/forgot-password');
    }

    return (
        <>
            <Head title={`Forgot Password - ${tenant.name}`} />

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
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            {status}
                        </div>
                    )}

                    {/* Forgot Password Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Forgot Password</CardTitle>
                            <CardDescription>
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </CardDescription>
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

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Reset Link
                                </Button>
                            </form>

                            <div className="mt-4 text-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center text-sm text-primary hover:underline"
                                >
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back to login
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
