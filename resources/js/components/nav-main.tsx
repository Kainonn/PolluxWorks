import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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
                {items.map((item) =>
                    item.items && item.items.length > 0 ? (
                        // Item con sub-items - Collapsible
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.items.some((subItem) => isCurrentUrl(subItem.href))}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={{ children: item.title }}
                                        className="transition-all duration-200 hover:bg-linear-to-r hover:from-indigo-500/10 hover:to-purple-500/10"
                                    >
                                        {item.icon && <item.icon className="text-indigo-500 dark:text-indigo-400" />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(subItem.href)}
                                                >
                                                    <Link href={subItem.href} prefetch>
                                                        {subItem.icon && <subItem.icon className="size-4" />}
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        // Item sin sub-items - Link directo
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={item.href ? isCurrentUrl(item.href) : false}
                                tooltip={{ children: item.title }}
                                className="transition-all duration-200 hover:bg-linear-to-r hover:from-indigo-500/10 hover:to-purple-500/10 data-[active=true]:bg-linear-to-r data-[active=true]:from-indigo-500/20 data-[active=true]:to-purple-500/20 data-[active=true]:border-l-2 data-[active=true]:border-indigo-500"
                            >
                                <Link href={item.href || '#'} prefetch>
                                    {item.icon && <item.icon className="text-indigo-500 dark:text-indigo-400" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
