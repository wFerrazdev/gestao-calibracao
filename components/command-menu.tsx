'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
    CalendarDays,
    CreditCard,
    LayoutDashboard,
    Settings,
    User,
    Smile,
    Calculator,
    Building2,
    Package,
    Timer,
    LogOut,
    Moon,
    Sun,
    Laptop,
} from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUser as useAppUser } from '@/hooks/useUser';

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();
    const { user, isCriador, permissions } = useAppUser();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        const openHandler = () => setOpen(true);

        document.addEventListener('keydown', down);
        document.addEventListener('openCommandMenu', openHandler);

        return () => {
            document.removeEventListener('keydown', down);
            document.removeEventListener('openCommandMenu', openHandler);
        };
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Digite um comando ou busque..." />
            <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                <CommandGroup heading="Navegação">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard'))}
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>

                    {(permissions?.canAccessSectors) && (
                        <>
                            <CommandItem
                                onSelect={() => runCommand(() => router.push('/equipamentos'))}
                            >
                                <Package className="mr-2 h-4 w-4" />
                                <span>Equipamentos</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => runCommand(() => router.push('/setores'))}
                            >
                                <Building2 className="mr-2 h-4 w-4" />
                                <span>Setores</span>
                            </CommandItem>
                        </>
                    )}

                    {(permissions?.canManageRules) && (
                        <CommandItem
                            onSelect={() => runCommand(() => router.push('/regras-calibracao'))}
                        >
                            <Timer className="mr-2 h-4 w-4" />
                            <span>Regras de Calibração</span>
                        </CommandItem>
                    )}

                    {(isCriador || user?.role === 'ADMIN') && (
                        <CommandItem
                            onSelect={() => runCommand(() => router.push('/admin/audit-logs'))}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span>Logs de Auditoria</span>
                        </CommandItem>
                    )}

                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/configuracoes'))}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Tema">
                    <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Claro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Escuro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Sistema">
                    <CommandItem onSelect={() => runCommand(handleLogout)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
