import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { TenantSidebar } from '@/components/tenant-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

interface TenantLayoutProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItemType[];
    tenant?: {
        name: string;
        slug: string;
        logo_url?: string | null;
    };
}

export default function TenantLayout({ children, breadcrumbs = [], tenant }: TenantLayoutProps) {
    return (
        <SidebarProvider>
            <TenantSidebar tenant={tenant} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard">
                                            <Home className="h-4 w-4" />
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumbs.map((item, index) => (
                                    <span key={item.href || index} className="flex items-center gap-2">
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            {index === breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage>{item.title}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={item.href || '#'}>{item.title}</Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center gap-2" />
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
