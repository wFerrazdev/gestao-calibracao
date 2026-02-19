'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PieChart as PieChartIcon, ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
    data: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
}

export function DonutChartType({ data }: DonutChartProps) {
    const total = data.reduce((acc, current) => acc + current.value, 0);

    // Filter out zero values for cleaner chart
    const formattedData = data.filter(item => item.value > 0).map(item => ({
        ...item,
        value: item.value,
        typeName: item.name
    }));

    if (total === 0) {
        return (
            <div className="flex h-full min-h-[350px] items-center justify-center rounded-2xl border border-dashed p-8 text-muted-foreground">
                Sem dados para exibir
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl h-full flex flex-col transition-colors duration-300">
            {/* Background Decoration (Subtle Glow) */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative p-6 flex flex-col h-full z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <PieChartIcon className="text-cyan-500 dark:text-cyan-400 w-5 h-5" />
                            Distribuição por Tipo
                        </h2>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Glow Effect - positioned behind the chart */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-900 dark:text-white">
                                                    <span className="font-semibold block mb-1">{data.typeName}</span>
                                                    <div className="flex gap-2 text-slate-500 dark:text-slate-300">
                                                        <span>{data.value} unidades</span>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                                            ({((data.value / total) * 100).toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
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
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                {total}
                            </span>
                            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                Total
                            </span>
                        </div>
                    </div>

                    {/* Custom Legend */}
                    <div className="w-full max-w-[340px] px-4 pb-2 space-y-2 mt-[-20px] z-20">
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
            </div>
        </div>
    );
}
