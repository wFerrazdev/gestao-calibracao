import { prisma } from '@/lib/db';
import { AuditAction, Prisma } from '@prisma/client';

interface CreateAuditLogParams {
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    metadata?: Prisma.InputJsonValue;
}

const MAX_LOGS = 150;

export async function createAuditLog(data: CreateAuditLogParams) {
    try {
        // 1. Criar o novo log
        const log = await prisma.auditLog.create({
            data: {
                actorUserId: data.actorUserId,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                metadata: data.metadata ?? Prisma.JsonNull,
            },
        });

        // 2. Limpeza: Manter apenas os últimos MAX_LOGS
        // Buscamos os IDs dos logs que devem ser mantidos
        const logsToKeep = await prisma.auditLog.findMany({
            select: { id: true },
            orderBy: { createdAt: 'desc' },
            take: MAX_LOGS,
        });

        // Se tivermos mais que o limite, deletamos os que não estão na lista
        if (logsToKeep.length >= MAX_LOGS) {
            const keepIds = logsToKeep.map(l => l.id);

            await prisma.auditLog.deleteMany({
                where: {
                    id: { notIn: keepIds }
                }
            });
        }

        return log;
    } catch (error) {
        console.error('Falha ao criar log de auditoria:', error);
        // Não lançamos erro para não interromper o fluxo principal se o log falhar
        // mas em sistemas críticos, isso deveria ser tratado.
    }
}
