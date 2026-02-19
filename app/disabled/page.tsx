'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DisabledPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Conta Desativada
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Olá, <span className="font-semibold">{user?.name}</span>
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Sua conta foi desativada pelo administrador do sistema.
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        Entre em contato com o suporte para mais informações.
                    </p>
                </div>

                <button
                    onClick={async () => {
                        await logout();
                        router.push('/login');
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                    Sair
                </button>
            </div>
        </div>
    );
}
