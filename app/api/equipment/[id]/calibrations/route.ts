import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { calculateEquipmentStatus } from '@/lib/equipment/calculate-status';
import { EquipmentStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { getCalibrationResult, parseCalibrationValue } from '@/lib/utils/calibration-logic';

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
                where: { equipmentId: id }
            })
        ]);

        return NextResponse.json({
            calibrations,
            total,
            hasMore: skip + calibrations.length < total
        });
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

        const body = await request.json() as any;

        // Verificar se equipamento existe
        const equipment: any = await prisma.equipment.findUnique({
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
            return NextResponse.json(
                { error: 'Equipamento não encontrado' },
                { status: 404 }
            );
        }

        // Lógica de Aprovação/Reprovação (Nova Regra: erro > incerteza)
        const calibrationStatus = getCalibrationResult(body.error, body.uncertainty);
        const errorVal = parseCalibrationValue(body.error);
        const uncertaintyVal = parseCalibrationValue(body.uncertainty);

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
                status: calibrationStatus
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
