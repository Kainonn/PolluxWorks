import { Link } from '@inertiajs/react';
import { BookOpen, Building2, Github, LayoutGrid, Users, HelpCircle, Shield, CreditCard, FileText, Receipt, Wallet, Webhook, Banknote, ScrollText } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Tenants',
        href: '/tenants',
        icon: Building2,
    },
    {
        title: 'Subscriptions',
        href: '/subscriptions',
        icon: FileText,
    },
    {
        title: 'Billing',
        icon: Banknote,
        items: [
            {
                title: 'Customers',
                href: '/billing/customers',
                icon: Users,
            },
            {
                title: 'Payment Methods',
                href: '/billing/payment-methods',
                icon: CreditCard,
            },
            {
                title: 'Payments',
                href: '/billing/payments',
                icon: Wallet,
            },
            {
                title: 'Invoices',
                href: '/billing/invoices',
                icon: Receipt,
            },
            {
                title: 'Webhooks',
                href: '/billing/webhooks',
                icon: Webhook,
            },
        ],
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
    },
    {
        title: 'Plans',
        href: '/plans',
        icon: CreditCard,
    },
    {
        title: 'System Logs',
        href: '/system-logs',
        icon: ScrollText,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'GitHub',
        href: 'https://github.com/Kainonn/PolluxWorks',
        icon: Github,
    },
    {
        title: 'Docs',
        href: '/docs',
        icon: BookOpen,
    },
    {
        title: 'Help',
        href: '/help',
        icon: HelpCircle,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
