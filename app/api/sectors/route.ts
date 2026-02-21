import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const user = await getCurrentUser(); // 🛡️ SEGURANÇA: Garante usuário ATIVO

        const sectors = await prisma.sector.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        Equipment: true,
                        User: true,
                    },
                },
            },
        });

        return NextResponse.json(sectors);
    } catch (error: any) {
        console.error('Error fetching sectors:', error);

        if (error.message.includes('Token') || error.message.includes('não encontrado') || error.message.includes('não está ativo')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Erro ao buscar setores' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // 🛡️ SEGURANÇA: Apenas ADMIN e CRIADOR podem criar setores
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente para criar setores' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, code, description } = body as { name: string; code?: string; description?: string };

        if (!name) {
            return NextResponse.json(
                { error: 'Nome do setor é obrigatório' },
                { status: 400 }
            );
        }

        const sector = await prisma.sector.create({
            data: {
                name,
                code: code || undefined,
                description: description || undefined
            } as any,
        });

        return NextResponse.json(sector, { status: 201 });
    } catch (error: any) {
        console.error('Error creating sector:', error);

        if (error.message.includes('Token') || error.message.includes('não está ativo')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json(
            { error: error.message || 'Erro ao criar setor' },
            { status: 500 }
        );
    }
}
