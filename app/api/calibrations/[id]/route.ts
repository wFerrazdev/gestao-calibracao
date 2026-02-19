import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { deleteFile, extractKeyFromUrl } from '@/lib/r2';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        // Apenas ADMIN e CRIADOR podem deletar calibrações
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const calibration = await prisma.calibrationRecord.findUnique({
            where: { id },
            include: { Equipment: true },
        });

        if (!calibration) {
            return NextResponse.json(
                { error: 'Calibração não encontrada' },
                { status: 404 }
            );
        }

        // Deletar arquivo do R2 se existir
        if (calibration.attachmentKey) {
            await deleteFile(calibration.attachmentKey);
        } else if (calibration.attachmentUrl) {
            const key = extractKeyFromUrl(calibration.attachmentUrl);
            if (key) await deleteFile(key);
        }

        await prisma.calibrationRecord.delete({ where: { id } });

        // Recalcular última calibração do equipamento
        const latestCalibration = await prisma.calibrationRecord.findFirst({
            where: { equipmentId: calibration.equipmentId },
            orderBy: { calibrationDate: 'desc' },
        });

        if (latestCalibration) {
            await prisma.equipment.update({
                where: { id: calibration.equipmentId },
                data: {
                    lastCalibrationDate: latestCalibration.calibrationDate,
                    lastCertificateNumber: latestCalibration.certificateNumber,
                },
            });
        } else {
            // Sem calibrações restantes
            await prisma.equipment.update({
                where: { id: calibration.equipmentId },
                data: {
                    lastCalibrationDate: null,
                    lastCertificateNumber: null,
                    dueDate: null,
                },
            });
        }

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'CalibrationRecord',
            entityId: id,
            action: 'DELETE',
            metadata: {
                equipmentId: calibration.equipmentId,
                calibrationDate: calibration.calibrationDate,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting calibration:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar calibração' },
            { status: 500 }
        );
    }
}
