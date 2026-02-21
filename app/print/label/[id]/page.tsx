import { prisma } from '@/lib/db';
import { LabelPrint } from '@/components/label-print';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export default async function PrintLabelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            code: true,
            status: true
        }
    });

    if (!equipment) notFound();

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const proto = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    return (
        <div className="label-preview-container flex items-center justify-center min-h-screen">
            <div className="fixed top-8 left-1/2 -translate-x-1/2 print:hidden z-50">
                <button
                    onClick={() => window.print()}
                    className="bg-primary text-white px-8 py-3 rounded-md font-bold shadow-xl hover:scale-105 transition-transform"
                >
                    Imprimir Etiqueta
                </button>
            </div>

            <div className="label-preview-card print:label-page shadow-2xl">
                <LabelPrint equipment={equipment} origin={origin} />
            </div>

            <p className="fixed bottom-8 text-xs text-gray-400 print:hidden text-center max-w-sm">
                Configuração Zebra: 50x25mm, Margens Zero, Escala 100%.
            </p>
        </div>
    );
}
