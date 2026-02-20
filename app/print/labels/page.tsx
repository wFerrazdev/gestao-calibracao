import { prisma } from '@/lib/db';
import { LabelPrint } from '@/components/label-print';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export default async function BatchPrintPage({
    searchParams
}: {
    searchParams: Promise<{ ids?: string }>
}) {
    const { ids: idsCsv } = await searchParams;
    if (!idsCsv) return notFound();

    const ids = idsCsv.split(',');

    // Busca equipamentos e seus últimos certificados aprovados
    const items = await prisma.equipment.findMany({
        where: {
            id: { in: ids }
        },
        include: {
            CalibrationRecord: {
                where: { status: 'APPROVED' },
                orderBy: { calibrationDate: 'desc' },
                take: 1
            }
        }
    });

    // Cabeçalhos para pegar a origem
    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    // Sem filtros: renderiza todos os itens selecionados
    const eligibleItems = items;

    return (
        <div className="label-preview-container">
            <div className="flex flex-col items-center gap-4 mb-8 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Prévia de Impressão Zebra</h1>
                <p className="text-sm text-gray-600 max-w-md text-center">
                    Preparado para imprimir <strong>{eligibleItems.length}</strong> etiquetas.
                </p>
                <div className="flex gap-4 mt-2">
                    <button
                        onClick={() => window.print()}
                        className="bg-primary text-white px-6 py-2 rounded-md font-bold hover:opacity-90 transition-opacity"
                    >
                        Imprimir Agora
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="bg-zinc-200 text-zinc-900 px-6 py-2 rounded-md font-bold"
                    >
                        Fechar
                    </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-xs text-blue-800 space-y-1">
                    <p><strong>Configuração Recomendada:</strong></p>
                    <ul className="list-disc list-inside">
                        <li>Tamanho do papel: 50mm x 25mm</li>
                        <li>Margens: Nenhuma</li>
                        <li>Cabeçalhos/Rodapés: Desmarcado</li>
                        <li>Escala: 100%</li>
                    </ul>
                </div>
            </div>

            {/* Renderização das etiquetas */}
            <div className="flex flex-col gap-4 print:gap-0 print:block">
                {eligibleItems.map((item) => (
                    <div key={item.id} className="label-preview-card print:label-page">
                        <LabelPrint equipment={item} origin={origin} />
                    </div>
                ))}
            </div>

            {/* Script de Auto-Print */}
            <script dangerouslySetInnerHTML={{
                __html: `
                window.onload = () => {
                   // Pequeno delay para garantir renderização do QR
                   setTimeout(() => {
                        window.print();
                   }, 500);
                }
            `}} />
        </div>
    );
}
