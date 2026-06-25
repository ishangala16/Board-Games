"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    originalAlpha: number;
}

export default React.memo(function InteractiveBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
        x: 0,
        y: 0,
        active: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const colors = ["#4b90ff", "#9b51e0", "#ff88a5"];

        const resizeCanvas = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            if (!canvas) return;
            const density = 0.00004; // particles per square pixel
            const area = canvas.width * canvas.height;
            const count = Math.max(20, Math.min(60, Math.floor(area * density)));

            particles = [];
            for (let i = 0; i < count; i++) {
                const radius = Math.random() * 2 + 1.5;
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    originalAlpha: Math.random() * 0.4 + 0.2,
                });
            }
        };

        const draw = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            // Draw connections first
            ctx.lineWidth = 0.8;
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];

                // Connect to mouse
                if (mouse.active) {
                    const dx = mouse.x - p1.x;
                    const dy = mouse.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const connectionDist = 180;

                    if (dist < connectionDist) {
                        const alpha = (1 - dist / connectionDist) * 0.15;
                        ctx.strokeStyle = `rgba(155, 81, 224, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();

                        // Gentle gravitational pull towards mouse
                        p1.vx += (dx / dist) * 0.008;
                        p1.vy += (dy / dist) * 0.008;

                        // Cap speeds
                        const maxSpeed = 1.2;
                        const speed = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
                        if (speed > maxSpeed) {
                            p1.vx = (p1.vx / speed) * maxSpeed;
                            p1.vy = (p1.vy / speed) * maxSpeed;
                        }
                    }
                }

                // Connect to other particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 110;

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.08;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw and update particles
            particles.forEach((p) => {
                // Return to original slow speed gently if pulled away by mouse
                p.vx += ((Math.random() - 0.5) * 0.1 - p.vx) * 0.01;
                p.vy += ((Math.random() - 0.5) * 0.1 - p.vy) * 0.01;

                p.x += p.vx;
                p.y += p.vy;

                // Wall collision with wrap-around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.originalAlpha;
                ctx.fill();
            });

            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
            mouseRef.current.active = true;
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                mouseRef.current.x = e.touches[0].clientX - rect.left;
                mouseRef.current.y = e.touches[0].clientY - rect.top;
                mouseRef.current.active = true;
            }
        };

        const handleTouchEnd = () => {
            mouseRef.current.active = false;
        };

        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd);

        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
            style={{ mixBlendMode: "screen" }}
        />
    );
});
