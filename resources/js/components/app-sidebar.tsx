import { Link } from '@inertiajs/react';
import { Bell, BookOpen, Building2, Github, LayoutGrid, Users, HelpCircle, Shield, CreditCard, FileText, Receipt, Wallet, Webhook, Banknote, ScrollText, ShieldCheck, Brain, Cpu, Wrench, Gauge, GitBranch, ShieldAlert, Server } from 'lucide-react';
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
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
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
        title: 'AI Control Center',
        icon: Brain,
        items: [
            {
                title: 'Models',
                href: '/master/ai/models',
                icon: Cpu,
            },
            {
                title: 'Tools Registry',
                href: '/master/ai/tools',
                icon: Wrench,
            },
            {
                title: 'Plan Limits',
                href: '/master/ai/plan-limits',
                icon: Gauge,
            },
            {
                title: 'Usage & Metrics',
                href: '/master/ai/usage',
                icon: Gauge,
            },
            {
                title: 'Fallback Rules',
                href: '/master/ai/fallback-rules',
                icon: GitBranch,
            },
            {
                title: 'Policies',
                href: '/master/ai/policies',
                icon: ShieldAlert,
            },
            {
                title: 'Providers',
                href: '/master/ai/providers',
                icon: Server,
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
    {
        title: 'Audit Trail',
        href: '/master/audit-trail',
        icon: ShieldCheck,
    },
    {
        title: 'Notifications',
        href: '/master/notifications',
        icon: Bell,
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
                            <Link href="/dashboard" prefetch>
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
