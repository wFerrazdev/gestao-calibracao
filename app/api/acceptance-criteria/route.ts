
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
    equipmentTypeId: z.string(),
    rangeMin: z.number().nullable().optional(),
    rangeMax: z.number().nullable().optional(),
    maxError: z.number().nullable().optional(),
    maxUncertainty: z.number().nullable().optional(),
});

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const equipmentTypeId = searchParams.get('equipmentTypeId');

        const criteria = await prisma.acceptanceCriteria.findMany({
            where: equipmentTypeId ? { equipmentTypeId } : undefined,
            orderBy: { rangeMin: 'asc' },
        });

        return NextResponse.json(criteria);
    } catch (error: any) {
        console.error('Error fetching acceptance criteria:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar critérios de aceitação' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        // Apenas ADMIN, CRIADOR e QUALIDADE podem criar critérios?
        if (!['ADMIN', 'CRIADOR', 'QUALIDADE'].includes(user.role)) {
            return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: validation.error.format() },
                { status: 400 }
            );
        }

        const criteria = await prisma.acceptanceCriteria.create({
            data: {
                equipmentTypeId: validation.data.equipmentTypeId,
                rangeMin: validation.data.rangeMin,
                rangeMax: validation.data.rangeMax,
                maxError: validation.data.maxError,
                maxUncertainty: validation.data.maxUncertainty,
            },
        });

        return NextResponse.json(criteria);
    } catch (error: any) {
        console.error('Error creating acceptance criteria:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao criarcritério de aceitação' },
            { status: 500 }
        );
    }
}
