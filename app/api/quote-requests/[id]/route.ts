import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        console.log('API: GET /api/quote-requests/[id] called');
        const user = await getCurrentUser();
        console.log('API: User authenticated:', user?.id);

        if (!user || user.role === 'VIEWER') {
            console.log('API: Unauthorized access attempt');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const id = params.id;
        console.log('API: Fetching quote request with ID:', id);

        const quoteRequest = await prisma.quoteRequest.findUnique({
            where: { id },
            include: {
                Supplier: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                ServiceOrder: {
                    include: {
                        Equipment: {
                            select: {
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });

        if (!quoteRequest) {
            return new NextResponse('Quote Request not found', { status: 404 });
        }

        // Return formatted data
        return NextResponse.json({
            id: quoteRequest.id,
            supplier: quoteRequest.Supplier,
            emailSubject: quoteRequest.emailSubject,
            emailBody: quoteRequest.emailBody,
            emailCc: quoteRequest.emailCc,
            createdAt: quoteRequest.createdAt,
            ServiceOrder: quoteRequest.ServiceOrder,
        });

    } catch (error: any) {
        console.error('CRITICAL API ERROR:', error);
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const user = await getCurrentUser();

        if (!user || user.role === 'VIEWER') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const id = params.id;
        console.log(`API: Cancelling quote request ${id}`);

        // Using transaction to ensure both are deleted or neither is
        await prisma.$transaction(async (tx) => {
            // First delete related service orders
            await tx.serviceOrder.deleteMany({
                where: { quoteRequestId: id }
            });

            // Then delete the quote request itself
            await tx.quoteRequest.delete({
                where: { id }
            });
        });

        console.log(`API: Quote request ${id} cancelled successfully`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('CRITICAL API ERROR (DELETE):', error);
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
    }
}
