import { useEffect, useRef, useState, useCallback } from "react";

/**
 * CrownEntrance — an uplifting ascent into yOur Golden Dream.
 *
 * Canvas-rendered rising motion through branches and leaves
 * toward warm golden sunlight. Particles drift upward,
 * sun flares expand, and poetic text welcomes the user.
 */

interface CrownEntranceProps {
  onComplete: () => void;
}

interface RisingLeaf {
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
}

interface SunParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
  vx: number;
  phase: number;
  hue: number;
}

const DURATION = 2500;
const LEAF_COUNT = 35;
const PARTICLE_COUNT = 50;

const CrownEntrance = ({ onComplete }: CrownEntranceProps) => {
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
    let leaves: RisingLeaf[] = [];
    let particles: SunParticle[] = [];
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

    const spawnLeaf = (preseed = false): RisingLeaf => {
      const w = W();
      const h = H();
      return {
        x: Math.random() * w,
        y: preseed ? h * 0.3 + Math.random() * h * 0.7 : h + 10 + Math.random() * 40,
        size: Math.random() * 7 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.6 + 0.2), // rising
        opacity: Math.random() * 0.5 + 0.35,
        hue: 40 + Math.random() * 80, // gold to green
        lightness: 30 + Math.random() * 25,
      };
    };

    const spawnParticle = (): SunParticle => {
      const w = W();
      const h = H();
      return {
        x: w * 0.15 + Math.random() * w * 0.7,
        y: h * 0.4 + Math.random() * h * 0.6,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        vy: -(Math.random() * 0.8 + 0.3),
        vx: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        hue: 35 + Math.random() * 25,
      };
    };

    for (let i = 0; i < LEAF_COUNT; i++) leaves.push(spawnLeaf(true));
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle());

    const drawLeaf = (leaf: RisingLeaf, globalAlpha: number) => {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = leaf.opacity * globalAlpha;
      const s = leaf.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 0.5, s * 0.4, 0, s);
      ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.6, -s * 0.5, 0, -s);
      ctx.closePath();
      ctx.fillStyle = `hsl(${leaf.hue}, 55%, ${leaf.lightness}%)`;
      ctx.fill();
      ctx.restore();
    };

    const drawBranches = (w: number, h: number, t: number) => {
      // Dark silhouette branches from bottom edges, receding upward
      const ease = easeOutCubic(Math.min(t * 1.5, 1));
      const shift = t * h * 0.15; // branches slide down as we "rise"

      for (let i = 0; i < 5; i++) {
        const side = i % 2 === 0 ? 0 : w;
        const startY = h * 0.5 + i * h * 0.1 + shift;
        const sway = Math.sin(t * 1.5 + i * 2) * 12;

        ctx.beginPath();
        ctx.moveTo(side, startY);
        ctx.bezierCurveTo(
          side + (side === 0 ? w * 0.3 : -w * 0.3) + sway, startY - h * 0.1,
          w / 2 + sway, startY - h * 0.2,
          w / 2, h * 0.15
        );
        ctx.strokeStyle = `hsla(30, 25%, 15%, ${0.08 * ease * (1 - t * 0.5)})`;
        ctx.lineWidth = 4 - i * 0.5;
        ctx.stroke();
      }
    };

    const drawSunFlare = (cx: number, cy: number, t: number) => {
      const appear = easeOutCubic(Math.max(0, (t - 0.15) / 0.5));
      if (appear <= 0) return;

      // Main sun glow
      const r1 = Math.min(W(), H()) * 0.35 * appear;
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
      g1.addColorStop(0, `hsla(42, 90%, 65%, ${0.4 * appear})`);
      g1.addColorStop(0.3, `hsla(40, 80%, 55%, ${0.2 * appear})`);
      g1.addColorStop(0.6, `hsla(38, 60%, 45%, ${0.08 * appear})`);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W(), H());

      // Inner bright core
      const r2 = r1 * 0.25;
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2);
      g2.addColorStop(0, `hsla(45, 95%, 80%, ${0.6 * appear})`);
      g2.addColorStop(0.5, `hsla(42, 85%, 65%, ${0.25 * appear})`);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(cx - r2, cy - r2, r2 * 2, r2 * 2);

      // Light rays
      if (t > 0.3) {
        const rayAlpha = easeOutCubic(Math.min((t - 0.3) / 0.4, 1));
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + t * 0.2;
          const rayLen = r1 * (0.8 + Math.sin(t * 2 + i) * 0.2);
          const rayW = 15 + Math.sin(i * 1.7) * 8;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(-rayW * 0.3, 0);
          ctx.lineTo(0, -rayLen);
          ctx.lineTo(rayW * 0.3, 0);
          ctx.closePath();
          ctx.fillStyle = `hsla(45, 80%, 65%, ${0.04 * rayAlpha})`;
          ctx.fill();
          ctx.restore();
        }
      }
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(t);
      setTextOpacity(t < 0.25 ? 0 : Math.min((t - 0.25) / 0.2, 1));
      setSubtextOpacity(t < 0.5 ? 0 : Math.min((t - 0.5) / 0.2, 1));

      const w = W();
      const h = H();
      const cx = w / 2;
      const sunY = h * 0.18;

      ctx.clearRect(0, 0, w, h);

      // Background gradient — dark bottom to warm golden top
      const skyPhase = easeOutCubic(Math.min(t * 1.3, 1));
      const bg = ctx.createLinearGradient(0, h, 0, 0);
      bg.addColorStop(0, `hsl(25, 20%, ${6 + skyPhase * 4}%)`);
      bg.addColorStop(0.4, `hsl(35, 25%, ${8 + skyPhase * 8}%)`);
      bg.addColorStop(0.7, `hsla(40, 40%, ${12 + skyPhase * 15}%, 1)`);
      bg.addColorStop(1, `hsla(45, 55%, ${18 + skyPhase * 25}%, 1)`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Branch silhouettes
      drawBranches(w, h, t);

      // Sun flare at top
      drawSunFlare(cx, sunY, t);

      // Rising golden particles
      const particleAlpha = easeOutCubic(Math.min(t * 2, 1));
      particles.forEach((p, i) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.phase + elapsed * 0.001) * 0.3;
        p.phase += 0.008;

        if (p.y < -20) {
          particles[i] = spawnParticle();
          return;
        }

        const pulse = 0.6 + Math.sin(p.phase) * 0.4;
        const alpha = p.opacity * pulse * particleAlpha;

        // Soft glow
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        pg.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${alpha * 0.4})`);
        pg.addColorStop(1, "transparent");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rising leaves
      const leafAlpha = easeOutCubic(Math.min(t * 2, 1));
      leaves.forEach((leaf, i) => {
        leaf.x += leaf.vx + Math.sin(elapsed * 0.001 + i) * 0.4;
        leaf.y += leaf.vy;
        leaf.rotation += leaf.rotSpeed;

        if (leaf.y < -30) {
          leaves[i] = spawnLeaf(false);
          return;
        }

        drawLeaf(leaf, leafAlpha);
      });

      // Warm vignette at bottom
      const vig = ctx.createLinearGradient(0, h, 0, h * 0.6);
      vig.addColorStop(0, `hsla(25, 30%, 8%, ${0.4 * (1 - t * 0.3)})`);
      vig.addColorStop(1, "transparent");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

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
        style={{ background: "hsl(25, 20%, 6%)" }}
      />

      {/* Poetic text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.6s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-3"
          style={{ color: "hsl(42, 80%, 68%)" }}
        >
          Reaching the Crown…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{
            color: "hsl(40, 55%, 55%)",
            opacity: subtextOpacity,
            transition: "opacity 0.6s ease",
          }}
        >
          Welcome to yOur Golden Dream
        </p>

        {/* Progress — light expanding */}
        <div
          className="mt-8 w-32 md:w-40 h-px relative overflow-hidden rounded-full"
          style={{ background: "hsla(40, 30%, 25%, 0.3)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, hsl(40, 60%, 40%), hsl(48, 85%, 60%))",
              transition: "width 0.1s linear",
              boxShadow: "0 0 10px hsla(45, 80%, 55%, 0.5)",
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

export default CrownEntrance;
