"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { GtHoverLogo } from "@/components/ui/gt-hover-logo";
import { NeuralNetwork } from "@/components/ui/neural-network";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffectsMode } from "@/hooks/use-effects-mode";

interface AuthShellProps {
    children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
    const effectsMode = useEffectsMode();
    const { resolvedTheme } = useTheme();

    const isDark = resolvedTheme === "dark";

    const bgProps = isDark
        ? {
            // Deep navy + cyan neural network
            className: "bg-[#020c1b]",
            colorRGB: "29, 128, 241",
            particleCount: 80,
            maxDistance: 150,
            speed: 0.7,
            vignetteGradient:
                "radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(0,5,20,0.55) 75%, rgba(0,5,20,0.85) 100%)",
        }
        : {
            // Crisp white + subtle indigo neural network
            className: "bg-white",
            colorRGB: "99, 102, 241",
            particleCount: 70,
            maxDistance: 140,
            speed: 0.6,
            // Very light vignette — barely visible in light mode
            vignetteGradient:
                "radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(99,102,241,0.05) 80%, rgba(71,85,105,0.10) 100%)",
        };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden">
            {/* Neural Network background */}
            <NeuralNetwork
                className={bgProps.className}
                colorRGB={bgProps.colorRGB}
                particleCount={bgProps.particleCount}
                maxDistance={bgProps.maxDistance}
                speed={bgProps.speed}
                vignetteGradient={bgProps.vignetteGradient}
            />

            <div className="absolute top-4 right-4 z-50">
                <ModeToggle />
            </div>

            <div className="flex flex-col items-center justify-center p-4 relative z-10 w-full pointer-events-none">
                <div
                    className={cn(
                        "pointer-events-auto w-full max-w-5xl overflow-hidden rounded-2xl shadow-[0_24px_80px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_110px_-40px_rgba(0,0,0,0.85)] dark:ring-1 dark:ring-white/10 grid lg:grid-cols-2 relative z-20",
                        isDark ? "bg-[#0b1727]" : "bg-white/90",
                        effectsMode === "full" ? "backdrop-blur-xl" : "backdrop-blur-sm"
                    )}
                >
                    <div className={cn(
                        "flex flex-col justify-center p-8 sm:p-12 lg:p-16 h-full",
                        isDark ? "bg-[#0A192F]/70" : "bg-white/80"
                    )}>
                        {children}
                    </div>
                    <div className="relative hidden flex-col justify-center items-center overflow-hidden bg-slate-900 dark:bg-[#112240] p-12 text-white lg:flex h-full">
                        <div className="absolute inset-0 z-0">
                            <img
                                alt="Modern industrial warehouse"
                                className="h-full w-full object-cover opacity-30 mix-blend-overlay"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmxPX3mTi1zN1yr40sHDYbIKHBpvIp_3bdQv-ybH_rfLnZmQsIFJJTuYC-SFgCVOcOjjkUIxi1TExNsedlIs9QZTGHbwFBBOzRaQDuXRDq4Dx5L82kYT5Jyp7C5DXmN33i9x0Rhd0H_1gRL0PfZVlLEi8RWuGN5sLMBAoX9DbrRXT67w-8C3bXMvB9yyl3297KLJCtc7CqIlAlryBxPN5ZXUL6DEk2j0W6rZIEx-jSTLJJO62tOY81C34utwAwkFPxyElpOffBDLbt"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-blue-900/80 to-slate-900/90 dark:from-[#0A192F]/95 dark:via-[#1e40af]/80 dark:to-[#0A192F]/90 mix-blend-multiply" />
                        </div>

                        <div className="relative z-10 flex h-full w-full items-center justify-center">
                            <GtHoverLogo className="w-[280px] sm:w-[320px] md:w-[360px]" mode={effectsMode} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
