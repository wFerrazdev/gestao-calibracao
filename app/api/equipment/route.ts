import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { queryEquipmentSchema } from '@/lib/validations/schemas';
import { calculateEquipmentStatus } from '@/lib/equipment/calculate-status';

import { createAuditLog } from '@/lib/audit';
import { AuditAction } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        const { searchParams } = new URL(request.url);

        // Parse e validar query params
        const queryParams = {
            sectorId: searchParams.get('sectorId') || undefined,
            status: searchParams.get('status') || undefined,
            q: searchParams.get('q') || undefined,
            page: searchParams.get('page') || '1',
            pageSize: searchParams.get('pageSize') || '20',
            sortBy: searchParams.get('sortBy') || 'dueDate',
            usageStatus: searchParams.get('usageStatus') || undefined,
            equipmentTypeId: searchParams.get('equipmentTypeId') || undefined,
        };

        const validation = queryEquipmentSchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Parâmetros inválidos', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { sectorId, status, q, page, pageSize, sortBy, usageStatus, equipmentTypeId } = validation.data;

        // Se role=PRODUCAO, forçar sectorId para o setor do usuário
        let finalSectorId = sectorId;
        if (user.role === 'PRODUCAO') {
            if (!user.sectorId) {
                return NextResponse.json(
                    { error: 'Usuário de produção sem setor atribuído' },
                    { status: 400 }
                );
            }
            finalSectorId = user.sectorId;
        }

        // Construir where clause
        const where: any = {};

        if (finalSectorId) {
            where.sectorId = finalSectorId;
        }

        if (status) {
            where.status = status;
        }

        if (usageStatus) {
            where.usageStatus = usageStatus;
        }

        if (equipmentTypeId) {
            where.equipmentTypeId = equipmentTypeId;
        }

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
                { manufacturerModel: { contains: q, mode: 'insensitive' } },
            ];
        }

        // Paginação
        const skip = (parseInt(page) - 1) * parseInt(pageSize);
        const take = parseInt(pageSize);

        // Ordenação
        let orderBy: any = {};
        if (sortBy === 'dueDate') {
            orderBy = { dueDate: 'asc' };
        } else if (sortBy === 'name') {
            orderBy = { name: 'asc' };
        } else if (sortBy === 'code') {
            orderBy = { code: 'asc' };
        }

        const [equipment, total] = await Promise.all([
            prisma.equipment.findMany({
                where,
                include: {
                    Sector: true,
                    EquipmentType: true,
                },
                orderBy,
                skip,
                take,
            }),
            prisma.equipment.count({ where }),
        ]);

        return NextResponse.json({
            items: equipment,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / parseInt(pageSize)),
        });
    } catch (error: any) {
        console.error('Error fetching equipment:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar equipamentos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas ADMIN e CRIADOR podem criar equipamentos
        if (!['ADMIN', 'CRIADOR'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Permissão insuficiente' },
                { status: 403 }
            );
        }

        const body = await request.json() as any; // TODO: Define strict type or use zod schema validation

        // Buscar regra de calibração para calcular vencimento
        const calibrationRule = await prisma.calibrationRule.findUnique({
            where: { equipmentTypeId: body.equipmentTypeId },
        });

        // Calcular status e vencimento se houver última calibração
        let dueDate = null;
        let status: 'CALIBRADO' | 'IRA_VENCER' | 'VENCIDO' | 'DESATIVADO' | 'REFERENCIA' = 'VENCIDO';

        if (body.lastCalibrationDate && calibrationRule) {
            const result = calculateEquipmentStatus(
                new Date(body.lastCalibrationDate),
                calibrationRule
            );
            dueDate = result.dueDate;
            status = result.status;
        } else {
            // Se não tem data de calibração, deve ser REFERÊNCIA (prioridade máxima)
            status = 'REFERENCIA';
        }

        const equipment = await prisma.equipment.create({
            data: {
                name: body.name,
                code: body.code,
                manufacturerModel: body.manufacturerModel,
                resolution: body.resolution,
                capacity: body.capacity,
                responsible: body.responsible,
                workingRange: body.workingRange || null,
                admissibleUncertainty: body.admissibleUncertainty || null,
                maxError: body.maxError || null,
                provider: body.provider || null,
                unit: body.unit || null,
                location: body.location || null,
                notes: body.notes,
                sectorId: body.sectorId || null,
                equipmentTypeId: body.equipmentTypeId,
                lastCalibrationDate: body.lastCalibrationDate ? new Date(body.lastCalibrationDate) : null,
                lastCertificateNumber: body.lastCertificateNumber,
                dueDate,
                status,
                usageStatus: body.usageStatus || 'IN_USE',
                imageUrl: body.imageUrl,
            },
            include: {
                Sector: true,
                EquipmentType: true,
            },
        });

        await createAuditLog({
            actorUserId: user.id,
            entityType: 'Equipment',
            entityId: equipment.id,
            action: AuditAction.CREATE,
            metadata: { name: equipment.name, code: equipment.code }
        });

        return NextResponse.json(equipment, { status: 201 });
    } catch (error: any) {
        console.error('Error creating equipment:', error);

        // Tratar erro de código duplicado (Unique constraint)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Já existe um equipamento cadastrado com este Código.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Erro ao criar equipamento' },
            { status: 500 }
        );
    }
}
