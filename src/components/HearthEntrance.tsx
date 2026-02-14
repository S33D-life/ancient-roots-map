import { useEffect, useRef, useState, useCallback } from "react";

/**
 * HearthEntrance — a brief, warm arrival beside a quiet fire.
 * A glowing ember pulses gently with amber light, then fades.
 * Duration is intentionally short (~2.5s) — a flicker, not a wait.
 */

interface HearthEntranceProps {
  onComplete: () => void;
}

const DURATION = 1500;

const HearthEntrance = ({ onComplete }: HearthEntranceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textOpacity, setTextOpacity] = useState(0);
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const skip = useCallback(() => {
    if (!fading) {
      setFading(true);
      setTimeout(() => onCompleteRef.current(), 500);
    }
  }, [fading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();

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

    // Small ember particles
    interface Spark {
      x: number; y: number; size: number; vy: number; vx: number;
      opacity: number; life: number; maxLife: number; hue: number;
    }

    const sparks: Spark[] = [];
    const spawnSpark = (cx: number, cy: number): Spark => ({
      x: cx + (Math.random() - 0.5) * 30,
      y: cy - Math.random() * 10,
      size: Math.random() * 1.5 + 0.4,
      vy: -(Math.random() * 0.6 + 0.15),
      vx: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.3,
      life: 0,
      maxLife: 80 + Math.random() * 80,
      hue: 15 + Math.random() * 25,
    });

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.max(0, Math.min(elapsed / DURATION, 1));
      setTextOpacity(t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1);

      const w = W();
      const h = H();
      const cx = w / 2;
      const cy = h * 0.55;

      ctx.clearRect(0, 0, w, h);

      // Warm dark background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.8);
      bg.addColorStop(0, "hsl(20, 25%, 10%)");
      bg.addColorStop(0.5, "hsl(18, 20%, 7%)");
      bg.addColorStop(1, "hsl(15, 15%, 4%)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const ease = easeOutCubic(Math.min(t * 2, 1));
      const breathe = 0.85 + Math.sin(elapsed * 0.003) * 0.15;

      // Hearth glow — warm pulse
      const glowR = Math.max(0.1, 40 * ease * breathe);
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g1.addColorStop(0, `hsla(30, 70%, 45%, ${0.3 * ease})`);
      g1.addColorStop(0.4, `hsla(25, 55%, 30%, ${0.15 * ease})`);
      g1.addColorStop(0.7, `hsla(20, 40%, 18%, ${0.06 * ease})`);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

      // Inner ember core
      const coreR = Math.max(0.1, 5 * ease * breathe);
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      g2.addColorStop(0, `hsla(35, 85%, 60%, ${0.6 * ease})`);
      g2.addColorStop(0.5, `hsla(28, 70%, 45%, ${0.3 * ease})`);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Outer ambient warmth
      const ambR = Math.max(0.1, 180 * ease);
      const g3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, ambR);
      g3.addColorStop(0, `hsla(28, 40%, 25%, ${0.06 * ease})`);
      g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Spawn sparks
      if (Math.random() < 0.15 * ease) {
        sparks.push(spawnSpark(cx, cy));
      }

      // Draw sparks
      sparks.forEach((s, i) => {
        s.life++;
        s.x += s.vx + Math.sin(s.life * 0.05) * 0.2;
        s.y += s.vy;
        const p = s.life / s.maxLife;
        const a = p < 0.15 ? p / 0.15 : p > 0.6 ? (1 - p) / 0.4 : 1;
        const alpha = s.opacity * a * ease;

        if (s.life >= s.maxLife) {
          sparks[i] = spawnSpark(cx, cy);
          return;
        }

        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
        sg.addColorStop(0, `hsla(${s.hue}, 80%, 55%, ${alpha * 0.3})`);
        sg.addColorStop(1, "transparent");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${s.hue}, 90%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (t >= 1 && !fading) {
        setFading(true);
        setTimeout(() => onCompleteRef.current(), 500);
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
      className={`fixed inset-0 z-50 cursor-pointer transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
      onClick={skip}
      role="button"
      aria-label="Skip entrance — click to continue"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && skip()}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "hsl(15, 15%, 4%)" }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.4s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-2"
          style={{ color: "hsl(30, 60%, 60%)" }}
        >
          Gathering at the Hearth…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{ color: "hsl(25, 40%, 45%)" }}
        >
          Welcome Home
        </p>
      </div>
    </div>
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default HearthEntrance;
