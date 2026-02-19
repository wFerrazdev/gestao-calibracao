'use client';

import { useUser } from '@/hooks/useUser';
import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Settings, LogOut, Search } from 'lucide-react';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';



export function TopBar() {
    const { user } = useUser();
    const router = useRouter();


    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    return (
        <div className="flex h-16 items-center border-b bg-card px-6 gap-4">
            <div className="flex-1 flex items-center px-4">
                <Button
                    variant="outline"
                    className="w-full max-w-[240px] justify-start text-muted-foreground h-9 px-3 text-sm font-normal shadow-none md:w-64 lg:w-80"
                    onClick={() => document.dispatchEvent(new CustomEvent('openCommandMenu'))}
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="inline-flex">Buscar...</span>
                    <kbd className="pointer-events-none ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 hidden sm:inline-flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 rounded-md hover:bg-accent p-2 transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || 'User'} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <div className="text-sm font-medium">{user?.name || 'Usuário'}</div>
                                <div className="text-xs text-muted-foreground">{user?.role || 'Role'}</div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/configuracoes" className="flex items-center cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Configurações
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
