import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isCriador } from '@/lib/auth/is-criador';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/firebase-admin';
import { createAuditLog } from '@/lib/audit';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();
        const targetUserId = id;

        // 1. Verificar permissões
        const isCurrentUserCriador = isCriador(currentUser.firebaseUid);
        const isAdmin = currentUser.role === 'ADMIN';

        if (!isCurrentUserCriador && !isAdmin) {
            return NextResponse.json(
                { error: 'Sem permissão para excluir usuários' },
                { status: 403 }
            );
        }

        // 2. Buscar usuário alvo
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // 3. Impedir exclusão de si mesmo
        if (currentUser.id === targetUser.id) {
            return NextResponse.json(
                { error: 'Não é possível excluir o próprio usuário' },
                { status: 400 }
            );
        }

        // 4. Impedir exclusão do CRIADOR (por qualquer um)
        if (isCriador(targetUser.firebaseUid) || targetUser.role === 'CRIADOR') {
            return NextResponse.json(
                { error: 'O usuário CRIADOR não pode ser excluído' },
                { status: 403 }
            );
        }

        // 5. Verificar dependências (Integridade Referencial)

        // Verificar Logs de Auditoria
        const auditLogsCount = await prisma.auditLog.count({
            where: { actorUserId: targetUser.id },
        });

        if (auditLogsCount > 0) {
            return NextResponse.json(
                {
                    error: 'Este usuário possui registros de auditoria e não pode ser excluído. Considere desativá-lo.',
                    code: 'HAS_DEPENDENCIES'
                },
                { status: 409 }
            );
        }

        // Verificar Calibrações Realizadas
        const calibrationsCount = await prisma.calibrationRecord.count({
            where: { createdByUserId: targetUser.id },
        });

        if (calibrationsCount > 0) {
            return NextResponse.json(
                {
                    error: 'Este usuário realizou calibrações e não pode ser excluído para manter o histórico. Considere desativá-lo.',
                    code: 'HAS_DEPENDENCIES'
                },
                { status: 409 }
            );
        }

        // 6. Excluir do Firebase Auth (se tiver UID)
        if (targetUser.firebaseUid) {
            try {
                await auth.deleteUser(targetUser.firebaseUid);
            } catch (error: unknown) {
                console.error('Error deleting user from Firebase:', error);
                const firebaseError = error as { code?: string; message?: string };
                // Se o erro for "user not found", prosseguir com exclusão do DB
                if (firebaseError.code !== 'auth/user-not-found') {
                    // Em DEV, retornar o erro real para debug
                    const errorMessage = firebaseError.message || 'Erro desconhecido no Firebase';
                    return NextResponse.json(
                        { error: `Erro Firebase: ${errorMessage}` },
                        { status: 500 }
                    );
                }
            }
        }

        // 7. Excluir do Banco de Dados
        await prisma.user.delete({
            where: { id: targetUser.id },
        });

        // 8. Logar ação
        await createAuditLog({
            actorUserId: currentUser.id,
            entityType: 'User',
            entityId: targetUserId,
            action: 'DELETE',
            metadata: {
                deletedUserEmail: targetUser.email,
                deletedUserName: targetUser.name,
            },
        });

        return NextResponse.json({ message: 'Usuário excluído com sucesso' });

    } catch (error: unknown) {
        console.error('Error deleting user:', error);
        const errorMessage = (error as Error).message || 'Erro desconhecido';
        return NextResponse.json(
            { error: `Erro interno: ${errorMessage}` },
            { status: 500 }
        );
    }
}
