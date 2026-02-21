import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não precisam de autenticação)
const publicRoutes = ['/login', '/signup', '/p'];

// Rotas que exigem autenticação mas permitem qualquer status
const authRoutes = ['/pending', '/disabled'];

// Rotas que só o CRIADOR pode acessar
const criadorOnlyRoutes = ['/admin/usuarios'];

// Rotas bloqueadas para VIEWER
const viewerBlockedRoutes = [
    '/setores',
    '/tipos-equipamento',
    '/regras-calibracao',
    '/admin' // Admin já é restrito, mas reforça
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Permitir assets estáticos
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.') // arquivos estáticos
    ) {
        return NextResponse.next();
    }

    // Permitir acesso à página pública de QR Code
    if (pathname.startsWith('/p/')) {
        return NextResponse.next();
    }

    // Rotas de API - Proteção delegada aos route handlers
    // Permitimos passar sem redirecionar para evitar erro de parse JSON no cliente (SyntaxError: Unexpected token <)
    // A segurança REAL é feita via getCurrentUser() dentro das rotas.
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Se é rota pública do frontend, permitir
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Verificar autenticação via cookie de sessão
    const token = request.cookies.get('session')?.value;

    if (!token) {
        // Não autenticado - redirecionar para login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validar token e obter dados do usuário via API /api/me
    try {
        const meResponse = await fetch(new URL('/api/me', request.url), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!meResponse.ok) {
            // 404 = user existe no Firebase mas não no banco (acabou de criar)
            // Redirecionar para /pending — o AuthContext vai fazer o sync
            if (meResponse.status === 404) {
                if (authRoutes.includes(pathname)) {
                    return NextResponse.next();
                }
                return NextResponse.redirect(new URL('/pending', request.url));
            }

            // Token inválido - limpar cookie e redirecionar
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session');
            return response;
        }

        const { user, isCriador } = await meResponse.json();

        // Usuário PENDING - redirecionar para /pending
        if (user.status === 'PENDING' && !authRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/pending', request.url));
        }

        // Usuário DISABLED - redirecionar para /disabled
        if (user.status === 'DISABLED' && !authRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/disabled', request.url));
        }

        // Bloquear acesso do VIEWER a rotas administrativas
        if (user.role === 'VIEWER') {
            if (viewerBlockedRoutes.some(route => pathname.startsWith(route))) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        // Verificar acesso a rotas restritas ao CRIADOR
        if (criadorOnlyRoutes.some(route => pathname.startsWith(route))) {
            if (!isCriador) {
                // Não é CRIADOR - redirecionar para dashboard
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        // Se está em /pending ou /disabled mas está ACTIVE, redirecionar para home
        if (user.status === 'ACTIVE' && authRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
