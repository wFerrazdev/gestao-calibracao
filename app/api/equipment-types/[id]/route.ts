import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getCurrentUser();
        const { id } = await params;

        const type = await prisma.equipmentType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { Equipment: true },
                },
            },
        });

        if (!type) {
            return NextResponse.json(
                { error: 'Tipo de equipamento não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(type);
    } catch (error: any) {
        console.error('Error fetching equipment type:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar tipo de equipamento' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        // Apenas ADMIN e CRIADOR
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name } = body;

        const existing = await prisma.equipmentType.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Tipo de equipamento não encontrado' },
                { status: 404 }
            );
        }

        const type = await prisma.equipmentType.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(type);
    } catch (error: any) {
        console.error('Error updating equipment type:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar tipo de equipamento' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        // Apenas ADMIN e CRIADOR (ou conforme regra de negócio, Sectors era só CRIADOR, aqui vou manter coerente com criação POST)
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const existing = await prisma.equipmentType.findUnique({
            where: { id },
            include: { _count: { select: { Equipment: true } } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Tipo de equipamento não encontrado' },
                { status: 404 }
            );
        }

        if (existing._count.Equipment > 0) {
            return NextResponse.json(
                { error: `Este tipo possui ${existing._count.Equipment} equipamento(s) associado(s). Remova-os ou altere o tipo deles antes de excluir.` },
                { status: 400 } // Bad Request - Client side needs to handle this
            );
        }

        await prisma.equipmentType.delete({ where: { id } });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'EquipmentType', // Ensure this enum exists or is string in AuditLog
            entityId: id,
            action: 'DELETE',
            metadata: { typeName: existing.name },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting equipment type:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar tipo de equipamento' },
            { status: 500 }
        );
    }
}
