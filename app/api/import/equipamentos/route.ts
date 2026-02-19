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

                const code = String(item['Código']).trim();
                const name = String(item['Nome']).trim();

                // Verificar duplicidade
                const existing = await prisma.equipment.findUnique({
                    where: { code }
                });

                if (existing) {
                    skippedCount++;
                    continue;
                }

                // Resolver Relacionamentos (Setor e Tipo)
                let sectorId = undefined;
                let dbSector;
                if (item['Setor']) {
                    const sectorName = String(item['Setor']).trim();
                    dbSector = await prisma.sector.findFirst({ where: { name: { equals: sectorName, mode: 'insensitive' } } });
                    if (!dbSector) {
                        dbSector = await prisma.sector.create({
                            data: {
                                name: sectorName,
                                code: sectorName.toUpperCase().slice(0, 10).replace(/\s+/g, '_')
                            }
                        });
                    }
                    sectorId = dbSector.id;
                }

                let dbType;
                let typeId = undefined;
                if (item['Tipo']) {
                    const typeName = String(item['Tipo']).trim();
                    dbType = await prisma.equipmentType.findUnique({ where: { name: typeName } });
                    if (!dbType) {
                        dbType = await prisma.equipmentType.create({ data: { name: typeName } });
                    }
                    typeId = dbType.id;
                }

                if (!sectorId) {
                    let generalSector = await prisma.sector.findFirst({ where: { name: 'Geral' } });
                    if (!generalSector) generalSector = await prisma.sector.create({ data: { name: 'Geral', code: 'GERAL' } });
                    sectorId = generalSector.id;
                }

                if (!typeId) {
                    let generalType = await prisma.equipmentType.findUnique({ where: { name: 'Outros' } });
                    if (!generalType) generalType = await prisma.equipmentType.create({ data: { name: 'Outros' } });
                    typeId = generalType.id;
                }

                const lastCalibrationDate = parseExcelDate(item['Data Última Calibração']);
                const dueDate = parseExcelDate(item['Data Vencimento']);

                await prisma.equipment.create({
                    data: {
                        code,
                        name,
                        manufacturerModel: item['Modelo'] ? String(item['Modelo']) : null,
                        resolution: item['Resolução'] ? String(item['Resolução']) : null,
                        capacity: item['Capacidade'] ? String(item['Capacidade']) : null,
                        responsible: item['Responsável'] ? String(item['Responsável']) : null,
                        workingRange: item['Faixa de Trabalho'] ? String(item['Faixa de Trabalho']) : null,
                        admissibleUncertainty: item['Incerteza Admissível'] ? String(item['Incerteza Admissível']) : null,
                        maxError: item['Erro Máximo'] ? String(item['Erro Máximo']) : null,
                        provider: item['Fornecedor'] ? String(item['Fornecedor']) : null,
                        unit: item['Unidade de Medida'] ? String(item['Unidade de Medida']) : null,
                        lastCalibrationDate,
                        dueDate,
                        status: 'VENCIDO',
                        sectorId,
                        equipmentTypeId: typeId,
                        usageStatus: 'IN_USE' // Equipamentos novos entram em uso por padrão
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
