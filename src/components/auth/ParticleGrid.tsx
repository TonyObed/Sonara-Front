"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  alpha: number;
  targetAlpha: number;
  speed: number;
  size: number;
}

export default function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const SPACING = 28;
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    }

    function initParticles() {
      if (!canvas) return;
      particles = [];
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const isBright = Math.random() < 0.08;
          particles.push({
            x: c * SPACING,
            y: r * SPACING,
            alpha: Math.random() * 0.2,
            targetAlpha: isBright ? 0.5 + Math.random() * 0.4 : Math.random() * 0.18,
            speed: 0.004 + Math.random() * 0.012,
            size: isBright ? 1.6 : 1.1,
          });
        }
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Glide toward target
        p.alpha += (p.targetAlpha - p.alpha) * p.speed;

        // Pick new target when close
        if (Math.abs(p.alpha - p.targetAlpha) < 0.008) {
          const isBright = Math.random() < 0.06;
          p.targetAlpha = isBright
            ? 0.45 + Math.random() * 0.45
            : Math.random() * 0.12;
        }

        const half = p.size / 2;

        // Glow halo for bright cubes
        if (p.alpha > 0.25) {
          const glowSize = p.size * 5;
          const grd = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, glowSize
          );
          grd.addColorStop(0, `rgba(60,130,255,${p.alpha * 0.45})`);
          grd.addColorStop(1, `rgba(0,82,255,0)`);
          ctx.fillStyle = grd;
          ctx.fillRect(
            p.x - glowSize,
            p.y - glowSize,
            glowSize * 2,
            glowSize * 2
          );
        }

        // Core cube
        ctx.fillStyle = `rgba(80,150,255,${p.alpha})`;
        ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
