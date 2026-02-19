
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
    rangeMin: z.number().nullable().optional(),
    rangeMax: z.number().nullable().optional(),
    maxError: z.number().nullable().optional(),
    maxUncertainty: z.number().nullable().optional(),
});

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        // Apenas ADMIN, CRIADOR e QUALIDADE podem deletar?
        if (!['ADMIN', 'CRIADOR', 'QUALIDADE'].includes(user.role)) {
            return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
        }

        const { id } = await params;

        const criteria = await prisma.acceptanceCriteria.findUnique({
            where: { id },
        });

        if (!criteria) {
            return NextResponse.json({ error: 'Critério não encontrado' }, { status: 404 });
        }

        await prisma.acceptanceCriteria.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting acceptance criteria:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar critério' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!['ADMIN', 'CRIADOR', 'QUALIDADE'].includes(user.role)) {
            return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: validation.error.format() },
                { status: 400 }
            );
        }

        const criteria = await prisma.acceptanceCriteria.update({
            where: { id },
            data: {
                rangeMin: validation.data.rangeMin,
                rangeMax: validation.data.rangeMax,
                maxError: validation.data.maxError,
                maxUncertainty: validation.data.maxUncertainty,
            },
        });

        return NextResponse.json(criteria);
    } catch (error: any) {
        console.error('Error updating acceptance criteria:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar critério' },
            { status: 500 }
        );
    }
}
