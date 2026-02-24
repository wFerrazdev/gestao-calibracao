"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    pulse: number
    pulseSpeed: number
    isNode: boolean
}

export interface NeuralNetworkProps {
    className?: string
    children?: React.ReactNode
    /** Particle and line RGB, e.g. "34, 211, 238" */
    colorRGB?: string
    /** Number of particles */
    particleCount?: number
    /** Max distance for connections */
    maxDistance?: number
    /** Movement speed */
    speed?: number
    /** Vignette gradient CSS string. Pass "none" to disable. */
    vignetteGradient?: string
}

export function NeuralNetwork({
    className,
    children,
    colorRGB = "34, 211, 238",
    particleCount = 75,
    maxDistance = 145,
    speed = 0.35,
    vignetteGradient,
}: NeuralNetworkProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let particles: Particle[] = []
        let animId: number

        const init = () => {
            const { offsetWidth: w, offsetHeight: h } = canvas
            canvas.width = w
            canvas.height = h
            // First 6 are "hub" nodes – bigger, glow, pulse
            particles = Array.from({ length: particleCount }, (_, i) => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                radius: i < 6 ? Math.random() * 1.8 + 2.0 : Math.random() * 1.0 + 0.6,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.018 + Math.random() * 0.022,
                isNode: i < 6,
            }))
        }

        const draw = () => {
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)

            // Update positions
            for (const p of particles) {
                p.x += p.vx
                p.y += p.vy
                p.pulse += p.pulseSpeed
                if (p.x < 0 || p.x > w) p.vx *= -1
                if (p.y < 0 || p.y > h) p.vy *= -1
                p.x = Math.max(0, Math.min(w, p.x))
                p.y = Math.max(0, Math.min(h, p.y))
            }

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const d = Math.sqrt(dx * dx + dy * dy)
                    if (d < maxDistance) {
                        const alpha = (1 - d / maxDistance) * 0.70
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(${colorRGB}, ${alpha})`
                        ctx.lineWidth = 0.6
                        ctx.stroke()
                    }
                }
            }

            // Draw particles
            for (const p of particles) {
                const r = p.isNode ? p.radius + Math.sin(p.pulse) * 0.8 : p.radius

                if (p.isNode) {
                    // Soft radial glow for hub nodes
                    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 8)
                    grd.addColorStop(0, `rgba(${colorRGB}, 0.13)`)
                    grd.addColorStop(1, `rgba(${colorRGB}, 0)`)
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, r * 8, 0, Math.PI * 2)
                    ctx.fillStyle = grd
                    ctx.fill()
                }

                ctx.beginPath()
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${colorRGB}, ${p.isNode ? 0.70 : 0.55})`
                ctx.fill()
            }

            animId = requestAnimationFrame(draw)
        }

        init()
        draw()

        const ro = new ResizeObserver(init)
        ro.observe(canvas)

        return () => {
            cancelAnimationFrame(animId)
            ro.disconnect()
        }
    }, [colorRGB, particleCount, maxDistance, speed])

    return (
        <div className={cn("fixed inset-0 overflow-hidden", className)}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Vignette */}
            {vignetteGradient && vignetteGradient !== "none" && (
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: vignetteGradient }}
                />
            )}

            {/* Content layer */}
            {children && <div className="relative z-10 h-full w-full">{children}</div>}
        </div>
    )
}

export default NeuralNetwork
