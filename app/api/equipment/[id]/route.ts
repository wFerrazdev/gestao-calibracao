import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { calculateEquipmentStatus } from '@/lib/equipment/calculate-status';
import { createAuditLog } from '@/lib/audit';
import { AuditAction } from '@prisma/client';
import { deleteFile, extractKeyFromUrl } from '@/lib/r2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        const equipment = await prisma.equipment.findUnique({
            where: { id },
            include: {
                Sector: true,
                EquipmentType: {
                    include: {
                        CalibrationRule: true, // Fixed relation name
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

        // Se role=PRODUCAO, validar acesso ao setor
        if (user.role === 'PRODUCAO' && equipment.sectorId !== user.sectorId) {
            return NextResponse.json(
                { error: 'Acesso negado a este equipamento' },
                { status: 403 }
            );
        }

        return NextResponse.json(equipment);
    } catch (error: any) {
        console.error('Error fetching equipment:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar equipamento' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        // Apenas ADMIN e CRIADOR podem editar
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Verificar se equipamento existe
        const existing = await prisma.equipment.findUnique({ where: { id } });

        if (!existing) {
            return NextResponse.json(
                { error: 'Equipamento não encontrado' },
                { status: 404 }
            );
        }

        // Se modificou tipo ou data calibração, recalcular status
        let updateData: any = { ...body };

        if (body.lastCalibrationDate || body.equipmentTypeId) {
            const equipmentTypeId = body.equipmentTypeId || existing.equipmentTypeId;
            const calibrationRule = await prisma.calibrationRule.findUnique({
                where: { equipmentTypeId },
            });

            if (calibrationRule) {
                const lastCalDate = body.lastCalibrationDate
                    ? new Date(body.lastCalibrationDate)
                    : existing.lastCalibrationDate;

                if (lastCalDate) {
                    const result = calculateEquipmentStatus(lastCalDate, calibrationRule);
                    updateData.dueDate = result.dueDate;
                    updateData.status = result.status;
                }
            }
        }

        // Converter data se necessário
        if (updateData.lastCalibrationDate) {
            updateData.lastCalibrationDate = new Date(updateData.lastCalibrationDate);
        }

        const equipment = await prisma.equipment.update({
            where: { id },
            data: updateData,
            include: {
                Sector: true,
                EquipmentType: true,
            },
        });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'Equipment',
            entityId: equipment.id,
            action: AuditAction.UPDATE,
            metadata: {
                changes: Object.keys(body),
                from: {
                    status: existing.status,
                    usageStatus: existing.usageStatus,
                    sectorId: existing.sectorId,
                    location: existing.location
                },
                to: {
                    status: equipment.status,
                    usageStatus: equipment.usageStatus,
                    sectorId: equipment.sectorId,
                    location: equipment.location
                }
            }
        });

        return NextResponse.json(equipment);
    } catch (error: any) {
        console.error('Error updating equipment:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar equipamento' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        // Apenas ADMIN e CRIADOR podem deletar
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }


        // Verificar se existe
        const existing = await prisma.equipment.findUnique({
            where: { id },
            include: { CalibrationRecord: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Equipamento não encontrado' },
                { status: 404 }
            );
        }

        // Deletar arquivos do R2 (Certificados e Foto do Equipamento)
        const deletePromises: Promise<void>[] = [];

        // 1. Deletar certificados
        if (existing.CalibrationRecord && existing.CalibrationRecord.length > 0) {
            existing.CalibrationRecord.forEach((record) => {
                if (record.attachmentKey) {
                    deletePromises.push(deleteFile(record.attachmentKey));
                } else if (record.attachmentUrl) {
                    const key = extractKeyFromUrl(record.attachmentUrl);
                    if (key) deletePromises.push(deleteFile(key));
                }
            });
        }

        // 2. Deletar foto do equipamento
        if (existing.imageUrl) {
            const key = extractKeyFromUrl(existing.imageUrl);
            if (key) deletePromises.push(deleteFile(key));
        }

        // Executar deleções de arquivos em paralelo (não bloquear se falhar)
        await Promise.allSettled(deletePromises);

        // Deletar calibrações em cascata (já configurado no schema)
        await prisma.equipment.delete({ where: { id } });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'Equipment',
            entityId: id,
            action: AuditAction.DELETE,
            metadata: { name: existing.name, code: existing.code }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting equipment:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar equipamento' },
            { status: 500 }
        );
    }
}
