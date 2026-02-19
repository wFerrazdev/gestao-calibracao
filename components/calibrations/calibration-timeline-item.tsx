'use client';

import { FileText, AlertTriangle, CheckCircle2, XCircle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalibrationTimelineItemProps {
    calibration: {
        id: string;
        calibrationDate: string;
        certificateNumber: string | null;
        performedBy: string | null;
        notes: string | null;
        attachmentKey: string | null;
        error: number | null;
        uncertainty: number | null;
        status: 'APPROVED' | 'REJECTED';
    };
    isLast?: boolean;
    onDownload: (key: string, certNumber: string | null) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
    opacity?: number;
}

export function CalibrationTimelineItem({
    calibration,
    isLast,
    onDownload,
    onDelete,
    canDelete,
    opacity = 100
}: CalibrationTimelineItemProps) {
    const isApproved = calibration.status === 'APPROVED';
    const date = new Date(calibration.calibrationDate);

    // Formato: "dd de Mês de aaaa"
    const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <div
            className={cn(
                "relative pl-8 pb-8 transition-opacity duration-300",
                isLast ? "pb-0" : ""
            )}
            style={{ opacity: opacity / 100 }}
        >
            {/* Linha Vertical da Timeline */}
            {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border" />
            )}

            {/* Bolinha/Node */}
            <div className={cn(
                "absolute left-0 top-1 h-6 w-6 rounded-full border-2 bg-background flex items-center justify-center z-10",
                isApproved ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
            )}>
                {isApproved ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>

            {/* Card Content */}
            <div className={cn(
                "group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
                isApproved ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
            )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold capitalize text-foreground">
                                {formattedDate}
                            </span>
                            <Badge
                                variant={isApproved ? "success" : "destructive"}
                                className={cn(
                                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0",
                                    isApproved ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" : "bg-red-100 text-red-700 hover:bg-red-100 border-none"
                                )}
                            >
                                {isApproved ? "Aprovado" : "Reprovado"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Certificado: <strong>{calibration.certificateNumber || '-'}</strong></span>
                            {calibration.performedBy && (
                                <>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span>{calibration.performedBy}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {calibration.attachmentKey && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold gap-1.5"
                                onClick={() => onDownload(calibration.attachmentKey!, calibration.certificateNumber)}
                            >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onDelete(calibration.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Grid de Valores */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">Erro</p>
                        <p className="text-sm font-mono font-medium">
                            {calibration.error !== null ? calibration.error.toFixed(4) : '-'}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">Incerteza</p>
                        <p className="text-sm font-mono font-medium">
                            {calibration.uncertainty !== null ? calibration.uncertainty.toFixed(4) : '-'}
                        </p>
                    </div>
                    {/* Placeholder para outros campos se necessário */}
                </div>

                {calibration.notes && (
                    <div className="mt-4 text-sm text-muted-foreground border-t pt-3 italic">
                        &quot;{calibration.notes}&quot;
                    </div>
                )}
            </div>
        </div>
    );
}
