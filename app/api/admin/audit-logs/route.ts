import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isCriador } from '@/lib/auth/is-criador';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        const isAdmin = currentUser.role === 'ADMIN';
        const isCurrentUserCriador = isCriador(currentUser.firebaseUid);

        if (!isAdmin && !isCurrentUserCriador) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    User: {
                        select: { name: true, email: true }
                    }
                }
            }),
            prisma.auditLog.count()
        ]);

        return NextResponse.json({
            logs,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Erro interno ao buscar logs', details: error.message }, { status: 500 });
    }
}
