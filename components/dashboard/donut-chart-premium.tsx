'use client';

import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCardPremium } from './chart-card-premium';
import { PremiumTooltip } from './premium-tooltip';

interface DonutChartProps {
    data: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
}

export function DonutChartPremium({ data }: DonutChartProps) {
    const total = data.reduce((acc, current) => acc + current.value, 0);

    // Filter out zero values for cleaner chart
    const formattedData = data.filter(item => item.value > 0).map(item => ({
        ...item,
        value: item.value,
        typeName: item.name
    }));

    if (total === 0) {
        return (
            <ChartCardPremium title="Distribuição por Tipo" icon={PieChartIcon} iconColor="text-cyan-500 dark:text-cyan-400">
                <div className="flex h-full min-h-[350px] items-center justify-center rounded-2xl border border-dashed p-8 text-muted-foreground">
                    Sem dados para exibir
                </div>
            </ChartCardPremium>
        );
    }

    return (
        <ChartCardPremium title="Distribuição por Tipo" icon={PieChartIcon} iconColor="text-cyan-500 dark:text-cyan-400">
            <div className="flex-1 w-full flex flex-col items-center justify-center p-4 gap-6">

                <div className="relative w-full h-[260px] flex items-center justify-center">
                    {/* Glow Effect - positioned behind the chart */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                content={<PremiumTooltip />}
                                cursor={false}
                            />
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70} // Thicker donut
                                outerRadius={95}
                                paddingAngle={2}
                                dataKey="value"
                                cornerRadius={6}
                                stroke="none"
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        className="stroke-background dark:stroke-[#1e2330] stroke-2 outline-none transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                            {total}
                        </span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                            Total
                        </span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="w-full max-w-[340px] space-y-2">
                    {formattedData.map((item, index) => {
                        const percent = ((item.value / total) * 100).toFixed(0);
                        return (
                            <div key={index} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center text-sm group p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                <div
                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] opacity-80 group-hover:opacity-100 transition-all"
                                    style={{ backgroundColor: item.fill, color: item.fill }}
                                />
                                <span className="text-slate-600 dark:text-slate-400 truncate font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={item.typeName}>
                                    {item.typeName}
                                </span>
                                <div className="flex items-baseline gap-1.5 tabular-nums">
                                    <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 opacity-70">({percent}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCardPremium>
    );
}
