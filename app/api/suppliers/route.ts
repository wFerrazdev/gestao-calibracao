import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // 🛡️ SEGURANÇA: Apenas QUALIDADE, ADMIN e CRIADOR podem criar fornecedores
        if (!['QUALIDADE', 'ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente para criar fornecedores' },
                { status: 403 }
            );
        }

        const json = await request.json();
        const { name, email, phone, address, notes } = json;

        if (!name) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const supplier = await prisma.supplier.create({
            data: {
                name,
                email,
                phone,
                address,
                notes,
            },
        });

        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error('Error creating supplier:', error);

        if (error.message.includes('Token') || error.message.includes('não está ativo')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Erro ao criar fornecedor' },
            { status: 500 }
        );
    }
}
