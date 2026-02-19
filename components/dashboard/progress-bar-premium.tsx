'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChartCardPremium } from './chart-card-premium';
import { Zap } from 'lucide-react';

interface ProgressBarProps {
    items: Array<{
        label: string;
        value: number;
        total: number;
        color: string; // Tailwind color class backbone e.g. "bg-green-500"
    }>;
}

export function ProgressBarPremium({ items }: ProgressBarProps) {
    return (
        <ChartCardPremium title="Status Geral" icon={Zap} iconColor="text-yellow-500 dark:text-yellow-400">
            <div className="space-y-6 pt-2">
                {items.map((item, index) => {
                    const percent = (item.value / item.total) * 100;
                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {item.value} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {item.total}</span>
                                </span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                                <div
                                    className={cn("h-full rounded-full relative transition-all duration-1000 ease-out", item.color)}
                                    style={{ width: `${percent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 blur-[2px]"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ChartCardPremium>
    );
}
