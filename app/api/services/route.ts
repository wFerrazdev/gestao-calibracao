import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { requireRole } from '@/lib/auth/require-role';
import { z } from 'zod';
import { ServiceStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const createServiceSchema = z.object({
    equipmentId: z.string(),
    scheduledDate: z.string().or(z.date()),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    technician: z.string().optional(),
    notes: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse('Unauthorized', { status: 401 });
        requireRole(user.role, ['ADMIN', 'CRIADOR']);

        const body = await request.json();
        const data = createServiceSchema.parse(body);

        const service = await prisma.serviceOrder.create({
            data: {
                equipmentId: data.equipmentId,
                scheduledDate: new Date(data.scheduledDate),
                description: data.description,
                status: data.status || 'SCHEDULED',
                technician: data.technician,
                notes: data.notes,
            },
        });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'SERVICE_ORDER',
            entityId: service.id,
            action: 'CREATE',
            metadata: {
                equipmentId: data.equipmentId,
                date: data.scheduledDate
            },
        });

        return NextResponse.json(service);
    } catch (error: any) {
        console.error('Erro ao criar serviço:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as ServiceStatus | null;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {};
        if (status && (status as string) !== 'ALL') where.status = status;

        if (startDate && endDate) {
            where.scheduledDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const services = await prisma.serviceOrder.findMany({
            where,
            include: {
                Equipment: {
                    select: {
                        name: true,
                        code: true,
                        imageUrl: true,
                        Sector: { select: { name: true } }
                    }
                }
            },
            orderBy: { scheduledDate: 'asc' },
        });

        return NextResponse.json(services);
    } catch (error: any) {
        console.error('Erro ao listar serviços:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
