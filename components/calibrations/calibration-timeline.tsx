'use client';

import { CalibrationTimelineItem } from './calibration-timeline-item';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Calibration {
    id: string;
    calibrationDate: string;
    certificateNumber: string | null;
    performedBy: string | null;
    notes: string | null;
    attachmentUrl: string | null;
    attachmentKey: string | null;
    createdAt: string;
    error: number | null;
    uncertainty: number | null;
    status: 'APPROVED' | 'REJECTED' | null;
}

interface CalibrationTimelineProps {
    calibrations: Calibration[];
    onDelete: (id: string) => void;
    isCreator: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    loadingMore?: boolean;
}

export function CalibrationTimeline({
    calibrations,
    onDelete,
    isCreator,
    hasMore = false,
    onLoadMore,
    loadingMore = false
}: CalibrationTimelineProps) {
    if (!calibrations || calibrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800">
                    <PlusCircle className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum histórico encontrado</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Este equipamento ainda não possui calibrações registradas no sistema.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-[-30px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-gray-200 via-gray-100 to-transparent dark:from-gray-800 dark:via-gray-900 dark:to-transparent" />

            <div className="space-y-0">
                {calibrations.map((calibration, index) => (
                    <CalibrationTimelineItem
                        key={calibration.id}
                        calibration={calibration}
                        onDelete={onDelete}
                        isCreator={isCreator}
                        index={index}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center pb-10">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className={cn(
                            "w-full max-w-md h-12 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary hover:text-primary transition-all rounded-xl gap-2",
                            loadingMore && "bg-gray-50 dark:bg-gray-800"
                        )}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="h-4 w-4" />
                                Carregando mais histórico
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
