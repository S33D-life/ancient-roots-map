/**
 * SpiralHeartFlow — Canvas-based heart particle system
 * Renders floating heart particles that travel along spiral paths,
 * creating the feeling of sap flowing through a living forest.
 *
 * Lightweight: uses requestAnimationFrame with ~20 particles max.
 */
import { useEffect, useRef, useCallback } from "react";

interface FlowParticle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
  hue: number;
  trail: { x: number; y: number }[];
  settled: boolean;
  settledTime: number;
  curveOffsetX: number;
  curveOffsetY: number;
}

const MAX_PARTICLES = 18;
const HEART_COLOR_BASE = "hsla(0, 65%, 55%,";
const GOLD_COLOR_BASE = "hsla(42, 85%, 55%,";

export function SpiralHeartFlow({
  containerRef,
  originPositions,
  clusterPositions,
  heartCount,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  originPositions: { x: number; y: number }[];
  clusterPositions: { x: number; y: number }[];
  heartCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FlowParticle[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const spawnParticle = useCallback(() => {
    if (particlesRef.current.length >= MAX_PARTICLES) return;

    const allTargets = [...originPositions, ...clusterPositions];
    if (allTargets.length === 0) return;

    const target = allTargets[Math.floor(Math.random() * allTargets.length)];
    // Start from center (50%, 50%)
    const startAngle = Math.random() * Math.PI * 2;
    const startR = 3 + Math.random() * 8;

    const p: FlowParticle = {
      x: 50 + startR * Math.cos(startAngle),
      y: 50 + startR * Math.sin(startAngle),
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      speed: 0.002 + Math.random() * 0.003,
      size: 1.2 + Math.random() * 1.5,
      opacity: 0.6 + Math.random() * 0.3,
      hue: Math.random() > 0.3 ? 0 : 42, // hearts (red) or gold
      trail: [],
      settled: false,
      settledTime: 0,
      curveOffsetX: (Math.random() - 0.5) * 15,
      curveOffsetY: (Math.random() - 0.5) * 15,
    };
    particlesRef.current.push(p);
  }, [originPositions, clusterPositions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles periodically
      const spawnInterval = heartCount > 50 ? 2000 : 4000;
      if (time - lastSpawnRef.current > spawnInterval) {
        spawnParticle();
        lastSpawnRef.current = time;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Update & draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        if (p.settled && p.settledTime > 120) return false;

        if (!p.settled) {
          p.progress += p.speed;

          // Quadratic bezier from start to target via curve point
          const t = Math.min(p.progress, 1);
          const mt = 1 - t;
          const midX = (p.x + p.targetX) / 2 + p.curveOffsetX;
          const midY = (p.y + p.targetY) / 2 + p.curveOffsetY;

          const drawX = mt * mt * (p.x * w / 100) + 2 * mt * t * (midX * w / 100) + t * t * (p.targetX * w / 100);
          const drawY = mt * mt * (p.y * h / 100) + 2 * mt * t * (midY * h / 100) + t * t * (p.targetY * h / 100);

          // Save trail
          p.trail.push({ x: drawX, y: drawY });
          if (p.trail.length > 8) p.trail.shift();

          if (p.progress >= 1) {
            p.settled = true;
            p.settledTime = 0;
          }

          // Draw trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            const colorBase = p.hue === 0 ? HEART_COLOR_BASE : GOLD_COLOR_BASE;
            ctx.strokeStyle = `${colorBase}${(p.opacity * 0.2).toFixed(2)})`;
            ctx.lineWidth = p.size * 0.4;
            ctx.lineCap = "round";
            ctx.stroke();
          }

          // Draw heart particle
          const colorBase = p.hue === 0 ? HEART_COLOR_BASE : GOLD_COLOR_BASE;
          const grd = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.size * 3);
          grd.addColorStop(0, `${colorBase}${(p.opacity * 0.6).toFixed(2)})`);
          grd.addColorStop(1, `${colorBase}0)`);
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `${colorBase}${p.opacity.toFixed(2)})`;
          ctx.fill();
        } else {
          // Settled: fade out gently
          p.settledTime++;
          const fadeOpacity = p.opacity * Math.max(0, 1 - p.settledTime / 120);
          const px = p.targetX * w / 100;
          const py = p.targetY * h / 100;

          const colorBase = p.hue === 0 ? HEART_COLOR_BASE : GOLD_COLOR_BASE;
          const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 5);
          grd.addColorStop(0, `${colorBase}${(fadeOpacity * 0.4).toFixed(2)})`);
          grd.addColorStop(1, `${colorBase}0)`);
          ctx.beginPath();
          ctx.arc(px, py, p.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [spawnParticle, heartCount, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[3]"
      aria-hidden="true"
    />
  );
}
