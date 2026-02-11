import { useEffect, useRef, useState, useCallback } from "react";

/**
 * S33dEntrance — a brief, calming return to the living tree.
 * A great tree silhouette emerges as daylight expands softly.
 * Duration is short (~2.8s) — re-orientation, not spectacle.
 */

interface S33dEntranceProps {
  onComplete: () => void;
}

const DURATION = 2800;

const S33dEntrance = ({ onComplete }: S33dEntranceProps) => {
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

    const drawTree = (w: number, h: number, t: number) => {
      const ease = easeOutCubic(Math.min(t * 1.6, 1));
      const cx = w / 2;
      const trunkBase = h * 0.75;
      const trunkTop = h * 0.35;
      const alpha = 0.15 * ease;

      // Trunk
      ctx.beginPath();
      ctx.moveTo(cx - 12, trunkBase);
      ctx.bezierCurveTo(cx - 15, h * 0.55, cx - 8, h * 0.45, cx - 4, trunkTop);
      ctx.lineTo(cx + 4, trunkTop);
      ctx.bezierCurveTo(cx + 8, h * 0.45, cx + 15, h * 0.55, cx + 12, trunkBase);
      ctx.closePath();
      ctx.fillStyle = `hsla(30, 25%, 20%, ${alpha})`;
      ctx.fill();

      // Branches — from trunk top, spreading outward
      const branches = [
        { angle: -0.7, len: 0.18 }, { angle: -0.35, len: 0.22 },
        { angle: 0.3, len: 0.2 }, { angle: 0.65, len: 0.17 },
        { angle: -1.0, len: 0.12 }, { angle: 0.95, len: 0.13 },
      ];
      branches.forEach((b) => {
        const sway = Math.sin(t * 2 + b.angle * 3) * 4;
        const endX = cx + Math.sin(b.angle) * w * b.len + sway;
        const endY = trunkTop - Math.cos(b.angle) * h * b.len * 0.5;
        const midX = cx + Math.sin(b.angle) * w * b.len * 0.4;
        const midY = trunkTop - Math.cos(b.angle) * h * b.len * 0.2;

        ctx.beginPath();
        ctx.moveTo(cx, trunkTop + 10);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = `hsla(30, 20%, 22%, ${alpha * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      // Roots — mirroring branches below
      const roots = [
        { angle: -0.6, len: 0.12 }, { angle: -0.2, len: 0.15 },
        { angle: 0.25, len: 0.14 }, { angle: 0.55, len: 0.11 },
      ];
      roots.forEach((r) => {
        const endX = cx + Math.sin(r.angle) * w * r.len;
        const endY = trunkBase + Math.cos(r.angle) * h * r.len * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, trunkBase - 5);
        ctx.quadraticCurveTo(
          cx + Math.sin(r.angle) * w * r.len * 0.5,
          trunkBase + 10,
          endX, endY
        );
        ctx.strokeStyle = `hsla(80, 20%, 25%, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      // Canopy — soft leaf mass
      if (t > 0.1) {
        const canopyAlpha = easeOutCubic(Math.min((t - 0.1) / 0.4, 1));
        const cg = ctx.createRadialGradient(cx, trunkTop - 20, 10, cx, trunkTop - 20, w * 0.22);
        cg.addColorStop(0, `hsla(100, 30%, 30%, ${0.1 * canopyAlpha})`);
        cg.addColorStop(0.6, `hsla(90, 25%, 25%, ${0.05 * canopyAlpha})`);
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, w, h);
      }
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      setTextOpacity(t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1);

      const w = W();
      const h = H();
      const cx = w / 2;

      ctx.clearRect(0, 0, w, h);

      // Background — darkness to soft daylight
      const skyEase = easeOutCubic(Math.min(t * 1.5, 1));
      const bg = ctx.createRadialGradient(cx, h * 0.35, 0, cx, h * 0.35, h);
      bg.addColorStop(0, `hsl(80, 15%, ${7 + skyEase * 8}%)`);
      bg.addColorStop(0.5, `hsl(70, 12%, ${5 + skyEase * 5}%)`);
      bg.addColorStop(1, `hsl(60, 10%, ${4 + skyEase * 3}%)`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Expanding daylight
      if (t > 0.05) {
        const lightEase = easeOutCubic(Math.min((t - 0.05) / 0.6, 1));
        const lr = Math.min(w, h) * 0.4 * lightEase;
        const lg = ctx.createRadialGradient(cx, h * 0.35, 0, cx, h * 0.35, lr);
        lg.addColorStop(0, `hsla(55, 40%, 50%, ${0.12 * lightEase})`);
        lg.addColorStop(0.5, `hsla(60, 30%, 40%, ${0.05 * lightEase})`);
        lg.addColorStop(1, "transparent");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, w, h);
      }

      // Tree silhouette
      drawTree(w, h, t);

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
        style={{ background: "hsl(60, 10%, 4%)" }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.4s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-2"
          style={{ color: "hsl(80, 30%, 55%)" }}
        >
          Returning to the Living Tree…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{ color: "hsl(60, 25%, 45%)" }}
        >
          Welcome Back
        </p>
      </div>
    </div>
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default S33dEntrance;
