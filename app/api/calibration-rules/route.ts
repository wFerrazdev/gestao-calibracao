import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        await getCurrentUser(); // Apenas validar auth

        const rules = await prisma.calibrationRule.findMany({
            include: {
                EquipmentType: true,
            },
            orderBy: {
                EquipmentType: {
                    name: 'asc',
                },
            },
        });

        return NextResponse.json(rules);
    } catch (error: any) {
        console.error('Error fetching calibration rules:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar regras de calibração' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas ADMIN e CRIADOR
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { equipmentTypeId, intervalMonths, warnDays } = body;

        // Verificar se já existe regra para este tipo
        const existing = await prisma.calibrationRule.findUnique({
            where: { equipmentTypeId },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Já existe uma regra para este tipo de equipamento' },
                { status: 400 }
            );
        }

        const rule = await prisma.calibrationRule.create({
            data: {
                equipmentTypeId,
                intervalMonths,
                warnDays: warnDays || 30,
            } as any,
            include: {
                EquipmentType: true,
            },
        });

        return NextResponse.json(rule, { status: 201 });
    } catch (error: any) {
        console.error('Error creating calibration rule:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao criar regra de calibração' },
            { status: 500 }
        );
    }
}
