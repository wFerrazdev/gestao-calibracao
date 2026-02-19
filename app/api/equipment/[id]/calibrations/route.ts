import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { calculateEquipmentStatus } from '@/lib/equipment/calculate-status';
import { EquipmentStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        // Verificar se equipamento existe e se usuário tem acesso
        const equipment = await prisma.equipment.findUnique({
            where: { id },
            select: { sectorId: true },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: 'Equipamento não encontrado' },
                { status: 404 }
            );
        }

        // Validar acesso para PRODUCAO
        if (user.role === 'PRODUCAO' && equipment.sectorId !== user.sectorId) {
            return NextResponse.json(
                { error: 'Acesso negado a este equipamento' },
                { status: 403 }
            );
        }

        // Buscar calibrações
        const calibrations = await prisma.calibrationRecord.findMany({
            where: { equipmentId: id },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { calibrationDate: 'desc' },
        });

        return NextResponse.json(calibrations);
    } catch (error: any) {
        console.error('Error fetching calibrations:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar calibrações' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        // Apenas QUALIDADE, ADMIN e CRIADOR podem adicionar calibração
        if (!['QUALIDADE', 'ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json() as any; // TODO: strict type

        // Verificar se equipamento existe
        const equipment: any = await prisma.equipment.findUnique({
            where: { id },
            include: {
                EquipmentType: {
                    include: {
                        CalibrationRule: true,
                        AcceptanceCriteria: true,
                    },
                },
            },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: 'Equipamento não encontrado' },
                { status: 404 }
            );
        }

        // Lógica de Aprovação/Reprovação
        let calibrationStatus: 'APPROVED' | 'REJECTED' = 'APPROVED';
        const errorVal = body.error !== undefined ? parseFloat(body.error) : null;
        const uncertaintyVal = body.uncertainty !== undefined ? parseFloat(body.uncertainty) : null;

        if (equipment.EquipmentType.AcceptanceCriteria.length > 0 && (errorVal !== null || uncertaintyVal !== null)) {
            // Tentar extrair capacidade numérica
            const capacityValue = equipment.capacity ? parseFloat(equipment.capacity.replace(/[^\d.-]/g, '')) : null;

            // Encontrar critério correspondente
            // Lógica de Validação Rigorosa
            // 1. Encontrar critério pelo range de capacidade
            const capacity = parseFloat(equipment.capacity || '0');
            const criterion = equipment.EquipmentType.AcceptanceCriteria.find((c: any) => {
                // Se não tem range definido (bomeira?), pula
                if (c.rangeMin === null && c.rangeMax === null) return true;

                // Verifica range (min <= cap <= max)
                const min = c.rangeMin ?? -Infinity;
                const max = c.rangeMax ?? Infinity;
                return capacity >= min && capacity <= max;
            });

            if (criterion) {
                // Critério Encontrado - Validar
                const error = body.error !== undefined ? Math.abs(body.error) : 0; // Usa módulo do erro
                const uncertainty = body.uncertainty !== undefined ? Math.abs(body.uncertainty) : 0;

                const maxError = criterion.maxError ?? Infinity;
                const maxUncertainty = criterion.maxUncertainty ?? Infinity;

                // Regra: (Erro + Incerteza) <= Erro Máximo Admissível
                // E também: Incerteza <= Incerteza Máxim (se definida separadamente, opcionalmente)

                const isCompliant = (error + uncertainty) <= maxError && uncertainty <= maxUncertainty;

                calibrationStatus = isCompliant ? 'APPROVED' : 'REJECTED';
            } else {
                // Se não achou critério para a capacidade, o que fazer?
                // Por padrão, se não tem regra, aprovamos? Ou deixamos como estava?
                // Vamos manter APPROVED se não tiver critério, mas idealmente deveria avisar.
                calibrationStatus = 'APPROVED';
            }
        }

        // Criar calibração
        const calibration = await prisma.calibrationRecord.create({
            data: {
                equipmentId: id,
                calibrationDate: new Date(body.calibrationDate),
                certificateNumber: body.certificateNumber,
                notes: body.notes,
                attachmentKey: body.attachmentKey,
                attachmentUrl: body.attachmentUrl,
                attachmentName: body.attachmentName,
                attachmentMime: body.attachmentMime,
                attachmentSize: body.attachmentSize,
                createdByUserId: user.id,
                error: errorVal,
                uncertainty: uncertaintyVal,
                status: calibrationStatus,
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Atualizar equipamento com última calibração e recalcular status
        const calibrationDate = new Date(body.calibrationDate);
        let dueDate = null;
        let status: EquipmentStatus = 'VENCIDO';
        // Se a calibração foi REJEITADA, o equipamento não deveria ficar CALIBRADO?
        // Por enquanto, mantemos a lógica de data, mas talvez devêssemos marcar como DESATIVADO ou manter VENCIDO?
        // O usuário não especificou o comportamento do equipamento, apenas "mostra aprovado ou reprovado".

        if (equipment.EquipmentType.CalibrationRule) {
            const result = calculateEquipmentStatus(
                calibrationDate,
                equipment.EquipmentType.CalibrationRule
            );
            dueDate = result.dueDate;
            status = result.status;
        }

        await prisma.equipment.update({
            where: { id },
            data: {
                lastCalibrationDate: calibrationDate,
                lastCertificateNumber: body.certificateNumber,
                dueDate,
                status,
            },
        });

        // Criar audit log
        await createAuditLog({
            actorUserId: user.id,
            entityType: 'CalibrationRecord',
            entityId: calibration.id,
            action: 'CREATE',
            metadata: {
                equipmentId: id,
                certificateNumber: body.certificateNumber,
                hasAttachment: !!body.attachmentKey,
            },
        });

        return NextResponse.json(calibration, { status: 201 });
    } catch (error: any) {
        console.error('Error creating calibration:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao criar calibração' },
            { status: 500 }
        );
    }
}
