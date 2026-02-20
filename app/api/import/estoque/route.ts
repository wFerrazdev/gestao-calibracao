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
                // Mapeamento para chaves em MAIÚSCULO conforme o template
                const codeRaw = item['CÓDIGO'] || item['Código'];
                const nameRaw = item['NOME'] || item['Nome'];
                const typeRaw = item['TIPO'] || item['Tipo'];
                const locationRaw = item['LOCALIZAÇÃO'] || item['Localização'];
                const modelRaw = item['MODELO'] || item['Modelo'];
                const resolutionRaw = item['RESOLUÇÃO'] || item['Resolução'];
                const capacityRaw = item['CAPACIDADE'] || item['Capacidade'];
                const responsibleRaw = item['RESPONSÁVEL'] || item['Responsável'];
                const workingRangeRaw = item['FAIXA DE TRABALHO'] || item['Faixa de Trabalho'];
                const unitRaw = item['UNIDADE DE MEDIDA'] || item['Unidade de Medida'];

                const code = codeRaw ? String(codeRaw).trim().toUpperCase() : null;
                const name = nameRaw ? String(nameRaw).trim().toUpperCase() : null;
                const typeName = typeRaw ? String(typeRaw).trim().toUpperCase() : null;
                const location = locationRaw ? String(locationRaw).trim().toUpperCase() : null;
                const model = modelRaw ? String(modelRaw).trim().toUpperCase() : null;
                const resolution = resolutionRaw ? String(resolutionRaw).trim().toUpperCase() : null;
                const capacity = capacityRaw ? String(capacityRaw).trim().toUpperCase() : null;
                const responsible = responsibleRaw ? String(responsibleRaw).trim().toUpperCase() : null;
                const workingRange = workingRangeRaw ? String(workingRangeRaw).trim().toUpperCase() : null;
                const unit = unitRaw ? String(unitRaw).trim().toUpperCase() : null;

                if (!code) {
                    errors.push(`Linha ${index + 2}: CÓDIGO ausente.`);
                    continue;
                }

                // Resolver Tipo de forma Estrita
                let equipmentTypeId = undefined;
                if (typeName) {
                    const dbType = await prisma.equipmentType.findFirst({
                        where: { name: { equals: typeName, mode: 'insensitive' } }
                    });
                    if (!dbType) {
                        errors.push(`Linha ${index + 2}: TIPO "${typeName}" não encontrado.`);
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
                        errors.push(`Linha ${index + 2}: Equipamento novo precisa de um NOME.`);
                        continue;
                    }

                    if (!equipmentTypeId) {
                        errors.push(`Linha ${index + 2}: Equipamento novo precisa de um TIPO válido.`);
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
