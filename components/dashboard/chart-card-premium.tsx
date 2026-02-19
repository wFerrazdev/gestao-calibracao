'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ChartCardPremiumProps {
    title: string;
    icon?: LucideIcon;
    iconColor?: string;
    children: React.ReactNode;
    className?: string;
    rightSlot?: React.ReactNode;
    height?: string; // e.g., "h-[400px]"
    scrollable?: boolean;
}

export function ChartCardPremium({
    title,
    icon: Icon,
    iconColor = "text-blue-500 dark:text-blue-400",
    children,
    className,
    rightSlot,
    height = "h-[360px]", // Altura fixa literal
    scrollable = false
}: ChartCardPremiumProps) {
    return (
        <div className={cn(
            "relative rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl flex flex-col transition-colors duration-300 overflow-hidden",
            height, // Aqui garantimos a classe h-[360px]
            className
        )}>
            {/* Background Decoration Container */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative p-6 flex flex-col h-full z-10 overflow-hidden">
                {/* Header Section - Fixo para não empurrar o conteúdo */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
                            {title}
                        </h2>
                    </div>
                    {rightSlot && (
                        <div className="flex-shrink-0">{rightSlot}</div>
                    )}
                </div>

                {/* Content Container - flex-1 min-h-0 essencial para altura fixa e scroll interno */}
                <div className={cn(
                    "flex-1 w-full min-h-0 relative",
                    scrollable ? "overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600" : "overflow-hidden"
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}
