'use client';

import { CalibrationTimelineItem } from './calibration-timeline-item';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Calibration {
    id: string;
    calibrationDate: string;
    certificateNumber: string | null;
    performedBy: string | null;
    notes: string | null;
    attachmentKey: string | null;
    error: number | null;
    uncertainty: number | null;
    status: 'APPROVED' | 'REJECTED';
}

interface CalibrationTimelineProps {
    calibrations: Calibration[];
    hasMore: boolean;
    onLoadMore: () => void;
    isLoadingMore: boolean;
    onDownload: (key: string, certNumber: string | null) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
}

export function CalibrationTimeline({
    calibrations,
    hasMore,
    onLoadMore,
    isLoadingMore,
    onDownload,
    onDelete,
    canDelete
}: CalibrationTimelineProps) {
    return (
        <div className="space-y-2">
            <div className="relative">
                {calibrations.map((cal, index) => {
                    // Opacidade progressiva para itens antigos (100, 90, 80...) até o mínimo de 60
                    const opacity = Math.max(60, 100 - (index * 5));

                    return (
                        <CalibrationTimelineItem
                            key={cal.id}
                            calibration={cal}
                            isLast={index === calibrations.length - 1 && !hasMore}
                            onDownload={onDownload}
                            onDelete={onDelete}
                            canDelete={canDelete}
                            opacity={opacity}
                        />
                    );
                })}
            </div>

            {hasMore && (
                <div className="pt-4 pb-12">
                    <Button
                        variant="ghost"
                        className="w-full h-16 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 rounded-xl transition-all group"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <span className="text-muted-foreground group-hover:text-foreground font-medium">
                                Carregar mais histórico
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
