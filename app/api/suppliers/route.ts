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
        if (!user || user.role === 'VIEWER') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const json = await request.json();
        const { name, email, phone, address, notes } = json;

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
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
    } catch (error) {
        console.error('Error creating supplier:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
