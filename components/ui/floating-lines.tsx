"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";
import "./floating-lines.css";

interface FloatingLinesProps {
    enabledWaves?: string;
    lineCount?: number;
    lineDistance?: number;
    bendRadius?: number;
    bendStrength?: number;
    interactive?: boolean;
    parallax?: boolean;
    animationSpeed?: number;
    linesGradient?: string[];
    effectsMode?: "full" | "lite" | "static";
}

const FloatingLines: React.FC<FloatingLinesProps> = ({
    enabledWaves = "top,middle,bottom",
    lineCount = 3,
    lineDistance = 20.5,
    bendRadius = 13,
    bendStrength = 0.5,
    interactive = true,
    parallax = true,
    animationSpeed = 1.0,
    linesGradient,
    effectsMode = "full",
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();
    const currentTheme = resolvedTheme || theme || "dark";

    // Performance and Motion overrides
    const isLite = effectsMode === "lite";
    const isStatic = effectsMode === "static";

    const finalInteractive = isStatic || isLite ? false : interactive;
    const finalParallax = isStatic || isLite ? false : parallax;
    const finalSpeed = isStatic ? 0.3 : (isLite ? 0.6 : animationSpeed);

    // Dynamic Gradients based on theme
    const defaultGradients = useMemo(() => {
        if (currentTheme === "dark") {
            return ["#22D3EE", "#3B82F6", "#A78BFA"];
        }
        return ["#CBD5E1", "#93C5FD", "#E2E8F0"];
    }, [currentTheme]);

    const activeGradients = linesGradient || defaultGradients;

    useEffect(() => {
        if (!mountRef.current) return;

        const container = mountRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isLite,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLite ? 1.2 : 1.5));
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // --- Shaders ---
        const vertexShader = `
            uniform float u_time;
            uniform float u_bendRadius;
            uniform float u_bendStrength;
            uniform float u_yOffset;
            varying float v_opacity;

            void main() {
                vec3 pos = position;
                // Wave logic
                float angle = pos.x * 0.05 + u_time;
                pos.y += sin(angle) * u_bendRadius * u_bendStrength;
                pos.y += u_yOffset;
                
                // Fade edges smoothly
                float fade = 1.0 - smoothstep(40.0, 120.0, abs(pos.x));
                v_opacity = fade;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform vec3 u_color;
            uniform float u_baseOpacity;
            varying float v_opacity;

            void main() {
                gl_FragColor = vec4(u_color, v_opacity * u_baseOpacity);
            }
        `;

        const lines: {
            mesh: THREE.Line;
            material: THREE.ShaderMaterial;
        }[] = [];

        const createLine = (yOffset: number, colorStr: string) => {
            const points = [];
            const segments = isLite ? 80 : 150;
            for (let i = -160; i <= 160; i += 320 / segments) {
                points.push(new THREE.Vector3(i, 0, 0));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    u_time: { value: 0 },
                    u_bendRadius: { value: bendRadius },
                    u_bendStrength: { value: bendStrength },
                    u_yOffset: { value: yOffset },
                    u_color: { value: new THREE.Color(colorStr) },
                    u_baseOpacity: { value: currentTheme === "dark" ? 0.5 : 0.3 }
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                blending: currentTheme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending,
                depthTest: false,
            });
            const line = new THREE.Line(geometry, material);
            return { mesh: line, material };
        };

        // Create Lines based on config
        activeGradients.forEach((color, gIdx) => {
            for (let lIdx = 0; lIdx < lineCount; lIdx++) {
                // Staggered Y distribution
                const yBase = (gIdx * lineDistance) - (activeGradients.length * lineDistance / 2) + (lIdx * 4);
                const lineObj = createLine(yBase, color);
                group.add(lineObj.mesh);
                lines.push(lineObj);
            }
        });

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        const targetRotation = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        if (finalInteractive) {
            window.addEventListener("mousemove", onMouseMove);
        }

        // Animation Loop
        let animationFrameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const time = clock.getElapsedTime() * finalSpeed;

            if (finalParallax) {
                targetRotation.x += (mouseY * 0.12 - targetRotation.x) * 0.05;
                targetRotation.y += (mouseX * 0.12 - targetRotation.y) * 0.05;
                group.rotation.x = targetRotation.x;
                group.rotation.y = targetRotation.y;
            }

            lines.forEach((line, index) => {
                line.material.uniforms.u_time.value = time + (index * 0.1);
                // Subtle breathing animation for bend strength
                if (!isStatic) {
                    line.material.uniforms.u_bendStrength.value = bendStrength + Math.sin(time * 0.5 + index) * 0.05;
                }
            });

            renderer.render(scene, camera);
        };

        if (!isStatic || true) { // Always run first frame
            animate();
        }

        // Handle Resize
        const handleResize = () => {
            if (!container) return;
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            lines.forEach(l => {
                l.mesh.geometry.dispose();
                l.material.dispose();
            });
            renderer.dispose();
        };
    }, [
        enabledWaves, lineCount, lineDistance, bendRadius,
        bendStrength, finalInteractive, finalParallax,
        finalSpeed, activeGradients, currentTheme, isLite, isStatic
    ]);

    return <div ref={mountRef} className="floating-lines-container" />;
};

export default FloatingLines;
