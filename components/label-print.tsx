'use client';

import { QRCodeGenerator } from './qr-code-generator';
import { cn } from '@/lib/utils';

interface LabelPrintProps {
    equipment: {
        id: string;
        name: string;
        code: string;
        status: string;
    };
    origin: string;
    className?: string;
}

export function LabelPrint({ equipment, origin, className }: LabelPrintProps) {
    const qrValue = `${origin}/p/${equipment.id}`;

    return (
        <div className={cn("label-page bg-white text-black flex items-center p-1.5 gap-2 overflow-hidden", className)} style={{ width: '50mm', height: '25mm' }}>
            {/* QR Code (Esquerda) */}
            <div className="flex-shrink-0 flex items-center justify-center bg-white">
                <QRCodeGenerator
                    value={qrValue}
                    size={68} // Aprox 18mm
                    className="!p-0"
                />
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
                        {equipment.status === 'CALIBRADO' ? 'Calibrado' :
                            equipment.status === 'VENCIDO' ? 'Vencido' :
                                equipment.status === 'IRA_VENCER' ? 'Irá Vencer' :
                                    equipment.status === 'REFERENCIA' ? 'Referência' : equipment.status}
                    </span>
                    <img src="/logoazul.png" alt="Gatron" className="h-[6mm] object-contain" />
                </div>
            </div>
        </div>
    );
}
