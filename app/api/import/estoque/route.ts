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
                const name = item['Nome'] ? String(item['Nome']).trim() : null;
                const typeName = item['Tipo'] ? String(item['Tipo']).trim() : null;
                const location = item['Localização'] ? String(item['Localização']).trim() : null;
                const model = item['Modelo'] ? String(item['Modelo']).trim() : null;
                const resolution = item['Resolução'] ? String(item['Resolução']).trim() : null;
                const capacity = item['Capacidade'] ? String(item['Capacidade']).trim() : null;
                const responsible = item['Responsável'] ? String(item['Responsável']).trim() : null;
                const workingRange = item['Faixa de Trabalho'] ? String(item['Faixa de Trabalho']).trim() : null;
                const unit = item['Unidade de Medida'] ? String(item['Unidade de Medida']).trim() : null;

                if (!code) {
                    errors.push(`Linha ${index + 2}: Código ausente.`);
                    continue;
                }

                // Buscar equipamento no cadastro mestre
                const equipment = await prisma.equipment.findUnique({
                    where: { code }
                });

                if (equipment) {
                    // Atualizar equipamento existente
                    let equipmentTypeId = equipment.equipmentTypeId;
                    if (typeName) {
                        let dbType = await prisma.equipmentType.findUnique({ where: { name: typeName } });
                        if (!dbType) {
                            dbType = await prisma.equipmentType.create({ data: { name: typeName } });
                        }
                        equipmentTypeId = dbType.id;
                    }

                    await prisma.equipment.update({
                        where: { id: equipment.id },
                        data: {
                            name: name || equipment.name,
                            equipmentTypeId,
                            location: location || equipment.location,
                            manufacturerModel: model || equipment.manufacturerModel,
                            resolution: resolution || equipment.resolution,
                            capacity: capacity || equipment.capacity,
                            responsible: responsible || equipment.responsible,
                            workingRange: workingRange || equipment.workingRange,
                            unit: unit || equipment.unit,
                            usageStatus: 'IN_STOCK'
                        }
                    });
                    updatedCount++;
                } else {
                    // Criar novo equipamento diretamente no estoque
                    if (!name) {
                        errors.push(`Linha ${index + 2}: Equipamento novo precisa de um Nome.`);
                        continue;
                    }

                    // Resolver Setor "Estoque" para novos itens se não houver lógica de setor no template de estoque
                    let dbSector = await prisma.sector.findFirst({ where: { name: 'Estoque' } });
                    if (!dbSector) {
                        dbSector = await prisma.sector.create({ data: { name: 'Estoque', code: 'ESTOQUE' } });
                    }

                    // Resolver Tipo
                    let typeId;
                    if (typeName) {
                        let dbType = await prisma.equipmentType.findUnique({ where: { name: typeName } });
                        if (!dbType) {
                            dbType = await prisma.equipmentType.create({ data: { name: typeName } });
                        }
                        typeId = dbType.id;
                    } else {
                        let dbType = await prisma.equipmentType.findUnique({ where: { name: 'Outros' } });
                        if (!dbType) {
                            dbType = await prisma.equipmentType.create({ data: { name: 'Outros' } });
                        }
                        typeId = dbType.id;
                    }

                    await prisma.equipment.create({
                        data: {
                            code,
                            name,
                            equipmentTypeId: typeId,
                            sectorId: dbSector.id,
                            location: location,
                            manufacturerModel: model,
                            resolution: resolution,
                            capacity: capacity,
                            responsible: responsible,
                            workingRange: workingRange,
                            unit: unit,
                            usageStatus: 'IN_STOCK',
                            status: 'REFERENCIA' // Padrão para novos sem data de calibração
                        }
                    });
                    updatedCount++;
                }

                // (Increment handled inside if/else)
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
