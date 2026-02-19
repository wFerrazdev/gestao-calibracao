import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { isCriador } from '@/lib/auth/is-criador';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas CRIADOR pode acessar
        if (!isCriador(user.firebaseUid)) {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = {};

        if (status && ['PENDING', 'ACTIVE', 'DISABLED'].includes(status)) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                Sector: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Contar pendentes
        const pendingCount = await prisma.user.count({
            where: { status: 'PENDING' },
        });

        return NextResponse.json({ users, pendingCount });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar usuários' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas CRIADOR pode editar
        if (!isCriador(user.firebaseUid)) {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, role, status, sectorId } = body;

        // Buscar usuário alvo
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Não permitir editar o próprio CRIADOR
        if (isCriador(targetUser.firebaseUid)) {
            return NextResponse.json(
                { error: 'Não é possível editar o usuário CRIADOR' },
                { status: 400 }
            );
        }

        // Se role=PRODUCAO, sectorId é obrigatório
        if (role === 'PRODUCAO' && !sectorId) {
            return NextResponse.json(
                { error: 'Setor é obrigatório para usuário PRODUCAO' },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (sectorId !== undefined) updateData.sectorId = sectorId;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { Sector: true },
        });

        // Criar audit log
        await createAuditLog({
            actorUserId: user.id,
            entityType: 'User',
            entityId: userId,
            action: 'UPDATE',
            metadata: { changes: updateData },
        });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar usuário' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas CRIADOR pode deletar
        if (!isCriador(user.firebaseUid)) {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId é obrigatório' },
                { status: 400 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Não permitir deletar o CRIADOR
        if (isCriador(targetUser.firebaseUid)) {
            return NextResponse.json(
                { error: 'Não é possível deletar o usuário CRIADOR' },
                { status: 400 }
            );
        }

        // Soft delete (desativar ao invés de remover)
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'DISABLED' },
        });

        // Audit log
        await createAuditLog({
            actorUserId: user.id,
            entityType: 'User',
            entityId: userId,
            action: 'DELETE',
            metadata: { softDelete: true },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar usuário' },
            { status: 500 }
        );
    }
}
