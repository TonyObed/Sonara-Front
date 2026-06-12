"use client";

import { useEffect, useRef } from "react";

interface WaveformCanvasProps {
  id: string;
  height?: string;
}

export function WaveformCanvas({ id, height = "110px" }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const cv = canvasRef.current;
      if (cv) {
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth;
        const h = cv.clientHeight;

        if (w && (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr))) {
          cv.width = Math.round(w * dpr);
          cv.height = Math.round(h * dpr);
        }

        if (w && h) {
          const ctx = cv.getContext("2d");
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const time = performance.now() / 1000;
            const n = Math.max(28, Math.floor(w / 7));
            const gap = w / n;
            const bw = Math.min(3.5, gap * 0.55);
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, "#0052FF");
            grad.addColorStop(1, "#00D4A6");
            ctx.fillStyle = grad;

            for (let i = 0; i < n; i++) {
              const ph = Math.sin(i * 0.34 + time * 2.4) * Math.sin(i * 0.083 + time * 0.7);
              const amp = (0.14 + 0.86 * Math.abs(ph)) * (h * 0.42);
              const x = i * gap + gap / 2;
              ctx.beginPath();
              // Check if roundRect is available
              if (typeof ctx.roundRect === "function") {
                ctx.roundRect(x - bw / 2, h / 2 - amp, bw, amp * 2, 2);
              } else {
                ctx.rect(x - bw / 2, h / 2 - amp, bw, amp * 2);
              }
              ctx.fill();
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      style={{ width: "100%", height, display: "block" }}
    />
  );
}
