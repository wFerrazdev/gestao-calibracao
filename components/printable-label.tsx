
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

    const qrValue = origin ? `${origin}/p/${equipment.id}` : '';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 max-w-[500px] w-full print:w-auto print:max-w-none">
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <h1 className="text-xl font-bold text-gray-900">Visualização de Etiqueta (50x25mm)</h1>
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>

                {/* Área da Etiqueta: 50mm x 25mm para Zebra */}
                <div
                    className="border border-gray-300 print:border-none flex items-center p-1.5 gap-2 bg-white print:fixed print:top-0 print:left-0 text-black overflow-hidden"
                    style={{ width: '50mm', height: '25mm' }}
                >
                    {/* QR Code (Esquerda) */}
                    <div className="flex-shrink-0 flex items-center justify-center bg-white">
                        {qrValue && (
                            <QRCodeGenerator
                                value={qrValue}
                                size={68} // Aprox 18mm - Compacto p/ 25mm de altura
                                className="!p-0"
                            />
                        )}
                    </div>

                    {/* Conteúdo (Direita) */}
                    <div className="flex flex-col justify-between flex-grow h-full py-0.5 overflow-hidden border-l border-gray-100 pl-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-start">
                                <p className="font-mono text-[10px] font-black leading-none bg-black text-white px-1 py-0.5 rounded-sm">
                                    {equipment.code}
                                </p>
                            </div>
                            <h2 className="font-bold text-[8px] leading-tight line-clamp-2 mt-1 uppercase text-black">
                                {equipment.name}
                            </h2>
                        </div>

                        <div className="flex items-end justify-between mt-auto">
                            <span className="text-[6px] text-gray-500 font-bold uppercase tracking-wider">
                                Calibração
                            </span>
                            <img src="/logoazul.png" alt="Gatron" className="h-[6mm] object-contain" />
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-sm text-gray-500 text-center print:hidden">
                    Configuração de Impressão: Tamanho do papel 50mm x 25mm, Margens mínimas/zero.
                </p>
            </div>
        </div>
    );
}
