import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                Platform
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="transition-all duration-200 hover:bg-linear-to-r hover:from-indigo-500/10 hover:to-purple-500/10 data-[active=true]:bg-linear-to-r data-[active=true]:from-indigo-500/20 data-[active=true]:to-purple-500/20 data-[active=true]:border-l-2 data-[active=true]:border-indigo-500"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon className="text-indigo-500 dark:text-indigo-400" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
