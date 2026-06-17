/**
 * ParallaxTextures — fixed-viewport parallax layers driven by the
 * global `--tree-depth` (0 → 1) CSS variable. No JS per-frame work.
 *
 * Each layer translates at a different rate so the organism breathes:
 *   • Crown light shafts drift gently downward as you descend
 *   • Canopy leaf-shadow moves opposite to scroll (counter-parallax)
 *   • Trunk bark grain shifts slowly (deep, almost still)
 *   • Root fibres rise upward as you near the bottom
 *
 * Layered behind content (z-0), above HabitatAtmosphere base tints.
 * pointer-events-none, respects prefers-reduced-motion via media query.
 */
import { memo } from "react";

const PARALLAX_CSS = `
@media (prefers-reduced-motion: reduce) {
  .parallax-layer { transform: none !important; }
}
.parallax-layer {
  position: absolute;
  inset: -10% -5%;
  pointer-events: none;
  will-change: transform, opacity;
  transition: transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 800ms ease-out;
}
`;

const ParallaxTextures = memo(() => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <style>{PARALLAX_CSS}</style>

      {/* CROWN — gold light shafts, drift downward as user descends (slow) */}
      <div
        className="parallax-layer"
        style={{
          opacity: `calc(var(--tree-crown, 0) * 0.7)`,
          transform: `translate3d(0, calc(var(--tree-depth, 0) * 60px), 0)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMin slice">
          <defs>
            <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(48 90% 75%)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="200,0 280,0 360,520 240,520" fill="url(#shaft)" />
          <polygon points="560,0 640,0 700,560 540,560" fill="url(#shaft)" opacity="0.7" />
          <polygon points="900,0 980,0 1040,500 920,500" fill="url(#shaft)" opacity="0.6" />
        </svg>
      </div>

      {/* CANOPY — leaf shadow drifting upward (counter-parallax) */}
      <div
        className="parallax-layer"
        style={{
          opacity: `calc(var(--tree-canopy, 0) * 0.55)`,
          transform: `translate3d(calc(var(--tree-depth, 0) * -14px), calc(var(--tree-depth, 0) * -80px), 0)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g fill="hsl(140 35% 28%)" opacity="0.35">
            <ellipse cx="160" cy="180" rx="90" ry="40" />
            <ellipse cx="320" cy="120" rx="70" ry="32" />
            <ellipse cx="540" cy="200" rx="110" ry="44" />
            <ellipse cx="780" cy="140" rx="80" ry="36" />
            <ellipse cx="980" cy="220" rx="100" ry="42" />
            <ellipse cx="240" cy="380" rx="80" ry="34" />
            <ellipse cx="620" cy="420" rx="120" ry="46" />
            <ellipse cx="940" cy="400" rx="90" ry="38" />
          </g>
        </svg>
      </div>

      {/* TRUNK — bark grain shifting slowly (deepest, almost still) */}
      <div
        className="parallax-layer"
        style={{
          opacity: `calc(var(--tree-trunk, 0) * 0.45)`,
          transform: `translate3d(0, calc((var(--tree-depth, 0) - 0.5) * 30px), 0)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g stroke="hsl(28 35% 22%)" strokeWidth="0.7" fill="none" opacity="0.6" strokeLinecap="round">
            <path d="M380,0 Q388,200 376,400 Q384,600 380,800" />
            <path d="M560,0 Q552,200 564,400 Q556,600 560,800" />
            <path d="M740,0 Q748,200 736,400 Q744,600 740,800" />
            <path d="M460,0 Q468,200 456,400 Q464,600 460,800" opacity="0.6" />
            <path d="M660,0 Q652,200 664,400 Q656,600 660,800" opacity="0.6" />
            <path d="M820,0 Q828,200 816,400 Q824,600 820,800" opacity="0.5" />
          </g>
        </svg>
      </div>

      {/* ROOTS — fine fibres rising as user nears the bottom */}
      <div
        className="parallax-layer"
        style={{
          opacity: `calc(var(--tree-roots, 0) * 0.65)`,
          transform: `translate3d(0, calc((1 - var(--tree-depth, 0)) * 60px), 0)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
          <g stroke="hsl(140 50% 36%)" strokeWidth="0.6" fill="none" opacity="0.55" strokeLinecap="round">
            <path d="M60,800 Q80,640 56,480 Q72,340 60,220" />
            <path d="M260,800 Q240,650 264,500 Q244,360 260,240" />
            <path d="M540,800 Q560,640 536,490 Q556,340 540,220" />
            <path d="M820,800 Q800,640 824,490 Q804,340 820,220" />
            <path d="M1080,800 Q1100,640 1076,490 Q1096,340 1080,220" />
          </g>
          <g stroke="hsl(120 40% 32%)" strokeWidth="0.4" fill="none" opacity="0.4" strokeLinecap="round">
            <path d="M160,800 Q180,700 156,600" />
            <path d="M400,800 Q380,700 404,600" />
            <path d="M680,800 Q700,700 676,600" />
            <path d="M940,800 Q920,700 944,600" />
          </g>
        </svg>
      </div>
    </div>
  );
});
ParallaxTextures.displayName = "ParallaxTextures";

export default ParallaxTextures;
