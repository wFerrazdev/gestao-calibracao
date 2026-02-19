'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';

export default function PendingPage() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <AuthShell>
            <div className="flex flex-col items-center text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor" className="text-green-600 dark:text-green-400">
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Solicitação Enviada!
                </h1>
                <div className="mx-auto max-w-sm space-y-4">
                    <p className="text-base leading-relaxed text-slate-600 dark:text-[#8892b0]">
                        Sua solicitação de cadastro foi recebida com sucesso.
                    </p>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Nossa equipe analisará seus dados e enviará uma confirmação para o seu e-mail corporativo em breve.
                    </p>
                </div>
                <div className="mt-8 w-full max-w-xs space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        <span>Tempo estimado: 24h úteis</span>
                    </div>
                    <button
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:hover:bg-slate-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:ring-offset-2"
                        onClick={handleLogout}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" /></svg>
                        </span>
                        Voltar para o login
                    </button>
                </div>
            </div>
        </AuthShell>
    );
}
