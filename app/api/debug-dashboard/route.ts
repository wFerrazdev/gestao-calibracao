import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: Request) {
    try {
        console.log('Debugging Dashboard API...');

        // Mock user data for testing
        const sectorId = undefined;
        const where: any = {};

        // 1. Total equipment
        console.log('1. Counting total equipment...');
        const totalEquipment = await prisma.equipment.count({ where });
        console.log('Total:', totalEquipment);

        // 2. Count by status
        console.log('2. Grouping by status...');
        const countByStatus = await prisma.equipment.groupBy({
            by: ['status'],
            where,
            _count: true,
        });
        console.log('Status counts:', countByStatus);

        // 3. Count by sector
        console.log('3. Grouping by sector...');
        const countBySector = await prisma.equipment.groupBy({
            by: ['sectorId'],
            where,
            _count: true,
        });

        // 4. Fetch sectors
        console.log('4. Fetching sectors...');
        const sectors = await prisma.sector.findMany();

        // 5. Calibration Records
        console.log('5. Fetching calibration records...');
        const twelveMonthsAgo = subMonths(new Date(), 12);
        const calibrationRecords = await prisma.calibrationRecord.findMany({
            where: {
                calibrationDate: { gte: twelveMonthsAgo },
            },
            select: {
                calibrationDate: true,
            },
        });
        console.log('Records found:', calibrationRecords.length);

        return NextResponse.json({
            success: true,
            totalEquipment,
            statusCounts: countByStatus,
            sectorsCount: sectors.length
        });

    } catch (error: any) {
        console.error('DEBUG ERROR:', error);
        return NextResponse.json(
            {
                error: error.message,
                stack: error.stack,
                name: error.name
            },
            { status: 500 }
        );
    }
}
