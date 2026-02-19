'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import { Activity } from 'lucide-react';
import { ChartCardPremium } from './chart-card-premium';
import { PremiumTooltip } from './premium-tooltip';

interface StatusChartProps {
    data: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
    total: number;
}

export function StatusChartPremium({ data }: StatusChartProps) {
    const [tooltipState, setTooltipState] = useState<{ visible: boolean; x: number; y: number; data: any; top: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Filter out unwanted statuses
    const filteredData = data.filter(d =>
        !['REFERENCIA', 'DESATIVADO', 'Referência', 'Desativado'].includes(d.name)
    );

    // Find the maximum value to normalize bar heights
    const maxValue = Math.max(...filteredData.map(d => d.value), 1); // Avoid div by zero

    // Helper to get color with opacity
    const hexToRgba = (hex: string, alpha: number) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Helper to format display name
    const formatDisplayName = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('ir') || lower.includes('vencer')) return 'Irá Vencer';
        if (lower.includes('calibrado')) return 'Calibrado';
        if (lower.includes('vencido')) return 'Vencido';
        return name;
    };

    const handleMouseEnter = (e: React.MouseEvent, item: any, barHeightPercent: number) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetRect = e.currentTarget.getBoundingClientRect();

        const x = targetRect.left - containerRect.left + targetRect.width / 2;

        // Calculate chart area height from targetRect (which is the full height column wrapper)
        const chartHeight = targetRect.height;
        const barPixelHeight = (barHeightPercent / 100) * chartHeight;

        // Bottom of the chart area relative to container
        const chartBottomY = targetRect.bottom - containerRect.top;

        // Center position of the bar
        const centerY = chartBottomY - (barPixelHeight / 2);

        setTooltipState({ visible: true, x, y: centerY, top: centerY, data: item });
    };

    const handleMouseLeave = () => {
        setTooltipState(null);
    };

    // Use effect to clamp AFTER render if we want perfection
    useLayoutEffect(() => {
        if (tooltipState && tooltipRef.current && containerRef.current) {
            const tooltipEl = tooltipRef.current;
            const containerWidth = containerRef.current.offsetWidth;
            const tooltipWidth = tooltipEl.offsetWidth;
            const padding = 16;

            // Calculate clamped X (top-left corner of tooltip)
            const intendedCenterX = tooltipState.x;
            const idealLeft = intendedCenterX - tooltipWidth / 2;

            // x = clamp(x - tooltipWidth/2, padding, containerWidth - tooltipWidth - padding)
            const clampedLeft = Math.max(padding, Math.min(containerWidth - tooltipWidth - padding, idealLeft));

            tooltipEl.style.left = `${clampedLeft}px`;
            // Maintain vertical centering with transform, but override X centering
            tooltipEl.style.transform = 'translateY(-50%)';
        }
    }, [tooltipState]);

    const totalCalculated = data.reduce((a, b) => a + b.value, 0);

    return (
        <ChartCardPremium
            title="Equipamentos por Status"
            icon={Activity}
            iconColor="text-blue-500 dark:text-blue-400"
        >
            <div ref={containerRef} className="relative h-full min-h-[280px] w-full mt-auto flex flex-col">
                <div className="relative flex-1 w-full">
                    {/* Grid Lines (Y-Axis) */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs text-slate-400 dark:text-slate-500 font-medium z-0 pb-6 pr-2">
                        <div className="relative w-full border-b border-dashed border-slate-200 dark:border-slate-700/30"><span className="absolute -top-2 left-0">100%</span></div>
                        <div className="relative w-full border-b border-dashed border-slate-200 dark:border-slate-700/30"><span className="absolute -top-2 left-0">75%</span></div>
                        <div className="relative w-full border-b border-dashed border-slate-200 dark:border-slate-700/30"><span className="absolute -top-2 left-0">50%</span></div>
                        <div className="relative w-full border-b border-dashed border-slate-200 dark:border-slate-700/30"><span className="absolute -top-2 left-0">25%</span></div>
                        <div className="relative w-full border-b border-slate-300 dark:border-slate-600"><span className="absolute -top-2 left-0">0%</span></div>
                    </div>

                    {/* Bars Area */}
                    <div className="absolute inset-0 flex items-end justify-between pl-8 pr-2 pb-6 gap-4 z-10">
                        {filteredData.map((item, index) => {
                            const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                            const barHeightPercent = Math.max(percent, 2);

                            // Define colors
                            const glowColor = item.fill;
                            const shadowColor = hexToRgba(glowColor, 0.6);

                            return (
                                <div
                                    key={index}
                                    className="group relative flex-1 flex flex-col justify-end items-center h-full"
                                    onMouseEnter={(e) => handleMouseEnter(e, item, barHeightPercent)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Value Label (Top of Bar) */}
                                    <div className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all group-hover:-translate-y-1">
                                        {item.value}
                                    </div>

                                    {/* Bar Container */}
                                    <div
                                        className="w-full max-w-[40px] sm:max-w-[50px] relative flex flex-col justify-end group cursor-pointer"
                                        style={{ height: `${barHeightPercent}%` }}
                                    >
                                        {/* Glow Cap */}
                                        <div
                                            className="h-1 w-full rounded-t-sm transition-all duration-300 z-10 relative"
                                            style={{
                                                backgroundColor: glowColor,
                                                boxShadow: `0 0 12px ${shadowColor}`
                                            }}
                                        />

                                        {/* Gradient Body */}
                                        <div
                                            className="flex-1 w-full opacity-80 group-hover:opacity-100 transition-opacity duration-300 rounded-b-sm"
                                            style={{
                                                background: `linear-gradient(to bottom, ${item.fill}, ${hexToRgba(item.fill, 0.1)})`
                                            }}
                                        />
                                    </div>

                                    {/* Label (x-axis) */}
                                    <div className="absolute -bottom-6 w-full text-center">
                                        <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap px-1" title={item.name}>
                                            {formatDisplayName(item.name)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Custom Tooltip Portal/Overlay */}
                    {tooltipState && (
                        <div
                            ref={tooltipRef}
                            className="absolute z-50 pointer-events-none transition-opacity duration-200"
                            style={{
                                top: tooltipState.top,
                                left: tooltipState.x,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <PremiumTooltip
                                active={true}
                                payload={[{
                                    value: tooltipState.data.value,
                                    name: tooltipState.data.name,
                                    payload: {
                                        percent: totalCalculated > 0 ? (tooltipState.data.value / totalCalculated) : 0
                                    }
                                }]}
                                label={tooltipState.data.name}
                                labelFormatter={formatDisplayName}
                            />
                        </div>
                    )}
                </div>
            </div>
        </ChartCardPremium>
    );
}
