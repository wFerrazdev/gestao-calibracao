
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

// Helper para processar data do Excel (que pode vir como número serial ou string)
function parseExcelDate(excelDate: any): Date | null {
    if (!excelDate) return null;

    // Se for objeto Date
    if (excelDate instanceof Date) return excelDate;

    // Se for string ISO ou pt-BR
    if (typeof excelDate === 'string') {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) return date;
        return null;
    }

    // Se for número serial do Excel (dias desde 1900-01-01)
    if (typeof excelDate === 'number') {
        // Excel base date logic
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

        // Processar item por item (transacional seria ideal, mas pode ser lento para muitos itens, 
        // ou bloquear demais. Vamos fazer sequencial para garantir connectOrCreate funciona bem).

        for (const [index, item] of items.entries()) {
            try {
                // Campos obrigatórios mínimos
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
                    continue; // Pula existentes (estratégia definida no plano)
                }

                // Resolver Relacionamentos (Setor e Tipo)
                let sectorId = undefined;
                if (item['Setor']) {
                    const sectorName = String(item['Setor']).trim();
                    const sector = await prisma.sector.upsert({
                        where: { code: sectorName.toUpperCase().replace(/\s+/g, '_') }, // Tentativa de gerar um código único simples
                        update: {}, // Não atualiza se existe, só retorna
                        create: {
                            name: sectorName,
                            code: sectorName.toUpperCase().replace(/\s+/g, '_')
                        }
                    });
                    // Onde where code pode falhar se o code for null no schema ou não for único confiável.
                    // O Schema diz Sector code @unique, mas é opcional.
                    // Melhor estratégia: Find by name first? 
                    // Prisma não busca por campo não-único no connectOrCreate/upsert where.
                    // Vamos buscar na mão.
                }

                // Melhora na lógica de Setor: buscar pelo nome, se não achar, criar.
                let dbSector;
                if (item['Setor']) {
                    const sectorName = String(item['Setor']).trim();
                    dbSector = await prisma.sector.findFirst({ where: { name: { equals: sectorName, mode: 'insensitive' } } });
                    if (!dbSector) {
                        dbSector = await prisma.sector.create({ data: { name: sectorName, code: sectorName.toUpperCase().slice(0, 10).replace(/\s+/g, '_') } });
                    }
                    sectorId = dbSector.id;
                }

                // Lógica de Tipo
                let dbType;
                let typeId = undefined;
                if (item['Tipo']) {
                    const typeName = String(item['Tipo']).trim();
                    dbType = await prisma.equipmentType.findUnique({ where: { name: typeName } }); // name é unique no schema
                    if (!dbType) {
                        dbType = await prisma.equipmentType.create({ data: { name: typeName } });
                    }
                    typeId = dbType.id;
                }

                // Se não tem setor ou tipo, precisamos de valores default ou falhar?
                // O schema diz que Sector relation field [sectorId] references [id]. É obrigatório no modelo Equipment?
                // model Equipment { sectorId String ... } -> Sim, obrigatório.
                // Precisamos garantir que tenha um setor e tipo.

                if (!sectorId) {
                    // Tentar achar um setor "Geral" ou criar
                    let generalSector = await prisma.sector.findFirst({ where: { name: 'Geral' } });
                    if (!generalSector) generalSector = await prisma.sector.create({ data: { name: 'Geral', code: 'GERAL' } });
                    sectorId = generalSector.id;
                }

                if (!typeId) {
                    let generalType = await prisma.equipmentType.findUnique({ where: { name: 'Outros' } });
                    if (!generalType) generalType = await prisma.equipmentType.create({ data: { name: 'Outros' } });
                    typeId = generalType.id;
                }

                // Parse datas
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
                        // location não vem na planilha, mas podemos prever
                        location: item['Localização'] ? String(item['Localização']) : null,
                        lastCalibrationDate,
                        dueDate,
                        status: 'VENCIDO', // Default status, calculado depois ou definido aqui
                        sectorId,
                        equipmentTypeId: typeId
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
        console.error('Batch import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
