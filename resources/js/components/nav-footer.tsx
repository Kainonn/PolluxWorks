import type { ComponentPropsWithoutRef } from 'react';
import { Sparkles } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    const currentYear = new Date().getFullYear();

    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}
        >
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                            >
                                <a
                                    href={toUrl(item.href)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                {/* App Footer Branding */}
                <div className="mt-3 px-2 py-2 border-t border-sidebar-border/50 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-indigo-500" />
                        <span>© {currentYear} PolluxWorks</span>
                    </div>
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
