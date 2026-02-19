import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const supplier = await prisma.supplier.update({
            where: { id: params.id },
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
        console.error('Error updating supplier:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role === 'VIEWER') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check for related records (Service Orders)
        const relatedOrders = await prisma.serviceOrder.count({
            where: { supplierId: params.id },
        });

        if (relatedOrders > 0) {
            return new NextResponse(
                'Cannot delete supplier with related service orders',
                { status: 400 }
            );
        }

        await prisma.supplier.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
