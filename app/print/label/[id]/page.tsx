
import { prisma } from '@/lib/db';
import { PrintableLabel } from '@/components/printable-label';
import { notFound } from 'next/navigation';

export default async function PrintLabelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            code: true,
            status: true,
            dueDate: true,
            Sector: { select: { name: true } },
            EquipmentType: { select: { name: true } },
        }
    });

    if (!equipment) notFound();

    return <PrintableLabel equipment={equipment} />;
}
