import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle, LogIn, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    tenant: {
        name: string;
        slug: string;
        logo_url?: string | null;
        description?: string | null;
    };
    features: string[];
}

const defaultFeatures = [
    'Team collaboration tools',
    'Role-based access control',
    'Secure data management',
    'Real-time notifications',
    'Customizable settings',
    'API integration support',
];

export default function TenantWelcome({ tenant, features = defaultFeatures }: Props) {
    return (
        <>
            <Head title={`Welcome to ${tenant.name}`} />

            <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Header */}
                <header className="border-b bg-white/80 backdrop-blur dark:bg-gray-900/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            {tenant.logo_url ? (
                                <img src={`/storage/${tenant.logo_url}`} alt={tenant.name} className="h-10 w-auto" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                                    {tenant.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-xl font-semibold">{tenant.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" asChild>
                                <Link href="/login">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                            Welcome to{' '}
                            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                {tenant.name}
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            {tenant.description ||
                                'Your dedicated workspace for streamlined operations, enhanced collaboration, and powerful management tools.'}
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <Button size="lg" asChild>
                                <Link href="/login">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Platform Features
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                            Everything you need to manage your organization
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">User Management</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Easily manage your team members, assign roles, and control access permissions.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Security First</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Enterprise-grade security with role-based access control and audit logging.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Fast & Reliable</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Built for performance with modern technology and reliable infrastructure.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Feature List */}
                <section className="bg-gray-50 dark:bg-gray-800/50">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                What&apos;s Included
                            </h2>
                        </div>
                        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t bg-white dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2 text-gray-500">
                                <span>&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Powered by PolluxWorks</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
