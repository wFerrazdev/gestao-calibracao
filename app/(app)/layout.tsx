'use client';

import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { ForceTheme } from '@/components/force-theme';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CommandMenu } from '@/components/command-menu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg"></div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Vai redirecionar
    }

    return (
        <div className="flex h-full overflow-hidden">
            <ForceTheme />
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto bg-background p-6">
                    {children}
                </main>
            </div>
            <CommandMenu />
        </div>
    );
}
