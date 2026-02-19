import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        let updatedCount = 0;
        let errors: string[] = [];

        for (const [index, item] of items.entries()) {
            try {
                const code = item['Código'] ? String(item['Código']).trim() : null;
                const location = item['Localização'] ? String(item['Localização']).trim() : null;

                if (!code) {
                    errors.push(`Linha ${index + 2}: Código ausente.`);
                    continue;
                }

                // Buscar equipamento no cadastro mestre
                const equipment = await prisma.equipment.findUnique({
                    where: { code }
                });

                if (!equipment) {
                    errors.push(`Linha ${index + 2}: Código "${code}" não encontrado no cadastro mestre.`);
                    continue;
                }

                // Atualizar localização e status para estoque
                await prisma.equipment.update({
                    where: { id: equipment.id },
                    data: {
                        location: location,
                        usageStatus: 'IN_STOCK',
                        // Ao mover para estoque, o setor deixa de ser relevante ou mantemos o anterior?
                        // Geralmente em estoque o "setor" é o próprio almoxarifado, mas o schema
                        // usa o campo location para endereçamento fino.
                        // Vamos manter o sectorId atual ou limpar? 
                        // O plano diz apenas "update location".
                    }
                });

                updatedCount++;

            } catch (err) {
                console.error(`Erro ao atualizar estoque linha ${index}:`, err);
                errors.push(`Linha ${index + 2}: Erro interno ao atualizar.`);
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            errors
        });

    } catch (error) {
        console.error('Estoque import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
