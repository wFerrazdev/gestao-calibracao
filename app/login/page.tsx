'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // Added sendPasswordResetEmail
import { ModeToggle } from '@/components/mode-toggle';
import { auth } from '@/lib/firebase';
import { AuthShell } from '@/components/auth/auth-shell';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

export default function LoginPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false); // New state

    useEffect(() => {
        setMounted(true);
    }, []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Por favor, digite seu e-mail.');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.');
            setTimeout(() => {
                setIsForgotPassword(false);
                setSuccess('');
            }, 5000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('Usuário não encontrado.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email inválido.');
            } else {
                setError('Erro ao enviar email. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignup) {
                // Criar conta
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Sincronizar com backend (envia o nome)
                const token = await userCredential.user.getIdToken();
                await fetch('/api/auth/sync-user', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }),
                });

                // Mostrar mensagem de sucesso antes de redirecionar
                setSuccess('Conta criada com sucesso! Aguarde a aprovação do administrador.');

                // Redirecionar para pending após breve delay
                setTimeout(() => {
                    router.push('/pending');
                }, 1500);
            } else {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const token = await userCredential.user.getIdToken();

                // Sincronizar sessão
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                // Buscar status do usuário
                const meResponse = await fetch('/api/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (meResponse.ok) {
                    const { user } = await meResponse.json();

                    if (user.status === 'PENDING') {
                        router.push('/pending');
                    } else if (user.status === 'DISABLED') {
                        router.push('/disabled');
                    } else {
                        router.push('/dashboard');
                    }
                } else if (meResponse.status === 404) {
                    // Usuário existe no Firebase mas não no banco — sincronizar
                    await fetch('/api/auth/sync-user', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    router.push('/pending');
                } else {
                    setError('Erro ao buscar dados do usuário. Tente novamente.');
                }
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            const code = err.code || '';
            if (code === 'auth/email-already-in-use') {
                setError('Este email já está cadastrado. Faça login.');
            } else if (code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (
                code === 'auth/wrong-password' ||
                code === 'auth/user-not-found' ||
                code === 'auth/invalid-credential'
            ) {
                setError('Email ou senha incorretos.');
            } else if (code === 'auth/invalid-email') {
                setError('Email inválido.');
            } else if (code === 'auth/too-many-requests') {
                setError('Muitas tentativas. Aguarde alguns minutos.');
            } else {
                setError('Erro ao autenticar. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {isForgotPassword ? 'Redefinir Senha' : (isSignup ? 'Crie sua conta' : 'Bem-vindo de volta')}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {isForgotPassword
                        ? 'Digite seu email para receber um link de redefinição'
                        : (isSignup ? 'Preencha os dados abaixo para começar' : 'Entre com suas credenciais para acessar')}
                </p>
            </div>

            {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-slate-700 dark:text-gray-300" htmlFor="reset-email">E-mail corporativo</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q33 0 56.5 23.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" /></svg>
                            </div>
                            <input
                                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] py-3 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#1e40af]"
                                id="reset-email"
                                placeholder="exemplo@empresa.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {success && (
                        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-500/20">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-md border border-red-200 dark:border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-700 dark:bg-[#1e40af] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-800 dark:hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#1e40af] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0A192F]"
                        type="submit"
                        disabled={loading}
                    >
                        {loading && (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        )}
                        Enviar Email
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsForgotPassword(false);
                            setError('');
                            setSuccess('');
                        }}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Login
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {isSignup && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700 dark:text-gray-300" htmlFor="name">Nome Completo</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" /></svg>
                                </div>
                                <input
                                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] py-3 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#1e40af]"
                                    id="name"
                                    placeholder="Seu nome"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={isSignup}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-slate-700 dark:text-gray-300" htmlFor="email">E-mail corporativo</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q33 0-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" /></svg>
                            </div>
                            <input
                                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] py-3 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#1e40af]"
                                id="email"
                                placeholder="exemplo@empresa.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none text-slate-700 dark:text-gray-300" htmlFor="password">Senha</label>
                        </div>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" /></svg>
                            </div>
                            <input
                                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] py-3 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#1e40af]"
                                id="password"
                                placeholder="••••••••"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <button
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {success && (
                        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-500/20">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-md border border-red-200 dark:border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end">
                        {!isSignup && (
                            <button
                                type="button"
                                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                onClick={() => {
                                    setIsForgotPassword(true);
                                    setError('');
                                    setSuccess('');
                                }}
                            >
                                Esqueci minha senha
                            </button>
                        )}
                    </div>
                    <button
                        className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-700 dark:bg-[#1e40af] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-800 dark:hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#1e40af] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0A192F]"
                        type="submit"
                        disabled={loading}
                    >
                        {loading && (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        )}
                        {isSignup ? 'Cadastrar' : 'Entrar'}
                    </button>
                </form>
            )}

            {!isForgotPassword && (
                <div className="mt-8 text-center text-sm text-slate-600 dark:text-[#8892b0]">
                    {isSignup ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                    <button
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline"
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        {isSignup ? 'Faça login' : 'Solicite acesso'}
                    </button>
                </div>
            )}
        </AuthShell>
    );
}
