import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

// Helper para processar data do Excel (que pode vir como número serial ou string)
function parseExcelDate(excelDate: any): Date | null {
    if (!excelDate) return null;

    if (excelDate instanceof Date) return excelDate;

    if (typeof excelDate === 'string') {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) return date;
        return null;
    }

    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
        return date;
    }

    return null;
}

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

        let createdCount = 0;
        let skippedCount = 0;
        let errors: string[] = [];

        for (const [index, item] of items.entries()) {
            try {
                if (!item['Código'] || !item['Nome']) {
                    errors.push(`Linha ${index + 2}: Código ou Nome ausente.`);
                    skippedCount++;
                    continue;
                }

                // Normalização para MAIÚSCULO
                const code = String(item['Código']).trim().toUpperCase();
                const name = String(item['Nome']).trim().toUpperCase();
                const sectorName = item['Setor'] ? String(item['Setor']).trim().toUpperCase() : null;
                const typeName = item['Tipo'] ? String(item['Tipo']).trim().toUpperCase() : null;

                // Verificar duplicidade
                const existing = await prisma.equipment.findUnique({
                    where: { code }
                });

                if (existing) {
                    skippedCount++;
                    continue;
                }

                // Resolver Relacionamentos (Setor e Tipo) - AGORA ESTRITO
                let sectorId = undefined;
                if (sectorName) {
                    const dbSector = await prisma.sector.findFirst({
                        where: { name: { equals: sectorName, mode: 'insensitive' } }
                    });

                    if (!dbSector) {
                        errors.push(`Linha ${index + 2}: Setor "${sectorName}" não encontrado.`);
                        skippedCount++;
                        continue;
                    }
                    sectorId = dbSector.id;
                }

                let typeId = undefined;
                if (typeName) {
                    const dbType = await prisma.equipmentType.findFirst({
                        where: { name: { equals: typeName, mode: 'insensitive' } }
                    });

                    if (!dbType) {
                        errors.push(`Linha ${index + 2}: Tipo "${typeName}" não encontrado.`);
                        skippedCount++;
                        continue;
                    }
                    typeId = dbType.id;
                }

                // Se não informou setor ou tipo, não vamos criar automaticamente "Estoque" ou "Outros"
                // conforme pedido de validação rígida.
                if (!sectorId) {
                    errors.push(`Linha ${index + 2}: Setor obrigatório não informado.`);
                    skippedCount++;
                    continue;
                }

                if (!typeId) {
                    errors.push(`Linha ${index + 2}: Tipo de equipamento obrigatório não informado.`);
                    skippedCount++;
                    continue;
                }

                const lastCalibrationDate = parseExcelDate(item['Data Última Calibração']);
                const dueDate = parseExcelDate(item['Data Vencimento']);

                await prisma.equipment.create({
                    data: {
                        code,
                        name,
                        manufacturerModel: item['Modelo'] ? String(item['Modelo']).trim().toUpperCase() : null,
                        resolution: item['Resolução'] ? String(item['Resolução']).trim().toUpperCase() : null,
                        capacity: item['Capacidade'] ? String(item['Capacidade']).trim().toUpperCase() : null,
                        responsible: item['Responsável'] ? String(item['Responsável']).trim().toUpperCase() : null,
                        workingRange: item['Faixa de Trabalho'] ? String(item['Faixa de Trabalho']).trim().toUpperCase() : null,
                        admissibleUncertainty: item['Incerteza Admissível'] ? String(item['Incerteza Admissível']).trim().toUpperCase() : null,
                        maxError: item['Erro Máximo'] ? String(item['Erro Máximo']).trim().toUpperCase() : null,
                        provider: item['Fornecedor'] ? String(item['Fornecedor']).trim().toUpperCase() : null,
                        unit: item['Unidade de Medida'] ? String(item['Unidade de Medida']).trim().toUpperCase() : null,
                        lastCalibrationDate,
                        dueDate,
                        status: 'REFERENCIA',
                        sectorId,
                        equipmentTypeId: typeId,
                        usageStatus: 'IN_USE'
                    }
                });

                createdCount++;

            } catch (err) {
                console.error(`Erro ao importar linha ${index}:`, err);
                errors.push(`Linha ${index + 2}: Erro interno ao salvar.`);
            }
        }

        return NextResponse.json({
            success: true,
            created: createdCount,
            skipped: skippedCount,
            errors
        });

    } catch (error) {
        console.error('Equipamentos import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
