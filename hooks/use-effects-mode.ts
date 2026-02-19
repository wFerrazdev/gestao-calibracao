"use client";

import { useState, useEffect } from "react";

export type EffectsMode = "full" | "lite" | "static";

export function useEffectsMode(): EffectsMode {
    const [mode, setMode] = useState<EffectsMode>("full");

    useEffect(() => {
        try {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            // @ts-ignore
            const hardwareConcurrency = navigator.hardwareConcurrency || 8;
            // @ts-ignore
            const deviceMemory = navigator.deviceMemory || 8;

            let detectedMode: EffectsMode = "full";

            if (reduceMotion) {
                detectedMode = "static";
            } else if (hardwareConcurrency < 4 || deviceMemory < 4) {
                detectedMode = "lite";
            }

            console.log("[VisualEffects]", {
                mode: detectedMode,
                hardwareConcurrency,
                deviceMemory,
                reduceMotion,
            });

            setMode(detectedMode);
        } catch (error) {
            console.warn("Failed to detect effects mode performance:", error);
            setMode("full");
        }
    }, []);

    return mode;
}
