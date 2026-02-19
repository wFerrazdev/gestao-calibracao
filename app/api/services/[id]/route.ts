import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/require-role';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { z } from 'zod';
import { ServiceStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const updateServiceSchema = z.object({
    scheduledDate: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    technician: z.string().optional(),
    notes: z.string().optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse('Unauthorized', { status: 401 });
        requireRole(user.role, ['ADMIN', 'CRIADOR']);

        const body = await request.json();
        const data = updateServiceSchema.parse(body);
        const { id } = await params;

        const updateData: any = { ...data };
        if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);

        const service = await prisma.serviceOrder.update({
            where: { id },
            data: updateData,
        });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'SERVICE_ORDER',
            entityId: service.id,
            action: 'UPDATE',
            metadata: { ...data },
        });

        return NextResponse.json(service);
    } catch (error: any) {
        console.error('Erro ao atualizar serviço:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse('Unauthorized', { status: 401 });
        requireRole(user.role, ['ADMIN', 'CRIADOR']);

        const { id } = await params;

        const service = await prisma.serviceOrder.delete({
            where: { id },
        });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'SERVICE_ORDER',
            entityId: service.id,
            action: 'DELETE',
            metadata: { id: service.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao deletar serviço:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
