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

        const sector = await prisma.sector.findUnique({
            where: { id },
            include: {
                Equipment: {
                    include: {
                        EquipmentType: true,
                    },
                    orderBy: { dueDate: 'asc' },
                },
                _count: {
                    select: { Equipment: true, User: true },
                },
            },
        });

        if (!sector) {
            return NextResponse.json(
                { error: 'Setor não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(sector);
    } catch (error: any) {
        console.error('Error fetching sector:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar setor' },
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

        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, code, description } = body;

        const existing = await prisma.sector.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Setor não encontrado' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;

        const sector = await prisma.sector.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(sector);
    } catch (error: any) {
        console.error('Error updating sector:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar setor' },
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

        // Apenas CRIADOR pode deletar setores
        if (user.role !== 'CRIADOR') {
            return NextResponse.json(
                { error: 'Apenas o CRIADOR pode deletar setores' },
                { status: 403 }
            );
        }

        const existing = await prisma.sector.findUnique({
            where: { id },
            include: { _count: { select: { Equipment: true } } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Setor não encontrado' },
                { status: 404 }
            );
        }

        if (existing._count.Equipment > 0) {
            return NextResponse.json(
                { error: `Setor possui ${existing._count.Equipment} equipamento(s). Remova-os antes de deletar.` },
                { status: 400 }
            );
        }

        await prisma.sector.delete({ where: { id } });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'Sector',
            entityId: id,
            action: 'DELETE',
            metadata: { sectorName: existing.name },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting sector:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar setor' },
            { status: 500 }
        );
    }
}
