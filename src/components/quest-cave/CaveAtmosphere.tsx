/**
 * CaveAtmosphere — layered, low-cost ambient backdrop for the Quest Cave.
 *
 * Pure presentation. No data, no events. Pointer-events disabled so it never
 * interferes with content above it. Designed to feel like standing inside a
 * subterranean sanctuary: warm amber light from above, deep emerald below,
 * drifting spores and faint root threads.
 */
import { useMemo } from "react";

interface Props {
  /** Number of drifting spores. Defaults to 14 (mobile-friendly). */
  spores?: number;
  className?: string;
}

export default function CaveAtmosphere({ spores = 14, className }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: spores }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 12 + Math.random() * 14,
        size: 2 + Math.random() * 3,
        opacity: 0.25 + Math.random() * 0.45,
      })),
    [spores],
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {/* Deep cave gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(38 75% 55% / 0.18), transparent 55%), " +
            "radial-gradient(ellipse at 50% 100%, hsl(150 45% 25% / 0.22), transparent 60%), " +
            "linear-gradient(to bottom, hsl(30 30% 8% / 0.04), hsl(150 25% 6% / 0.10))",
        }}
      />
      {/* Glowing root threads */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.18]"
        viewBox="0 0 400 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="root-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 90% 65%)" stopOpacity="0.0" />
            <stop offset="40%" stopColor="hsl(38 90% 65%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(150 60% 45%)" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path
          d="M40,0 C 60,180 20,300 90,460 S 60,700 110,800"
          stroke="url(#root-glow)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M380,0 C 340,160 400,320 320,480 S 360,660 300,800"
          stroke="url(#root-glow)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M200,0 C 220,200 180,360 230,520 S 180,720 220,800"
          stroke="url(#root-glow)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
      {/* Drifting amber spores */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-amber-300/70 blur-[1px]"
            style={{
              left: `${p.left}%`,
              bottom: "-10px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animation: `cave-spore ${p.duration}s linear ${p.delay}s infinite`,
              boxShadow: "0 0 6px hsl(38 90% 65% / 0.6)",
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes cave-spore {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          15%  { opacity: var(--final-opacity, 0.6); }
          85%  { opacity: var(--final-opacity, 0.6); }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden] [style*="cave-spore"] { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
