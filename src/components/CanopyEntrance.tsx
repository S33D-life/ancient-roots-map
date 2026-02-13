import { useEffect, useRef, useState, useCallback } from "react";

/**
 * CanopyEntrance — a ceremonial arrival into the Council of Life.
 *
 * Canvas-rendered canopy with swaying leaves falling gently,
 * warm dappled light converging on a circular gathering table,
 * and poetic text inviting the user to take their place.
 */

interface CanopyEntranceProps {
  onComplete: () => void;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  vx: number;
  vy: number;
  opacity: number;
  hue: number;
  lightness: number;
  drift: number;
}

interface LightMote {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
  phase: number;
}

const DURATION = 2500;
const LEAF_COUNT = 45;
const MOTE_COUNT = 25;

const CanopyEntrance = ({ onComplete }: CanopyEntranceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);
  const [subtextOpacity, setSubtextOpacity] = useState(0);
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const skip = useCallback(() => {
    if (!fading) {
      setFading(true);
      setTimeout(() => onCompleteRef.current(), 600);
    }
  }, [fading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let leaves: Leaf[] = [];
    let motes: LightMote[] = [];
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

    const spawnLeaf = (preseed = false): Leaf => {
      const w = W();
      const h = H();
      return {
        x: Math.random() * w,
        y: preseed ? Math.random() * h * 0.6 : -20 - Math.random() * 60,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.5 + 0.15,
        opacity: Math.random() * 0.5 + 0.3,
        hue: 80 + Math.random() * 60, // green-gold range
        lightness: 25 + Math.random() * 20,
        drift: Math.random() * Math.PI * 2,
      };
    };

    const spawnMote = (): LightMote => {
      const w = W();
      const h = H();
      return {
        x: w * 0.2 + Math.random() * w * 0.6,
        y: Math.random() * h * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        vy: Math.random() * 0.3 + 0.05,
        phase: Math.random() * Math.PI * 2,
      };
    };

    // Pre-seed
    for (let i = 0; i < LEAF_COUNT; i++) leaves.push(spawnLeaf(true));
    for (let i = 0; i < MOTE_COUNT; i++) motes.push(spawnMote());

    const drawLeaf = (leaf: Leaf, globalAlpha: number) => {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = leaf.opacity * globalAlpha;

      // Simple leaf shape
      const s = leaf.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 0.5, s * 0.4, 0, s);
      ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.6, -s * 0.5, 0, -s);
      ctx.closePath();
      ctx.fillStyle = `hsl(${leaf.hue}, 50%, ${leaf.lightness}%)`;
      ctx.fill();

      // Leaf vein
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.lineTo(0, s * 0.7);
      ctx.strokeStyle = `hsla(${leaf.hue}, 40%, ${leaf.lightness - 8}%, 0.4)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    const drawCanopyBranches = (w: number, h: number, t: number) => {
      const ease = easeOutCubic(Math.min(t * 1.5, 1));
      ctx.globalAlpha = ease * 0.15;

      // Large branch silhouettes from top edges
      for (let i = 0; i < 6; i++) {
        const startX = (w / 7) * (i + 0.5);
        const sway = Math.sin(t * 2 + i * 1.3) * 8;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(
          startX + sway + 30, h * 0.15,
          w / 2 + (startX - w / 2) * 0.3, h * 0.25,
          w / 2, h * 0.4
        );
        ctx.strokeStyle = `hsla(30, 30%, 18%, ${0.15 * ease})`;
        ctx.lineWidth = 3 + i * 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawTable = (cx: number, cy: number, radius: number, t: number) => {
      const appear = easeOutCubic(Math.max(0, (t - 0.3) / 0.4));
      if (appear <= 0) return;

      // Table glow — warm light converging
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
      glow.addColorStop(0, `hsla(35, 60%, 30%, ${0.25 * appear})`);
      glow.addColorStop(0.5, `hsla(30, 45%, 20%, ${0.1 * appear})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);

      // Round table — wooden ellipse
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.45); // perspective
      ctx.beginPath();
      ctx.arc(0, 0, radius * appear, 0, Math.PI * 2);
      ctx.closePath();
      ctx.restore();

      // Wood fill
      const woodGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      woodGrad.addColorStop(0, `hsla(28, 45%, 22%, ${0.5 * appear})`);
      woodGrad.addColorStop(0.7, `hsla(25, 35%, 16%, ${0.4 * appear})`);
      woodGrad.addColorStop(1, `hsla(22, 30%, 12%, ${0.2 * appear})`);
      ctx.fillStyle = woodGrad;

      // Redraw the ellipse for fill
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, radius * appear, 0, Math.PI * 2);
      ctx.fill();

      // Ring detail
      for (let r = 1; r <= 4; r++) {
        const ringR = radius * appear * (r / 5);
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(30, 40%, 28%, ${0.15 * appear})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // Subtle edge rim
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, radius * appear, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(35, 50%, 35%, ${0.3 * appear})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(t);
      setTextOpacity(t < 0.2 ? 0 : Math.min((t - 0.2) / 0.25, 1));
      setSubtextOpacity(t < 0.45 ? 0 : Math.min((t - 0.45) / 0.25, 1));

      const w = W();
      const h = H();
      const cx = w / 2;
      const tableY = h * 0.65;
      const tableRadius = Math.min(w, h) * 0.18;

      ctx.clearRect(0, 0, w, h);

      // Deep forest background
      const bg = ctx.createRadialGradient(cx, h * 0.3, 0, cx, h * 0.3, h);
      bg.addColorStop(0, "hsl(100, 15%, 12%)");
      bg.addColorStop(0.4, "hsl(90, 12%, 8%)");
      bg.addColorStop(1, "hsl(80, 10%, 5%)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Dappled light from above
      const dapple = easeOutCubic(Math.min(t * 1.8, 1));
      for (let i = 0; i < 8; i++) {
        const dx = cx + Math.sin(i * 0.9 + t) * w * 0.25;
        const dy = h * 0.1 + Math.cos(i * 1.2 + t * 0.7) * h * 0.08;
        const dr = 40 + Math.sin(i + t * 0.5) * 15;
        const lightG = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
        lightG.addColorStop(0, `hsla(50, 60%, 50%, ${0.06 * dapple})`);
        lightG.addColorStop(1, "transparent");
        ctx.fillStyle = lightG;
        ctx.fillRect(dx - dr, dy - dr, dr * 2, dr * 2);
      }

      // Canopy branches
      drawCanopyBranches(w, h, t);

      // Light shaft converging on table
      if (t > 0.15) {
        const shaftAlpha = easeOutCubic(Math.min((t - 0.15) / 0.5, 1)) * 0.1;
        const shaft = ctx.createLinearGradient(cx, 0, cx, tableY);
        shaft.addColorStop(0, `hsla(45, 50%, 55%, ${shaftAlpha * 0.5})`);
        shaft.addColorStop(0.6, `hsla(40, 45%, 40%, ${shaftAlpha})`);
        shaft.addColorStop(1, "transparent");
        ctx.fillStyle = shaft;
        ctx.beginPath();
        ctx.moveTo(cx - 60, 0);
        ctx.lineTo(cx + 60, 0);
        ctx.lineTo(cx + tableRadius * 0.8, tableY);
        ctx.lineTo(cx - tableRadius * 0.8, tableY);
        ctx.closePath();
        ctx.fill();
      }

      // Round table
      drawTable(cx, tableY, tableRadius, t);

      // Light motes drifting down
      motes.forEach((m, i) => {
        m.y += m.vy;
        m.phase += 0.015;
        const pulse = 0.5 + Math.sin(m.phase) * 0.5;
        const alpha = m.opacity * pulse * easeOutCubic(Math.min(t * 2, 1));

        if (m.y > H() * 0.7) {
          motes[i] = spawnMote();
          return;
        }

        const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 4);
        mg.addColorStop(0, `hsla(50, 60%, 65%, ${alpha * 0.5})`);
        mg.addColorStop(1, "transparent");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(50, 70%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Falling / swaying leaves
      const leafAlpha = easeOutCubic(Math.min(t * 2.5, 1));
      leaves.forEach((leaf, i) => {
        leaf.drift += 0.01;
        leaf.x += leaf.vx + Math.sin(leaf.drift) * 0.5;
        leaf.y += leaf.vy;
        leaf.rotation += leaf.rotSpeed;

        if (leaf.y > H() + 20) {
          leaves[i] = spawnLeaf(false);
          return;
        }

        drawLeaf(leaf, leafAlpha);
      });

      if (t >= 1 && !fading) {
        setTimeout(() => {
          setFading(true);
          setTimeout(() => onCompleteRef.current(), 600);
        }, 500);
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "hsl(80, 10%, 5%)" }}
      />

      {/* Poetic text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.6s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-3"
          style={{ color: "hsl(90, 30%, 65%)" }}
        >
          Entering the Canopy…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{
            color: "hsl(45, 40%, 55%)",
            opacity: subtextOpacity,
            transition: "opacity 0.6s ease",
          }}
        >
          Take your place at the Council
        </p>

        {/* Progress — soft light gathering */}
        <div
          className="mt-8 w-32 md:w-40 h-px relative overflow-hidden rounded-full"
          style={{ background: "hsla(90, 20%, 25%, 0.3)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, hsl(100, 35%, 30%), hsl(50, 50%, 50%))",
              transition: "width 0.1s linear",
              boxShadow: "0 0 8px hsla(60, 50%, 50%, 0.3)",
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

export default CanopyEntrance;
