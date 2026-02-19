'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import {
    LayoutDashboard,
    Building2,
    Wrench,
    Settings,
    Users,
    Timer,
    LogOut,
    Package,
    Archive,
    ClipboardList,
    History,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Search,
    CalendarDays,
    Kanban,
    Truck,
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { GtHoverLogo } from './ui/gt-hover-logo';

export function Sidebar() {
    const pathname = usePathname();
    const { user, permissions, isCriador } = useUser();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    const navLinks = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            show: true,
        },
        {
            href: '/equipamentos',
            label: 'Equipamentos',
            icon: Package,
            show: permissions?.canAccessSectors,
        },
        {
            href: '/estoque',
            label: 'Estoque',
            icon: Archive,
            show: permissions?.canAccessSectors,
        },
        {
            href: '/calendario',
            label: 'Calendário',
            icon: CalendarDays,
            show: true,
        },
        {
            href: '/programacoes',
            label: 'Programações',
            icon: Kanban,
            show: true, // Aberto para todos que podem ver o sidebar (Viewer incluso)
        },
        {
            href: '/setores',
            label: 'Setores',
            icon: Building2,
            show: permissions?.canAccessSectors,
        },
        {
            href: '/fornecedores',
            label: 'Fornecedores',
            icon: Truck,
            show: permissions?.canManageRules,
        },
        {
            href: '/tipos-equipamento',
            label: 'Tipos de Equipamento',
            icon: ClipboardList,
            show: permissions?.canManageRules,
        },
        {
            href: '/regras-calibracao',
            label: 'Regras de Calibração',
            icon: Timer,
            show: permissions?.canManageRules,
        },
        {
            href: '/admin/usuarios',
            label: 'Usuários',
            icon: Users,
            show: isCriador,
        },
        {
            href: '/admin/audit-logs',
            label: 'Auditoria',
            icon: History,
            show: isCriador || user?.role === 'ADMIN',
        },
        {
            href: '/configuracoes',
            label: 'Configurações',
            icon: Settings,
            show: true,
        },
    ];

    return (
        <div
            className={cn(
                'flex h-screen flex-col border-r bg-card transition-all duration-300',
                isCollapsed ? 'w-20' : 'w-64'
            )}
        >
            <div className="flex h-16 items-center border-b px-4 justify-between">
                <div className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "justify-center w-full")}>
                    <GtHoverLogo className="w-8 p-0 shrink-0" alwaysActive />
                    {!isCollapsed && <span className="text-lg font-semibold truncate">Gestão Calibração</span>}
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-2">
                <TooltipProvider delayDuration={0}>
                    {navLinks.map((link) => {
                        if (!link.show) return null;

                        const Icon = link.icon;
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

                        return (
                            <Tooltip key={link.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                            isCollapsed && 'justify-center px-2'
                                        )}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {!isCollapsed && <span className="truncate">{link.label}</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && (
                                    <TooltipContent side="right">
                                        {link.label}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </nav>

            <Separator />

            <div className="p-2 space-y-2">
                {/* Toggle Button */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center hover:bg-black/5 dark:hover:bg-white/10"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                            >
                                {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Expandir Sidebar</TooltipContent>}
                    </Tooltip>
                </TooltipProvider>

                {/* User Info */}
                <div className={cn("flex items-center gap-3 rounded-md bg-muted p-2 overflow-hidden transition-all", isCollapsed && "justify-center px-0 bg-transparent")}>
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center cursor-default">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.photoUrl || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>{user?.name}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium">{user?.name || 'Usuário'}</div>
                            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
                                onClick={handleLogout}
                            >
                                <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
                                {!isCollapsed && "Sair"}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Sair do Sistema</TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
