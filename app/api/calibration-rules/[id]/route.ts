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

        const rule = await prisma.calibrationRule.findUnique({
            where: { id },
            include: { EquipmentType: true },
        });

        if (!rule) {
            return NextResponse.json(
                { error: 'Regra não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error('Error fetching calibration rule:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar regra' },
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
        const { intervalMonths, warnDays } = body;

        const existing = await prisma.calibrationRule.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Regra não encontrada' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (intervalMonths !== undefined) updateData.intervalMonths = intervalMonths;
        if (warnDays !== undefined) updateData.warnDays = warnDays;

        const rule = await prisma.calibrationRule.update({
            where: { id },
            data: updateData,
            include: { EquipmentType: true },
        });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error('Error updating calibration rule:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar regra' },
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

        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const existing = await prisma.calibrationRule.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Regra não encontrada' },
                { status: 404 }
            );
        }

        await prisma.calibrationRule.delete({ where: { id } });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'CalibrationRule',
            entityId: id,
            action: 'DELETE',
            metadata: { equipmentTypeId: existing.equipmentTypeId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting calibration rule:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar regra' },
            { status: 500 }
        );
    }
}
