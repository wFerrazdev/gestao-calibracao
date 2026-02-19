import { FileText, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalibrationRecord {
    id: string;
    calibrationDate: string;
    certificateNumber: string | null;
    error: number | null;
    uncertainty: number | null;
    status: 'APPROVED' | 'REJECTED' | null;
    notes: string | null;
    attachmentUrl: string | null;
    attachmentKey: string | null;
}

interface CalibrationTimelineItemProps {
    calibration: CalibrationRecord;
    onDelete: (id: string) => void;
    isCreator: boolean;
    index: number;
}

export function CalibrationTimelineItem({
    calibration,
    onDelete,
    isCreator,
    index
}: CalibrationTimelineItemProps) {
    const { firebaseUser } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);
    const isApproved = calibration.status === 'APPROVED';
    const isRejected = calibration.status === 'REJECTED';
    const isNeutral = !calibration.status;

    const handleDownload = async () => {
        if (!calibration.attachmentKey) {
            // Fallback for old records that might only have attachmentUrl
            if (calibration.attachmentUrl) {
                window.open(calibration.attachmentUrl, '_blank');
            }
            return;
        }

        if (!firebaseUser) {
            toast.error('Usuário não autenticado');
            return;
        }

        setIsDownloading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/upload/presigned-download?key=${encodeURIComponent(calibration.attachmentKey)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Falha ao gerar URL');

            const { url } = await res.json();
            window.open(url, '_blank');
        } catch (error) {
            console.error('Erro ao baixar certificado:', error);
            toast.error('Erro ao abrir o certificado');
            // Fallback para URL direta se existir
            if (calibration.attachmentUrl) {
                window.open(calibration.attachmentUrl, '_blank');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    // Opacidade progressiva para itens antigos (Stitch effect)
    const opacityClass = index >= 3 ? 'opacity-70 group-hover:opacity-100 transition-opacity' : '';

    const dateObj = new Date(calibration.calibrationDate);
    const formattedDate = !isNaN(dateObj.getTime())
        ? format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : 'Data inválida';

    return (
        <div className={cn("relative group pb-8", opacityClass)}>
            {/* O "nó" da timeline */}
            <div className={cn(
                "absolute -left-[37px] top-6 h-4 w-4 rounded-full border-2 bg-white dark:bg-gray-950 z-10 transition-transform group-hover:scale-125",
                isApproved && "border-green-500",
                isRejected && "border-red-500",
                isNeutral && "border-gray-400"
            )} />

            <div className={cn(
                "bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-l-4 transition-all duration-300 hover:shadow-md",
                isApproved && "border-l-green-500 border-gray-100 dark:border-gray-800",
                isRejected && "border-l-red-500 border-gray-100 dark:border-gray-800",
                isNeutral && "border-l-gray-400 border-gray-100 dark:border-gray-800"
            )}>
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Ícone de status */}
                        <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            isApproved && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                            isRejected && "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                            isNeutral && "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400"
                        )}>
                            {isApproved ? <CheckCircle2 size={24} /> : isRejected ? <AlertTriangle size={24} /> : <FileText size={24} />}
                        </div>

                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {formattedDate}
                                </h3>

                                {calibration.status && (
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                        isApproved ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 mr-1.5 rounded-full",
                                            isApproved ? "bg-green-500" : "bg-red-500"
                                        )} />
                                        {isApproved ? 'Aprovado' : 'Reprovado'}
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Certificado: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                                    {calibration.certificateNumber || '-'}
                                </span>
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-3 max-w-[200px]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Erro</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                                        {calibration.error !== null ? calibration.error.toFixed(4) : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Incerteza</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                                        {calibration.uncertainty !== null ? calibration.uncertainty.toFixed(4) : '-'}
                                    </span>
                                </div>
                            </div>

                            {calibration.notes && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic border-l-2 border-gray-100 dark:border-gray-800 pl-3">
                                    "{calibration.notes}"
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                        {calibration.attachmentUrl && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isDownloading}
                                            className="h-9 px-3 border-gray-200 dark:border-gray-700 hover:text-red-500 hover:border-red-500 transition-colors"
                                            onClick={handleDownload}
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-1.5 text-red-500" />
                                            )}
                                            PDF
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver Certificado</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {isCreator && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            onClick={() => onDelete(calibration.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Excluir Registro</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
