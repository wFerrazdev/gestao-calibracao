"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GtHoverLogo = ({ className }: { className?: string }) => {
    return (
        <motion.div
            className={cn(
                "group relative flex items-center justify-center cursor-pointer p-10", // Added padding
                className
            )}
            initial="initial"
            whileHover="hover"
            animate="initial"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 146.78 59.23"
                className="w-full h-auto pointer-events-none overflow-visible" // Added overflow-visible
            >
                <defs>
                    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--gt-glow-a)" />
                        <stop offset="50%" stopColor="var(--gt-glow-b)" />
                        <stop offset="100%" stopColor="var(--gt-glow-c)" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" /> {/* Increased blur slightly for smoothness */}
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base Layer - Always visible subtle stroke */}
                <g stroke="var(--gt-base-stroke)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M65.68,16.51v.32H17.24v25.11h18.96l16.3,16.3v.07H9.88c-.34,0-.68-.02-1.01-.06-4.64-.49-8.27-4.37-8.37-9.12V10.76h.04c-.03-.28-.04-.56-.04-.85C.5,5,4.28.97,9.09.58c.26-.03.52-.04.79-.04h39.83l15.97,15.97Z" />
                    <path d="M145.57,16.87h-19.62c-.39,0-.77-.03-1.15-.08v.08h-9.93v41.15l-14.18-14.19v-26.96h-25.17l-9.84-9.85-6.28-6.28v-.24h65.4v.08c.38-.05.76-.08,1.15-.08,2.68,0,5.06,1.29,6.55,3.29l13.07,13.08Z" />
                    <polygon points="93.12 58.19 93 58.31 69.01 58.31 68.94 58.24 48.27 37.57 38.64 27.94 62.86 27.94 63.02 28.1 83.61 48.68 93.12 58.19" />
                </g>

                {/* Hover Layer - Animated Gradient Stroke */}
                <g
                    stroke="url(#textGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#glow)"
                >
                    <motion.path
                        d="M65.68,16.51v.32H17.24v25.11h18.96l16.3,16.3v.07H9.88c-.34,0-.68-.02-1.01-.06-4.64-.49-8.27-4.37-8.37-9.12V10.76h.04c-.03-.28-.04-.56-.04-.85C.5,5,4.28.97,9.09.58c.26-.03.52-.04.79-.04h39.83l15.97,15.97Z"
                        variants={{
                            initial: { pathLength: 0, opacity: 0 },
                            hover: { pathLength: 1, opacity: 1 },
                        }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                    />
                    <motion.path
                        d="M145.57,16.87h-19.62c-.39,0-.77-.03-1.15-.08v.08h-9.93v41.15l-14.18-14.19v-26.96h-25.17l-9.84-9.85-6.28-6.28v-.24h65.4v.08c.38-.05.76-.08,1.15-.08,2.68,0,5.06,1.29,6.55,3.29l13.07,13.08Z"
                        variants={{
                            initial: { pathLength: 0, opacity: 0 },
                            hover: { pathLength: 1, opacity: 1 },
                        }}
                        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.1 }}
                    />
                    <motion.polygon
                        points="93.12 58.19 93 58.31 69.01 58.31 68.94 58.24 48.27 37.57 38.64 27.94 62.86 27.94 63.02 28.1 83.61 48.68 93.12 58.19"
                        variants={{
                            initial: { pathLength: 0, opacity: 0 },
                            hover: { pathLength: 1, opacity: 1 },
                        }}
                        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.2 }}
                    />
                </g>
            </svg>
        </motion.div>
    );
};
