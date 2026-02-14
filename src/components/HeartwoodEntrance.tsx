import { useEffect, useRef, useState, useCallback } from "react";

/**
 * HeartwoodEntrance — a cinematic "arrival moment" that evokes
 * crossing into the living trunk of a great tree.
 *
 * Canvas-rendered tree rings expand outward from the center with
 * warm ember particles drifting upward. Poetic text fades in
 * as the growth unfolds.
 */

interface HeartwoodEntranceProps {
  onComplete: () => void;
}

interface Ember {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

const HeartwoodEntrance = ({ onComplete }: HeartwoodEntranceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const skip = useCallback(() => {
    if (!fading) {
      setFading(true);
      setTimeout(() => onCompleteRef.current(), 600);
    }
  }, [fading]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let embers: Ember[] = [];
    let startTime = performance.now();
    const DURATION = 2500;
    const RING_COUNT = 28;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const spawnEmber = (): Ember => {
      const w = W();
      const h = H();
      return {
        x: w * 0.3 + Math.random() * w * 0.4,
        y: h * 0.7 + Math.random() * h * 0.25,
        size: Math.random() * 1.8 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.8 + 0.2),
        opacity: Math.random() * 0.6 + 0.3,
        life: 0,
        maxLife: Math.random() * 200 + 100,
        hue: 18 + Math.random() * 25,
      };
    };

    // Pre-seed embers
    for (let i = 0; i < 60; i++) {
      const e = spawnEmber();
      e.life = Math.random() * e.maxLife * 0.5;
      embers.push(e);
    }

    const drawRing = (cx: number, cy: number, radius: number, ringProgress: number, index: number) => {
      if (ringProgress <= 0) return;
      const clamp = Math.min(ringProgress, 1);
      const alpha = clamp * (0.12 + (index % 3 === 0 ? 0.06 : 0));

      // Organic ring — slight wobble
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.02) {
        const wobble = Math.sin(a * 3 + index * 1.7) * (radius * 0.015);
        const r = radius + wobble;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(28, 45%, ${32 + index * 2}%, ${alpha})`;
      ctx.lineWidth = 1 + (index % 4 === 0 ? 0.5 : 0);
      ctx.stroke();

      // Fill between rings with subtle wood grain
      if (index > 0 && clamp > 0.5) {
        const grainAlpha = (clamp - 0.5) * 2 * 0.03;
        ctx.fillStyle = `hsla(25, 30%, ${18 + index}%, ${grainAlpha})`;
        ctx.fill();
      }
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.max(0, Math.min(elapsed / DURATION, 1));
      setProgress(t);

      // Text fades in at 30%
      setTextOpacity(t < 0.3 ? 0 : Math.min((t - 0.3) / 0.3, 1));

      const w = W();
      const h = H();
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.42;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Dark warm background gradient
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.5);
      bg.addColorStop(0, "hsl(25, 25%, 10%)");
      bg.addColorStop(0.6, "hsl(20, 20%, 7%)");
      bg.addColorStop(1, "hsl(15, 15%, 4%)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Central warm glow
      const glowRadius = maxRadius * 0.6 * easeOutCubic(t);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0.1, glowRadius));
      glow.addColorStop(0, `hsla(30, 60%, 25%, ${0.3 * easeOutCubic(t)})`);
      glow.addColorStop(0.5, `hsla(25, 50%, 18%, ${0.15 * easeOutCubic(t)})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Draw tree rings expanding outward
      for (let i = 0; i < RING_COUNT; i++) {
        const ringT = (i + 1) / RING_COUNT;
        const radius = maxRadius * ringT;
        // Each ring appears progressively
        const ringAppear = (t - ringT * 0.6) / 0.35;
        drawRing(cx, cy, radius * easeOutCubic(Math.max(0, Math.min(ringAppear, 1))), ringAppear, i);
      }

      // Draw center heartwood dot
      if (t > 0.05) {
        const dotAlpha = Math.min((t - 0.05) / 0.2, 1);
        const dotGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
        dotGlow.addColorStop(0, `hsla(35, 80%, 50%, ${dotAlpha * 0.8})`);
        dotGlow.addColorStop(0.5, `hsla(30, 70%, 40%, ${dotAlpha * 0.3})`);
        dotGlow.addColorStop(1, "transparent");
        ctx.fillStyle = dotGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(30, 60%, 35%, ${dotAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Embers
      embers.forEach((e, i) => {
        e.life++;
        e.x += e.vx + Math.sin(e.life * 0.025) * 0.3;
        e.y += e.vy;
        const p = e.life / e.maxLife;
        const a = p < 0.1 ? p * 10 : p > 0.7 ? (1 - p) / 0.3 : 1;
        const opacity = e.opacity * a * easeOutCubic(Math.min(t * 2, 1));

        if (e.life >= e.maxLife || opacity <= 0) {
          embers[i] = spawnEmber();
          return;
        }

        // Soft glow
        const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 6);
        eg.addColorStop(0, `hsla(${e.hue}, 80%, 55%, ${opacity * 0.25})`);
        eg.addColorStop(1, "transparent");
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${e.hue}, 90%, 65%, ${opacity})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle wood grain texture overlay
      if (t > 0.2) {
        const grainAlpha = Math.min((t - 0.2) / 0.4, 1) * 0.02;
        for (let i = 0; i < 40; i++) {
          const gx = Math.random() * w;
          const gy = Math.random() * h;
          ctx.fillStyle = `hsla(25, 30%, 50%, ${grainAlpha * Math.random()})`;
          ctx.fillRect(gx, gy, Math.random() * 2, Math.random() * 0.5);
        }
      }

      if (t >= 1 && !fading) {
        // Hold briefly then auto-complete
        setTimeout(() => {
          setFading(true);
          setTimeout(() => onCompleteRef.current(), 600);
        }, 400);
      } else {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [fading]);

  return (
    <div
      className={`fixed inset-0 z-50 cursor-pointer transition-opacity duration-600 ${fading ? "opacity-0" : "opacity-100"}`}
      onClick={skip}
      role="button"
      aria-label="Skip entrance — click to continue"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && skip()}
    >
      {/* Canvas fills entire viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "hsl(15, 15%, 4%)" }}
      />

      {/* Poetic text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.5s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-3"
          style={{ color: "hsl(35, 60%, 60%)" }}
        >
          Entering the Heartwood…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{
            color: "hsl(30, 40%, 45%)",
            opacity: textOpacity * 0.7,
          }}
        >
          A Library of Living Memory
        </p>

        {/* Growth bar — organic ring-count progress */}
        <div
          className="mt-8 w-32 md:w-40 h-px relative overflow-hidden rounded-full"
          style={{ background: "hsla(30, 30%, 25%, 0.3)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, hsl(30, 50%, 35%), hsl(40, 70%, 50%))",
              transition: "width 0.1s linear",
              boxShadow: "0 0 8px hsla(35, 70%, 50%, 0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default HeartwoodEntrance;
