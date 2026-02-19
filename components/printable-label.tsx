
'use client';

import { QRCodeGenerator } from './qr-code-generator';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PrintableLabelProps {
    equipment: {
        id: string;
        name: string;
        code: string;
    };
}

export function PrintableLabel({ equipment }: PrintableLabelProps) {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const qrValue = origin ? `${origin}/equipamentos/${equipment.id}` : '';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 max-w-[500px] w-full print:w-auto print:max-w-none">
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <h1 className="text-xl font-bold">Visualização de Etiqueta (50x25mm)</h1>
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>

                {/* Área da Etiqueta: 50mm x 25mm */}
                <div
                    className="border border-gray-300 print:border-none flex items-center justify-between p-1 gap-1 bg-white print:fixed print:top-0 print:left-0 text-black overflow-hidden"
                    style={{ width: '50mm', height: '25mm' }}
                >
                    {/* QR Code */}
                    <div className="flex-shrink-0 flex items-center justify-center h-full aspect-square bg-white">
                        {qrValue && (
                            <QRCodeGenerator
                                value={qrValue}
                                size={70} // Aprox 18mm
                                className="!p-0"
                            />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between flex-grow h-full py-0.5 overflow-hidden">
                        <div>
                            <h2 className="font-bold text-[8px] leading-tight line-clamp-2 w-full">{equipment.name}</h2>
                            <p className="font-mono text-[10px] font-black leading-none mt-0.5">{equipment.code}</p>
                        </div>
                        <p className="text-[6px] text-gray-600 uppercase tracking-tighter leading-none">Gestão Calibração</p>
                    </div>
                </div>

                <p className="mt-8 text-sm text-gray-500 text-center print:hidden">
                    Configuração de Impressão: Tamanho do papel 50mm x 25mm, Margens mínimas/zero.
                </p>
            </div>
        </div>
    );
}
