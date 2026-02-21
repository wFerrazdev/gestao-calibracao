import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { calculateEquipmentStatus } from '@/lib/equipment/calculate-status';
import { EquipmentStatus, CalibrationStatus, Prisma } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { getCalibrationResult, parseCalibrationValue } from '@/lib/utils/calibration-logic';

interface CreateCalibrationBody {
    calibrationDate: string;
    certificateNumber?: string;
    performedBy?: string;
    notes?: string;
    error?: string | number;
    uncertainty?: string | number;
    attachmentKey?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentMime?: string;
    attachmentSize?: number;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        // Paginação
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

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

        // Buscar calibrações com paginação e contagem total
        const [calibrations, total] = await Promise.all([
            prisma.calibrationRecord.findMany({
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
                skip,
                take: limit,
            }),
            prisma.calibrationRecord.count({
                where: { equipmentId: id },
            })
        ]);

        return NextResponse.json({
            calibrations,
            total,
            hasMore: total > skip + calibrations.length,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Erro na API de calibrações:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
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
        const body: CreateCalibrationBody = await request.json();

        // 🛡️ SEGURANÇA: Apenas QUALIDADE, ADMIN e CRIADOR podem criar calibrações
        if (!['QUALIDADE', 'ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente para registrar calibrações' },
                { status: 403 }
            );
        }

        // Pegar equipamento e sua regra
        const equipment = await prisma.equipment.findUnique({
            where: { id },
            include: {
                EquipmentType: {
                    include: {
                        CalibrationRule: true,
                    },
                },
            },
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
        }

        // 🛡️ SEGURANÇA: Validar IDOR - Usuário PRODUCAO só pode ver seu setor (e aqui nem deveria estar criando)
        // Mas por via das dúvidas, se o papel permitir no futuro, o lock de setor deve ser mantido:
        if (user.role === 'PRODUCAO' && equipment.sectorId !== user.sectorId) {
            return NextResponse.json(
                { error: 'Acesso negado a este equipamento' },
                { status: 403 }
            );
        }

        // Nova Lógica de Aprovação/Reprovação: Erro > Incerteza
        const calibrationStatus: CalibrationStatus = getCalibrationResult(body.error, body.uncertainty) || 'APPROVED';

        // Parsing dos valores numericamente
        const errorVal = parseCalibrationValue(body.error);
        const uncertaintyVal = parseCalibrationValue(body.uncertainty);

        const calibration = await prisma.calibrationRecord.create({
            data: {
                equipmentId: id,
                createdByUserId: user.id,
                calibrationDate: new Date(body.calibrationDate),
                certificateNumber: body.certificateNumber || '',
                notes: body.notes,
                error: errorVal,
                uncertainty: uncertaintyVal,
                status: calibrationStatus,
                attachmentKey: body.attachmentKey,
                attachmentUrl: body.attachmentUrl,
                attachmentName: body.attachmentName,
                attachmentMime: body.attachmentMime,
                attachmentSize: body.attachmentSize,
            },
        });

        // Calcular novo status do equipamento e próxima calibração
        const newStatus = calculateEquipmentStatus(
            new Date(body.calibrationDate),
            equipment.EquipmentType.CalibrationRule
        );

        await prisma.equipment.update({
            where: { id },
            data: {
                lastCalibrationDate: new Date(body.calibrationDate),
                lastCertificateNumber: body.certificateNumber,
                dueDate: newStatus.dueDate,
                status: newStatus.status as EquipmentStatus,
            },
        });

        // Log de Auditoria
        await createAuditLog({
            actorUserId: user.id,
            action: 'CREATE',
            entityType: 'CALIBRATION',
            entityId: calibration.id,
            metadata: {
                equipmentId: id,
                certificateNumber: body.certificateNumber,
                calibrationStatus
            }
        });

        return NextResponse.json(calibration);
    } catch (error: any) {
        console.error('Erro ao criar calibração:', error);
        return NextResponse.json(
            { error: 'Erro ao registrar calibração' },
            { status: 500 }
        );
    }
}
