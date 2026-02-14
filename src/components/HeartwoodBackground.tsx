import { useEffect, useRef, useCallback, useState } from "react";

/**
 * HeartwoodBackground — 4-layer dynamic atmospheric background
 * with lightweight parallax and scroll-triggered ambient motion.
 */

interface Mote {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  phase: number;
}

const MOTE_COUNT = 28;

const HeartwoodBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const motesRef = useRef<Mote[]>([]);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);
  const [scrollY, setScrollY] = useState(0);

  // Throttled scroll listener for parallax
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initMotes = useCallback((w: number, h: number) => {
    const motes: Mote[] = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + Math.random() * 2,
        speed: 0.08 + Math.random() * 0.15,
        drift: (Math.random() - 0.5) * 0.3,
        opacity: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      });
    }
    motesRef.current = motes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (motesRef.current.length === 0) {
        initMotes(canvas.offsetWidth, canvas.offsetHeight);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting && !document.hidden; },
      { threshold: 0.05 }
    );
    const container = containerRef.current;
    if (container) observer.observe(container);

    let t = 0;
    const draw = () => {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      t += 0.016;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const m of motesRef.current) {
        m.y -= m.speed;
        m.x += m.drift + Math.sin(t * 0.5 + m.phase) * 0.15;

        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        const flicker = 0.7 + 0.3 * Math.sin(t * 1.2 + m.phase);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 60%, 70%, ${m.opacity * flicker})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (container) observer.unobserve(container);
    };
  }, [initMotes]);

  // Parallax offsets — deeper layers move slower (GPU-friendly transforms)
  const p = Math.min(scrollY * 0.15, 80);  // base gradient
  const p2 = Math.min(scrollY * 0.08, 40); // silhouette
  const p3 = Math.min(scrollY * 0.12, 60); // particles
  const p4 = Math.min(scrollY * 0.05, 30); // glow

  // Scroll-driven opacity fade for ambient depth
  const fadeOut = Math.max(0, 1 - scrollY / 800);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Layer 1 — Deep wood gradient base */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${p}px, 0)`,
          background: `
            radial-gradient(ellipse 60% 50% at 50% 40%, hsl(30 40% 18% / 0.9), transparent 70%),
            radial-gradient(ellipse 80% 70% at 50% 60%, hsl(25 35% 12% / 0.8), transparent 80%),
            linear-gradient(180deg,
              hsl(28 30% 8%) 0%,
              hsl(25 35% 12%) 25%,
              hsl(30 40% 15%) 45%,
              hsl(35 30% 11%) 70%,
              hsl(20 25% 6%) 100%
            )
          `,
        }}
      />

      {/* Warm center glow */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${p}px, 0)`,
          background: `radial-gradient(ellipse 40% 35% at 50% 35%, hsl(38 70% 30% / 0.2), transparent 70%)`,
        }}
      />

      {/* Moss green undertone */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 0% 100%, hsl(140 25% 12% / 0.3), transparent 50%),
            radial-gradient(ellipse 70% 50% at 100% 100%, hsl(140 25% 12% / 0.3), transparent 50%)
          `,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 65% at 50% 45%, transparent 40%, hsl(20 20% 4% / 0.7) 100%)`,
        }}
      />

      {/* Layer 2 — Architectural silhouette with parallax */}
      <svg
        viewBox="0 0 800 600"
        className="absolute inset-0 w-full h-full will-change-transform"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.06 * fadeOut, transform: `translate3d(0, ${p2}px, 0)` }}
      >
        <path
          d="M 300 600 L 300 250 Q 300 120 400 100 Q 500 120 500 250 L 500 600"
          fill="none" stroke="hsl(38, 50%, 45%)" strokeWidth="2"
        />
        <path
          d="M 320 600 L 320 270 Q 320 160 400 140 Q 480 160 480 270 L 480 600"
          fill="none" stroke="hsl(38, 50%, 45%)" strokeWidth="1"
        />
        <circle cx="400" cy="220" r="60" fill="none" stroke="hsl(38, 50%, 45%)" strokeWidth="1.5" />
        <path
          d="M 400 260 L 400 200 M 400 230 L 380 210 M 400 230 L 420 210 M 400 215 L 385 198 M 400 215 L 415 198 M 400 200 L 392 185 M 400 200 L 408 185"
          fill="none" stroke="hsl(38, 50%, 45%)" strokeWidth="1.2" strokeLinecap="round"
        />
        <line x1="200" y1="120" x2="200" y2="600" stroke="hsl(38, 40%, 35%)" strokeWidth="1" />
        <line x1="600" y1="120" x2="600" y2="600" stroke="hsl(38, 40%, 35%)" strokeWidth="1" />
        <path d="M 200 120 Q 400 30 600 120" fill="none" stroke="hsl(38, 40%, 35%)" strokeWidth="1" />
      </svg>

      {/* Layer 3 — Canvas dust particles with parallax */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
        style={{ mixBlendMode: "screen", transform: `translate3d(0, ${p3}px, 0)`, opacity: fadeOut }}
      />

      {/* Layer 4 — Breathing hearth glow with slowest parallax */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: "22%",
          width: "min(500px, 80vw)",
          height: "min(200px, 30vh)",
          background: `radial-gradient(ellipse at center, hsl(38 70% 40% / 0.12), hsl(30 60% 25% / 0.05) 50%, transparent 80%)`,
          animation: "heartwoodBreathe 6s ease-in-out infinite",
          filter: "blur(30px)",
          transform: `translate3d(-50%, ${p4}px, 0)`,
          opacity: fadeOut,
        }}
      />

      {/* Hearth floor glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 100%, hsl(25 60% 20% / 0.3), transparent 70%)`,
        }}
      />

      <style>{`
        @keyframes heartwoodBreathe {
          0%, 100% { opacity: 0.6; transform: translate3d(-50%, ${p4}px, 0) scale(1); }
          50% { opacity: 1; transform: translate3d(-50%, ${p4}px, 0) scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default HeartwoodBackground;
