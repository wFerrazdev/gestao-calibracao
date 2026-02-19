import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        await getCurrentUser(); // Apenas validar auth

        const types = await prisma.equipmentType.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        Equipment: true,
                    },
                },
            },
        });

        return NextResponse.json(types);
    } catch (error: any) {
        console.error('Error fetching equipment types:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar tipos de equipamento' },
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
        const { name } = body;

        const type = await prisma.equipmentType.create({
            data: { name } as any,
        });

        return NextResponse.json(type, { status: 201 });
    } catch (error: any) {
        console.error('Error creating equipment type:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao criar tipo de equipamento' },
            { status: 500 }
        );
    }
}
