import { useEffect, useRef, useState, useCallback } from "react";

/**
 * RootsEntrance — a time-lapse descent into the mycelial network.
 *
 * Canvas-rendered roots and glowing threads spread outward,
 * branching and connecting with warm earth tones. Light pulses
 * through completed connections like a living network.
 */

interface RootsEntranceProps {
  onComplete: () => void;
}

interface RootSegment {
  x: number;
  y: number;
  angle: number;
  length: number;
  thickness: number;
  progress: number; // 0-1 growth
  speed: number;
  depth: number;
  hue: number;
  children: number[];
  spawned: boolean;
}

interface MyceliumThread {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  speed: number;
  pulsePhase: number;
  opacity: number;
}

interface SoilParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  drift: number;
  phase: number;
}

const DURATION = 5000;
const MAX_ROOTS = 120;
const THREAD_COUNT = 40;
const PARTICLE_COUNT = 35;

const RootsEntrance = ({ onComplete }: RootsEntranceProps) => {
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
    const startTime = performance.now();
    const roots: RootSegment[] = [];
    const threads: MyceliumThread[] = [];
    const particles: SoilParticle[] = [];

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

    // Seed initial roots from top-center, spreading downward
    const cx = W() / 2;
    const startY = H() * 0.15;
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      roots.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: startY,
        angle,
        length: 60 + Math.random() * 80,
        thickness: 2.5 + Math.random() * 1.5,
        progress: 0,
        speed: 0.008 + Math.random() * 0.006,
        depth: 0,
        hue: 25 + Math.random() * 20,
        children: [],
        spawned: false,
      });
    }

    // Mycelium threads — fine glowing connections
    for (let i = 0; i < THREAD_COUNT; i++) {
      const w = W();
      const h = H();
      const ax = w * 0.1 + Math.random() * w * 0.8;
      const ay = h * 0.25 + Math.random() * h * 0.6;
      const bx = ax + (Math.random() - 0.5) * 150;
      const by = ay + (Math.random() - 0.5) * 80;
      threads.push({
        x1: ax, y1: ay, x2: bx, y2: by,
        progress: 0,
        speed: 0.003 + Math.random() * 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }

    // Soil particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.3 + 0.05,
        drift: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const spawnChildren = (parent: RootSegment, idx: number) => {
      if (parent.spawned || roots.length >= MAX_ROOTS || parent.depth > 5) return;
      parent.spawned = true;
      const count = parent.depth < 2 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
      const endX = parent.x + Math.cos(parent.angle) * parent.length;
      const endY = parent.y + Math.sin(parent.angle) * parent.length;

      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 1.2;
        const newAngle = parent.angle + spread;
        const childIdx = roots.length;
        parent.children.push(childIdx);
        roots.push({
          x: endX + (Math.random() - 0.5) * 4,
          y: endY + (Math.random() - 0.5) * 4,
          angle: newAngle,
          length: parent.length * (0.55 + Math.random() * 0.3),
          thickness: Math.max(0.4, parent.thickness * 0.6),
          progress: 0,
          speed: parent.speed * (1.1 + Math.random() * 0.3),
          depth: parent.depth + 1,
          hue: parent.hue + (Math.random() - 0.5) * 10,
          children: [],
          spawned: false,
        });
      }
    };

    const drawRoot = (root: RootSegment) => {
      if (root.progress <= 0) return;
      const p = Math.min(root.progress, 1);
      const endX = root.x + Math.cos(root.angle) * root.length * p;
      const endY = root.y + Math.sin(root.angle) * root.length * p;

      // Organic curve
      const midX = (root.x + endX) / 2 + Math.sin(root.angle * 3) * 8;
      const midY = (root.y + endY) / 2 + Math.cos(root.angle * 2) * 5;

      ctx.beginPath();
      ctx.moveTo(root.x, root.y);
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.strokeStyle = `hsla(${root.hue}, 35%, ${22 + root.depth * 4}%, ${0.5 * p})`;
      ctx.lineWidth = root.thickness * p;
      ctx.lineCap = "round";
      ctx.stroke();

      // Tip glow while growing
      if (p < 1) {
        const tg = ctx.createRadialGradient(endX, endY, 0, endX, endY, 6);
        tg.addColorStop(0, `hsla(45, 60%, 50%, ${0.4 * (1 - p)})`);
        tg.addColorStop(1, "transparent");
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(endX, endY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawThread = (thread: MyceliumThread, globalT: number) => {
      if (thread.progress <= 0) return;
      const p = Math.min(thread.progress, 1);
      const pulse = 0.5 + Math.sin(thread.pulsePhase + globalT * 3) * 0.5;

      const curX = thread.x1 + (thread.x2 - thread.x1) * p;
      const curY = thread.y1 + (thread.y2 - thread.y1) * p;

      ctx.beginPath();
      ctx.moveTo(thread.x1, thread.y1);
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = `hsla(50, 50%, 55%, ${thread.opacity * p * pulse * 0.6})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Node glow at connection points
      if (p >= 1) {
        const ng = ctx.createRadialGradient(curX, curY, 0, curX, curY, 4);
        ng.addColorStop(0, `hsla(45, 70%, 60%, ${0.3 * pulse})`);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(t);
      setTextOpacity(t < 0.2 ? 0 : Math.min((t - 0.2) / 0.2, 1));
      setSubtextOpacity(t < 0.45 ? 0 : Math.min((t - 0.45) / 0.2, 1));

      const w = W();
      const h = H();

      ctx.clearRect(0, 0, w, h);

      // Earthy background
      const bg = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, h);
      bg.addColorStop(0, "hsl(30, 20%, 12%)");
      bg.addColorStop(0.5, "hsl(25, 18%, 9%)");
      bg.addColorStop(1, "hsl(20, 15%, 6%)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle soil texture
      const texAlpha = easeOutCubic(Math.min(t * 2, 1)) * 0.03;
      for (let i = 0; i < 50; i++) {
        const tx = Math.random() * w;
        const ty = Math.random() * h;
        ctx.fillStyle = `hsla(28, 25%, 30%, ${texAlpha * Math.random()})`;
        ctx.fillRect(tx, ty, Math.random() * 3, Math.random() * 1);
      }

      // Grow roots
      roots.forEach((root, idx) => {
        const delayT = Math.max(0, t - root.depth * 0.08);
        if (delayT > 0) {
          root.progress = Math.min(root.progress + root.speed, 1);
          if (root.progress >= 0.9) spawnChildren(root, idx);
        }
        drawRoot(root);
      });

      // Grow threads with delay
      threads.forEach((thread) => {
        if (t > 0.15) {
          thread.progress = Math.min(thread.progress + thread.speed, 1);
          thread.pulsePhase += 0.02;
        }
        drawThread(thread, t);
      });

      // Soil particles — gentle drift
      const pAlpha = easeOutCubic(Math.min(t * 2, 1));
      particles.forEach((p) => {
        p.phase += 0.01;
        p.drift += 0.005;
        const px = p.x + Math.sin(p.drift) * 2;
        const py = p.y + Math.cos(p.phase) * 1;
        const pulse = 0.5 + Math.sin(p.phase * 2) * 0.5;

        const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
        pg.addColorStop(0, `hsla(40, 50%, 55%, ${p.opacity * pulse * pAlpha})`);
        pg.addColorStop(1, "transparent");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central network glow
      if (t > 0.3) {
        const glowAlpha = easeOutCubic(Math.min((t - 0.3) / 0.4, 1));
        const cg = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.3);
        cg.addColorStop(0, `hsla(40, 50%, 35%, ${0.08 * glowAlpha})`);
        cg.addColorStop(0.5, `hsla(35, 40%, 25%, ${0.04 * glowAlpha})`);
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, w, h);
      }

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
        style={{ background: "hsl(20, 15%, 6%)" }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity: textOpacity, transition: "opacity 0.6s ease" }}
      >
        <p
          className="font-serif text-lg md:text-2xl tracking-[0.15em] mb-3"
          style={{ color: "hsl(90, 35%, 55%)" }}
        >
          Growing the Roots…
        </p>
        <p
          className="font-serif text-xs md:text-sm tracking-[0.2em] uppercase"
          style={{
            color: "hsl(45, 40%, 50%)",
            opacity: subtextOpacity,
            transition: "opacity 0.6s ease",
          }}
        >
          Connecting Beneath the Surface
        </p>

        {/* Progress — network forming */}
        <div
          className="mt-8 w-32 md:w-40 h-px relative overflow-hidden rounded-full"
          style={{ background: "hsla(30, 20%, 20%, 0.3)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, hsl(30, 40%, 30%), hsl(50, 55%, 50%))",
              transition: "width 0.1s linear",
              boxShadow: "0 0 8px hsla(45, 60%, 45%, 0.3)",
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

export default RootsEntrance;
