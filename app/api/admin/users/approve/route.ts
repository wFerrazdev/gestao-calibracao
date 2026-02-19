import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { isCriador } from '@/lib/auth/is-criador';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas CRIADOR pode aprovar
        if (!isCriador(user.firebaseUid)) {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, role, sectorId } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'userId e role são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar role
        if (!['ADMIN', 'QUALIDADE', 'PRODUCAO', 'VIEWER'].includes(role)) {
            return NextResponse.json(
                { error: 'Role inválida' },
                { status: 400 }
            );
        }

        // Se PRODUCAO, setor é obrigatório
        if (role === 'PRODUCAO' && !sectorId) {
            return NextResponse.json(
                { error: 'Setor é obrigatório para role PRODUCAO' },
                { status: 400 }
            );
        }

        // Buscar usuário
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        if (targetUser.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Usuário não está pendente' },
                { status: 400 }
            );
        }

        // Aprovar usuário
        const approvedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'ACTIVE',
                role,
                sectorId: sectorId || null,
            },
            include: { Sector: true },
        });

        // Criar audit log
        await createAuditLog({
            actorUserId: user.id,
            entityType: 'User',
            entityId: userId,
            action: 'APPROVE',
            metadata: { role, sectorId },
        });

        return NextResponse.json(approvedUser);
    } catch (error: any) {
        console.error('Error approving user:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao aprovar usuário' },
            { status: 500 }
        );
    }
}
