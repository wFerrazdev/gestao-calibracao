'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    // Helper formats
    valueFormatter?: (value: number) => string;
    labelFormatter?: (label: string) => string;
    className?: string;
}

export function PremiumTooltip({
    active,
    payload,
    label,
    valueFormatter,
    labelFormatter,
    className
}: PremiumTooltipProps) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const data = payload[0];
    const value = data.value;
    const name = data.name || label;
    const formattedValue = valueFormatter ? valueFormatter(value) : value;
    const formattedLabel = labelFormatter ? labelFormatter(name) : name;

    // Some charts (like Donut) might pass specific payload structures
    // Adjust based on typical Recharts payload or custom payload
    const displayLabel = data.payload?.name || data.payload?.typeName || formattedLabel;
    const displayValue = data.payload?.value ?? value;
    const percent = data.payload?.percent; // Sometimes available directly if calculated

    return (
        <div className={cn(
            "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg dark:shadow-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-900 dark:text-white whitespace-nowrap z-50",
            className
        )}>
            {displayLabel && (
                <div className="font-semibold mb-1">{displayLabel}</div>
            )}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                    {valueFormatter ? valueFormatter(displayValue) : displayValue}
                </span>
                {percent !== undefined && (
                    <span className="text-slate-400 dark:text-slate-500">
                        ({(percent * 100).toFixed(1)}%)
                    </span>
                )}
            </div>
        </div>
    );
}
