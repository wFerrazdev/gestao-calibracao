import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db';
import { startOfMonth, subMonths, format } from 'date-fns';
import { EquipmentStatus, Prisma, CalibrationStatus } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        const { searchParams } = new URL(request.url);

        let sectorId = searchParams.get('sectorId') || undefined;

        // Se PRODUCAO, forçar setor do usuário
        if (user.role === 'PRODUCAO') {
            if (!user.sectorId) {
                return NextResponse.json(
                    { error: 'Usuário de produção sem setor atribuído' },
                    { status: 400 }
                );
            }
            sectorId = user.sectorId;
        }

        const where: Prisma.EquipmentWhereInput = {};
        if (sectorId) {
            where.sectorId = sectorId;
        }

        // Total de equipamentos
        const totalEquipment = await prisma.equipment.count({ where });

        // Count por status
        const countByStatus = await prisma.equipment.groupBy({
            by: ['status'],
            where,
            _count: true,
        });

        const statusCounts: Record<EquipmentStatus, number> = {
            CALIBRADO: 0,
            IRA_VENCER: 0,
            VENCIDO: 0,
            DESATIVADO: 0,
            REFERENCIA: 0,
        };

        countByStatus.forEach(item => {
            statusCounts[item.status] = item._count;
        });

        // Count por setor
        const countBySector = await prisma.equipment.groupBy({
            by: ['sectorId'],
            where,
            _count: true,
        });

        const sectors = await prisma.sector.findMany({
            where: sectorId ? { id: sectorId } : undefined,
        });

        const sectorCounts = countBySector.map(item => {
            const sector = sectors.find(s => s.id === item.sectorId);
            return {
                sectorId: item.sectorId,
                sectorName: sector?.name || 'Estoque',
                count: item._count,
            };
        });

        // Equipamentos próximos ao vencimento (próximos 10)
        const upcomingDue = await prisma.equipment.findMany({
            where: {
                ...where,
                status: { in: ['IRA_VENCER', 'VENCIDO'] },
            },
            include: {
                Sector: true,
                EquipmentType: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });

        // Calibrações por mês (últimos 12 meses)
        const twelveMonthsAgo = subMonths(new Date(), 12);

        const calibrationRecords = await prisma.calibrationRecord.findMany({
            where: {
                calibrationDate: { gte: twelveMonthsAgo },
                ...(sectorId ? { Equipment: { sectorId } } : {}),
            },
            select: {
                calibrationDate: true,
            },
        });

        const calibrationsByMonth: { [key: string]: number } = {};
        for (let i = 11; i >= 0; i--) {
            const month = subMonths(new Date(), i);
            const monthKey = format(month, 'yyyy-MM');
            calibrationsByMonth[monthKey] = 0;
        }

        calibrationRecords.forEach(record => {
            const monthKey = format(record.calibrationDate, 'yyyy-MM');
            if (calibrationsByMonth.hasOwnProperty(monthKey)) {
                calibrationsByMonth[monthKey]++;
            }
        });

        const calibrationsByMonthArray = Object.entries(calibrationsByMonth).map(
            ([month, count]) => ({
                month,
                count,
            })
        );

        // Equipamentos por tipo
        const equipmentByType = await prisma.equipment.groupBy({
            by: ['equipmentTypeId'],
            where,
            _count: true,
        });

        const types = await prisma.equipmentType.findMany();

        const equipmentByTypeArray = equipmentByType.map(item => {
            const type = types.find(t => t.id === item.equipmentTypeId);
            return {
                typeName: type?.name || 'Desconhecido',
                count: item._count,
            };
        });

        // Saúde dos setores (% calibrado)
        // Incluir "Estoque" (setorId = null)
        const allSectorHealth = await Promise.all([
            // Setores normais
            ...sectors.map(async sector => {
                const total = await prisma.equipment.count({
                    where: { sectorId: sector.id },
                });

                const calibrated = await prisma.equipment.count({
                    where: {
                        sectorId: sector.id,
                        status: 'CALIBRADO',
                    },
                });

                const score = total > 0 ? Math.round((calibrated / total) * 100) : 0;

                return {
                    sectorId: sector.id,
                    sectorName: sector.name,
                    total,
                    calibrated,
                    score,
                };
            }),
            // Item "Estoque" (equipamentos sem setor atribuído)
            (async () => {
                // Para o Estoque, ignoramos REFERENCIA no cálculo de saúde
                const total = await prisma.equipment.count({
                    where: {
                        sectorId: null,
                        status: { not: 'REFERENCIA' }
                    },
                });

                const calibrated = await prisma.equipment.count({
                    where: {
                        sectorId: null,
                        status: 'CALIBRADO',
                    },
                });

                const score = total > 0 ? Math.round((calibrated / total) * 100) : 0;

                return {
                    sectorId: 'estoque-bucket',
                    sectorName: 'Estoque',
                    total,
                    calibrated,
                    score,
                };
            })()
        ]);

        // Filtrar apenas se houver equipamentos para não poluir, mas SEMPRE permitir o bucket de Estoque se ele tiver o nome correto
        const filteredSectorHealth = allSectorHealth.filter(s => s.total > 0 || s.calibrated > 0 || s.sectorName === 'Estoque');

        // --- NOVAS METRICAS DE QUALIDADE ---

        // 1. Taxa de Aprovação (Últimos 12 meses)
        const approvalStats = await prisma.calibrationRecord.groupBy({
            by: ['status'],
            where: {
                calibrationDate: { gte: twelveMonthsAgo },
                ...(sectorId ? { Equipment: { sectorId } } : {}),
            },
            _count: true,
        });

        const approvalRate = {
            APPROVED: approvalStats.find(s => s.status === 'APPROVED')?._count || 0,
            REJECTED: approvalStats.find(s => s.status === 'REJECTED')?._count || 0,
        };

        // 2. Falhas Recentes (Últimas 5 reprovações)
        const recentFailures = await prisma.calibrationRecord.findMany({
            where: {
                status: 'REJECTED',
                ...(sectorId ? { Equipment: { sectorId } } : {}),
            },
            take: 5,
            orderBy: { calibrationDate: 'desc' },
            include: {
                Equipment: {
                    select: {
                        name: true,
                        code: true,
                    }
                }
            }
        });

        return NextResponse.json({
            totalEquipment,
            countByStatus: statusCounts,
            countBySector: sectorCounts,
            upcomingDue,
            calibrationsByMonth: calibrationsByMonthArray,
            equipmentByType: equipmentByTypeArray,
            sectorHealthScores: filteredSectorHealth,
            approvalRate,
            recentFailures,
        });
    } catch (error: unknown) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar dados do dashboard';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
