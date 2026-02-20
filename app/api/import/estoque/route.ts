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
                const code = item['Código'] ? String(item['Código']).trim().toUpperCase() : null;
                const name = item['Nome'] ? String(item['Nome']).trim().toUpperCase() : null;
                const typeName = item['Tipo'] ? String(item['Tipo']).trim().toUpperCase() : null;
                const location = item['Localização'] ? String(item['Localização']).trim().toUpperCase() : null;
                const model = item['Modelo'] ? String(item['Modelo']).trim().toUpperCase() : null;
                const resolution = item['Resolução'] ? String(item['Resolução']).trim().toUpperCase() : null;
                const capacity = item['Capacidade'] ? String(item['Capacidade']).trim().toUpperCase() : null;
                const responsible = item['Responsável'] ? String(item['Responsável']).trim().toUpperCase() : null;
                const workingRange = item['Faixa de Trabalho'] ? String(item['Faixa de Trabalho']).trim().toUpperCase() : null;
                const unit = item['Unidade de Medida'] ? String(item['Unidade de Medida']).trim().toUpperCase() : null;

                if (!code) {
                    errors.push(`Linha ${index + 2}: Código ausente.`);
                    continue;
                }

                // Resolver Tipo de forma Estrita
                let equipmentTypeId = undefined;
                if (typeName) {
                    const dbType = await prisma.equipmentType.findFirst({
                        where: { name: { equals: typeName, mode: 'insensitive' } }
                    });
                    if (!dbType) {
                        errors.push(`Linha ${index + 2}: Tipo "${typeName}" não encontrado.`);
                        continue;
                    }
                    equipmentTypeId = dbType.id;
                }

                // Buscar equipamento no cadastro mestre
                const equipment = await prisma.equipment.findUnique({
                    where: { code }
                });

                if (equipment) {
                    // Atualizar equipamento existente
                    await prisma.equipment.update({
                        where: { id: equipment.id },
                        data: {
                            name: name || equipment.name,
                            equipmentTypeId: equipmentTypeId || equipment.equipmentTypeId,
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

                    if (!equipmentTypeId) {
                        errors.push(`Linha ${index + 2}: Equipamento novo precisa de um Tipo válido.`);
                        continue;
                    }

                    // Resolver Setor "Estoque"
                    let dbSector = await prisma.sector.findFirst({
                        where: { name: { equals: 'ESTOQUE', mode: 'insensitive' } }
                    });

                    if (!dbSector) {
                        // Se não existe o setor ESTOQUE, criamos ele (é um setor de sistema)
                        dbSector = await prisma.sector.create({
                            data: { name: 'ESTOQUE', code: 'ESTOQUE' }
                        });
                    }

                    await prisma.equipment.create({
                        data: {
                            code,
                            name,
                            equipmentTypeId,
                            sectorId: dbSector.id,
                            location: location,
                            manufacturerModel: model,
                            resolution: resolution,
                            capacity: capacity,
                            responsible: responsible,
                            workingRange: workingRange,
                            unit: unit,
                            usageStatus: 'IN_STOCK',
                            status: 'REFERENCIA'
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
