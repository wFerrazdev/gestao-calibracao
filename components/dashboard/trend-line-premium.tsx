'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCardPremium } from './chart-card-premium';
import { PremiumTooltip } from './premium-tooltip';

interface TrendLineProps {
    data: Array<{
        month: string;
        Calibrações: number;
    }>;
}

export function TrendLinePremium({ data }: TrendLineProps) {
    return (
        <ChartCardPremium
            title="Histórico de Calibrações"
            subtitle="(Últimos 12 meses)"
            icon={TrendingUp}
            iconColor="text-indigo-500 dark:text-indigo-400"
        >
            <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCalib" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700/30" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<PremiumTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="Calibrações"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCalib)"
                            dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#6366f1" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ChartCardPremium>
    );
}
