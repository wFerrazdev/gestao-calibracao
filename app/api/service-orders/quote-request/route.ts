import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role === 'VIEWER') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const json = await request.json();
        const { supplierId, equipmentIds, emailSubject, emailBody, emailCc } = json;

        if (!supplierId || !equipmentIds || !Array.isArray(equipmentIds)) {
            return new NextResponse('Invalid request data', { status: 400 });
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!supplier) {
            return new NextResponse('Supplier not found', { status: 404 });
        }

        // Create service orders for each equipment
        // Status: WAITING_QUOTE (Aguardando Orçamento)
        // Description: Solicitação de orçamento

        // Create QuoteRequest
        const quoteRequest = await prisma.quoteRequest.create({
            data: {
                supplierId,
                emailSubject,
                emailBody,
                emailCc,
                status: 'OPEN',
            },
        });

        // Create service orders linked to QuoteRequest
        await prisma.$transaction(
            equipmentIds.map((equipmentId: string) =>
                prisma.serviceOrder.create({
                    data: {
                        equipmentId,
                        supplierId,
                        status: 'WAITING_QUOTE',
                        description: 'Solicitação de Orçamento',
                        scheduledDate: new Date(),
                        quoteRequestId: quoteRequest.id, // Link to QuoteRequest
                    },
                })
            )
        );

        // Send email logic removed from here as per new flow? 
        // Or keep it as "Auto send if possible"? 
        // User wants to preview first. So we SHOULD NOT send email here directly if we want the user to review.
        // But the previous requirement was "Implement Real Email Sending".
        // The new requirement is "View Page".
        // Use case: User clicks "Criar Solicitação".
        // We create the request.
        // Redirect to view page.
        // User sends email MANUALLY via Outlook or copies text.

        // So I will comment out the auto-sending part for now, or make it optional?
        // The user said: "Amanhã mexemos mais... visualizar... gerar PDF... copiar texto".
        // Implies manual sending.
        // so I will REMOVE the automatic email sending for now to avoid confusion.

        return NextResponse.json({
            success: true,
            message: 'Solicitação criada com sucesso',
            quoteRequestId: quoteRequest.id
        });
    } catch (error) {
        console.error('Error creating quote request:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
