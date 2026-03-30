/**
 * TreeDepthBackground — a fixed, scroll-driven atmospheric background
 * that renders a single continuous ancient tree organism the user moves through.
 *
 * Architecture:
 * 1. Interpolated base gradient (continuous color flow, no thresholds)
 * 2. SVG root mycelium network (fades in from ground, fully present in roots)
 * 3. SVG bark/heartwood grain (strongest in trunk, whispers outward)
 * 4. SVG canopy branches + light filtering (strongest in crown/canopy, lingers below)
 * 5. Sparse floating motes (zone-tinted, very few)
 * 6. Depth vignette
 *
 * All layers overlap significantly so the tree feels whole.
 * pointer-events-none. Respects prefers-reduced-motion. User toggle persisted.
 */
import { memo, useEffect, useState, useMemo, useRef, useCallback } from "react";

// ── Inline scroll depth (avoids extra module, RAF-throttled) ──
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const last = useRef(-1);

  const tick = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (Math.abs(p - last.current) > 0.001) {
      last.current = p;
      setProgress(p);
    }
    raf.current = 0;
  }, []);

  useEffect(() => {
    const onScroll = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener("scroll", onScroll); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [tick]);

  return progress;
}

// ── Smooth color interpolation across 5 anchor points ──
type HSL = { h: number; s: number; l: number };
const ANCHORS: { at: number; color: HSL }[] = [
  { at: 0,    color: { h: 45,  s: 65, l: 11 } },  // crown — warm gold
  { at: 0.2,  color: { h: 130, s: 28, l: 10 } },  // canopy — forest green
  { at: 0.45, color: { h: 28,  s: 32, l: 10 } },  // trunk — warm amber
  { at: 0.65, color: { h: 60,  s: 12, l: 9  } },  // ground — neutral earth
  { at: 1,    color: { h: 18,  s: 18, l: 6  } },  // roots — deep loam
];

function interpColor(p: number): HSL {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    if (p <= ANCHORS[i + 1].at) {
      const t = (p - ANCHORS[i].at) / (ANCHORS[i + 1].at - ANCHORS[i].at);
      const a = ANCHORS[i].color, b = ANCHORS[i + 1].color;
      return { h: a.h + (b.h - a.h) * t, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t };
    }
  }
  return ANCHORS[ANCHORS.length - 1].color;
}

/** Smooth opacity curve: rises from `start`, peaks at `peak`, fades after `end` */
function bellCurve(p: number, start: number, peak: number, end: number): number {
  if (p < start || p > end) return 0;
  if (p <= peak) return (p - start) / (peak - start);
  return (end - p) / (end - peak);
}

// ══════════════════════════════════════════════════
// SVG LAYERS — designed for overlap and continuity
// ══════════════════════════════════════════════════

/** Mycelium root network — bottom-anchored, deep and branching */
const RootMycelium = memo(({ opacity, progress }: { opacity: number; progress: number }) => {
  // Slow parallax: roots shift slightly upward as user descends
  const drift = -progress * 15;
  return (
    <svg
      className="absolute bottom-0 left-0 w-full will-change-transform"
      style={{
        height: "55%",
        opacity,
        transform: `translateY(${drift}px)`,
        transition: "opacity 1.2s ease",
      }}
      viewBox="0 0 1400 500"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Primary root trunks — thick, ancient, asymmetric */}
      <path d="M180 500 Q160 400 200 330 Q175 260 220 200 Q195 150 240 90 Q225 50 260 10" stroke="hsl(100 30% 35%)" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M180 500 Q220 420 195 350 Q235 280 210 220 Q240 165 225 120" stroke="hsl(110 25% 30%)" strokeWidth="2.2" fill="none" opacity="0.4" />
      <path d="M180 500 Q140 430 165 370 Q130 310 155 260" stroke="hsl(95 28% 32%)" strokeWidth="1.5" fill="none" opacity="0.3" />

      <path d="M650 500 Q630 380 670 300 Q640 220 690 150 Q665 90 710 30" stroke="hsl(90 32% 33%)" strokeWidth="3.5" fill="none" opacity="0.45" />
      <path d="M650 500 Q690 400 660 320 Q700 250 675 190 Q710 140 690 90" stroke="hsl(105 25% 30%)" strokeWidth="2.5" fill="none" opacity="0.35" />
      <path d="M650 500 Q610 420 640 350 Q600 290 630 240" stroke="hsl(115 22% 28%)" strokeWidth="1.8" fill="none" opacity="0.25" />

      <path d="M1100 500 Q1080 390 1120 310 Q1090 240 1130 170 Q1110 110 1150 50" stroke="hsl(108 28% 32%)" strokeWidth="2.8" fill="none" opacity="0.42" />
      <path d="M1100 500 Q1140 430 1110 360 Q1150 300 1125 250" stroke="hsl(95 22% 28%)" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M1100 500 Q1060 440 1085 380 Q1050 330 1075 280" stroke="hsl(115 20% 26%)" strokeWidth="1.3" fill="none" opacity="0.2" />

      {/* Secondary feeder roots — thinner, more organic */}
      <path d="M400 500 Q390 430 420 380 Q405 330 435 280 Q420 240 450 200" stroke="hsl(100 25% 30%)" strokeWidth="1.5" fill="none" opacity="0.28" />
      <path d="M900 500 Q910 420 890 360 Q920 300 900 250" stroke="hsl(110 22% 28%)" strokeWidth="1.3" fill="none" opacity="0.22" />
      <path d="M1300 500 Q1280 440 1300 390 Q1275 340 1310 290" stroke="hsl(95 20% 27%)" strokeWidth="1" fill="none" opacity="0.18" />

      {/* Mycelium web — horizontal connective threads at depth */}
      <path d="M0 460 Q120 445 250 455 Q400 440 550 458 Q700 442 850 455 Q1000 440 1150 452 Q1300 445 1400 460" stroke="hsl(120 30% 35%)" strokeWidth="1" fill="none" opacity="0.22" />
      <path d="M0 480 Q180 470 360 478 Q540 468 720 480 Q900 470 1080 478 Q1260 470 1400 482" stroke="hsl(110 25% 32%)" strokeWidth="0.8" fill="none" opacity="0.18" />
      <path d="M100 430 Q280 420 460 432 Q640 418 820 430 Q1000 420 1180 435" stroke="hsl(100 28% 33%)" strokeWidth="0.6" fill="none" opacity="0.15" />

      {/* Mycelial intersection nodes — living network pulse */}
      <circle cx="200" cy="330" r="5" fill="hsl(120 40% 40%)" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="670" cy="300" r="6" fill="hsl(90 35% 38%)" opacity="0.18">
        <animate attributeName="opacity" values="0.18;0.35;0.18" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="1120" cy="310" r="4.5" fill="hsl(110 32% 36%)" opacity="0.15">
        <animate attributeName="opacity" values="0.15;0.3;0.15" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="430" cy="380" r="4" fill="hsl(105 38% 38%)" opacity="0.12">
        <animate attributeName="opacity" values="0.12;0.25;0.12" dur="9s" repeatCount="indefinite" />
      </circle>
      <circle cx="890" cy="360" r="3.5" fill="hsl(115 30% 35%)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.22;0.1" dur="5.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
});
RootMycelium.displayName = "RootMycelium";

/** Bark / heartwood grain — vertical wood-flow texture for the trunk zone */
const BarkGrain = memo(({ opacity }: { opacity: number }) => (
  <svg
    className="absolute inset-0 w-full h-full"
    style={{ opacity, transition: "opacity 1s ease" }}
    viewBox="0 0 1400 900"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Vertical bark ridges — organic, slightly wandering */}
    <path d="M350 0 Q355 120 345 250 Q355 380 348 500 Q356 630 350 760 Q354 840 350 900" stroke="hsl(28 30% 28%)" strokeWidth="1.8" fill="none" opacity="0.3" />
    <path d="M380 0 Q375 100 383 220 Q372 340 380 460 Q375 580 382 700 Q377 800 380 900" stroke="hsl(25 25% 25%)" strokeWidth="1.2" fill="none" opacity="0.2" />

    <path d="M700 0 Q705 150 695 300 Q708 440 698 580 Q705 720 700 900" stroke="hsl(30 32% 30%)" strokeWidth="2" fill="none" opacity="0.25" />
    <path d="M720 0 Q715 130 725 270 Q712 400 720 530 Q716 670 722 900" stroke="hsl(26 24% 26%)" strokeWidth="1" fill="none" opacity="0.18" />

    <path d="M1050 0 Q1055 110 1045 230 Q1058 360 1048 490 Q1055 620 1050 750 Q1053 830 1050 900" stroke="hsl(28 28% 27%)" strokeWidth="1.5" fill="none" opacity="0.22" />

    {/* Growth rings — faint horizontal arcs */}
    <ellipse cx="700" cy="350" rx="280" ry="8" fill="none" stroke="hsl(30 25% 28%)" strokeWidth="0.6" opacity="0.12" />
    <ellipse cx="700" cy="550" rx="240" ry="6" fill="none" stroke="hsl(28 22% 26%)" strokeWidth="0.5" opacity="0.1" />

    {/* Knot — ancient knot */}
    <circle cx="700" cy="450" r="8" fill="none" stroke="hsl(28 35% 30%)" strokeWidth="1" opacity="0.15" />
    <circle cx="700" cy="450" r="4" fill="hsl(28 30% 22%)" opacity="0.08" />

    {/* Moss accent on bark */}
    <ellipse cx="360" cy="400" rx="12" ry="4" fill="hsl(120 28% 32%)" opacity="0.1" />
    <ellipse cx="1045" cy="500" rx="10" ry="3" fill="hsl(130 25% 30%)" opacity="0.08" />
  </svg>
));
BarkGrain.displayName = "BarkGrain";

/** Canopy branches + leaf light — top-anchored, enchanted and asymmetric */
const CanopyBranches = memo(({ opacity, progress }: { opacity: number; progress: number }) => {
  const drift = progress * 10; // branches drift slightly downward as user climbs
  return (
    <svg
      className="absolute top-0 left-0 w-full will-change-transform"
      style={{
        height: "50%",
        opacity,
        transform: `translateY(${drift}px)`,
        transition: "opacity 1.2s ease",
      }}
      viewBox="0 0 1400 450"
      preserveAspectRatio="xMidYMin slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left branch cluster */}
      <path d="M120 0 Q155 70 135 145 Q170 210 150 285 Q185 340 165 400" stroke="hsl(138 28% 32%)" strokeWidth="4" fill="none" opacity="0.35" />
      <path d="M120 0 Q90 55 110 115 Q80 165 100 220 Q75 265 95 310" stroke="hsl(148 24% 30%)" strokeWidth="2.8" fill="none" opacity="0.28" />
      <path d="M155 145 Q200 155 240 140 Q280 130 310 145" stroke="hsl(140 25% 30%)" strokeWidth="2" fill="none" opacity="0.22" />
      {/* Leaf clusters */}
      <ellipse cx="160" cy="150" rx="30" ry="18" fill="hsl(140 32% 30%)" opacity="0.12" />
      <ellipse cx="105" cy="120" rx="22" ry="12" fill="hsl(150 28% 28%)" opacity="0.1" />
      <ellipse cx="250" cy="140" rx="18" ry="10" fill="hsl(135 30% 29%)" opacity="0.09" />
      <ellipse cx="95" cy="230" rx="16" ry="9" fill="hsl(145 25% 27%)" opacity="0.07" />

      {/* Center branch — taller */}
      <path d="M680 0 Q710 90 690 180 Q720 260 700 340 Q730 400 710 450" stroke="hsl(132 30% 30%)" strokeWidth="3.5" fill="none" opacity="0.32" />
      <path d="M680 0 Q650 70 670 140 Q640 200 660 270" stroke="hsl(142 24% 28%)" strokeWidth="2.5" fill="none" opacity="0.24" />
      <path d="M690 180 Q740 190 780 175 Q820 170 850 185" stroke="hsl(136 22% 28%)" strokeWidth="1.5" fill="none" opacity="0.18" />
      <ellipse cx="700" cy="190" rx="35" ry="20" fill="hsl(138 30% 28%)" opacity="0.1" />
      <ellipse cx="650" cy="150" rx="20" ry="11" fill="hsl(145 26% 27%)" opacity="0.08" />
      <ellipse cx="790" cy="178" rx="24" ry="13" fill="hsl(132 28% 28%)" opacity="0.07" />

      {/* Right branch */}
      <path d="M1120 0 Q1145 65 1125 135 Q1150 200 1135 270 Q1160 320 1140 370" stroke="hsl(135 28% 30%)" strokeWidth="3" fill="none" opacity="0.3" />
      <path d="M1120 0 Q1095 50 1110 105 Q1085 155 1105 210" stroke="hsl(145 22% 28%)" strokeWidth="2" fill="none" opacity="0.2" />
      <ellipse cx="1130" cy="140" rx="25" ry="14" fill="hsl(140 28% 28%)" opacity="0.09" />
      <ellipse cx="1090" cy="110" rx="16" ry="9" fill="hsl(148 24% 26%)" opacity="0.07" />

      {/* Light rays filtering through */}
      <line x1="320" y1="0" x2="340" y2="450" stroke="hsl(45 60% 60%)" strokeWidth="1.5" opacity="0.08" />
      <line x1="550" y1="0" x2="540" y2="450" stroke="hsl(48 55% 58%)" strokeWidth="1" opacity="0.06" />
      <line x1="920" y1="0" x2="900" y2="450" stroke="hsl(42 55% 58%)" strokeWidth="1.2" opacity="0.05" />
      <line x1="1250" y1="0" x2="1270" y2="450" stroke="hsl(50 50% 55%)" strokeWidth="0.8" opacity="0.04" />

      {/* Dappled light patches */}
      <ellipse cx="350" cy="300" rx="40" ry="20" fill="hsl(45 55% 58%)" opacity="0.04" />
      <ellipse cx="850" cy="350" rx="50" ry="25" fill="hsl(48 50% 55%)" opacity="0.03" />
    </svg>
  );
});
CanopyBranches.displayName = "CanopyBranches";

/** Sparse floating motes — very few, zone-tinted, organic drift */
const FloatingMotes = memo(({ progress, reducedMotion }: { progress: number; reducedMotion: boolean }) => {
  const motes = useMemo(() => {
    // Only 6 motes total across the entire viewport — always present, tint shifts
    const base = [
      { left: "12%", top: "18%", size: 2.5, delay: 0, dur: 8 },
      { left: "78%", top: "25%", size: 2, delay: 2.5, dur: 10 },
      { left: "35%", top: "55%", size: 1.8, delay: 4, dur: 9 },
      { left: "62%", top: "68%", size: 2.2, delay: 1.5, dur: 7 },
      { left: "88%", top: "42%", size: 1.5, delay: 5, dur: 11 },
      { left: "22%", top: "82%", size: 2, delay: 3, dur: 8.5 },
    ];
    return base;
  }, []);

  if (reducedMotion) return null;

  // Color shifts continuously with progress
  const moteHue = 45 + (progress * 80); // gold → green
  const moteSat = 40 + (1 - Math.abs(progress - 0.5) * 2) * 20; // brighter near ground
  const moteLight = 45 - progress * 15; // dimmer in roots

  return (
    <>
      {motes.map((m, i) => (
        <div
          key={i}
          className="absolute rounded-full tree-depth-particle"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            backgroundColor: `hsl(${moteHue} ${moteSat}% ${moteLight}%)`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.dur}s`,
            transition: "background-color 2s ease",
          }}
        />
      ))}
    </>
  );
});
FloatingMotes.displayName = "FloatingMotes";

/** Toggle button */
const ToggleButton = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="fixed bottom-20 right-3 z-50 w-7 h-7 rounded-full flex items-center justify-center text-[10px] border transition-all duration-300 md:bottom-4"
    style={{
      background: enabled ? "hsl(var(--card) / 0.6)" : "hsl(var(--card) / 0.9)",
      borderColor: "hsl(var(--border) / 0.2)",
      color: "hsl(var(--muted-foreground) / 0.5)",
      backdropFilter: "blur(8px)",
    }}
    aria-label={enabled ? "Disable background effects" : "Enable background effects"}
    title={enabled ? "Disable background effects" : "Enable background effects"}
  >
    {enabled ? "🌿" : "○"}
  </button>
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
const TreeDepthBackground = () => {
  const progress = useScrollProgress();
  const [enabled, setEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tree-depth-bg");
    if (saved === "off") setEnabled(false);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("tree-depth-bg", next ? "on" : "off");
  };

  // ── Continuous color interpolation ──
  const c = interpColor(progress);

  // ── Layer opacities with wide overlapping bell curves ──
  // Roots: begin hinting at 0.3, strengthen from 0.5, peak near 1.0
  const rootOp = Math.min(1, Math.max(0, (progress - 0.3) / 0.5));
  // Bark: present from 0.1 → 0.85, peak at 0.45 (trunk center)
  const barkOp = bellCurve(progress, 0.1, 0.45, 0.85);
  // Canopy: strongest at top, lingers to 0.6
  const canopyOp = Math.min(1, Math.max(0, 1 - progress / 0.55));

  if (!enabled) {
    return <ToggleButton enabled={enabled} onToggle={handleToggle} />;
  }

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(ellipse at 50% ${25 + progress * 50}%, hsl(${c.h} ${c.s}% ${c.l + 6}% / 0.25), transparent 55%),
            radial-gradient(ellipse at ${25 + progress * 25}% ${40 + progress * 35}%, hsl(${c.h} ${Math.max(12, c.s - 5)}% ${c.l + 3}% / 0.15), transparent 50%),
            linear-gradient(to bottom, hsl(${c.h} ${c.s}% ${c.l}% / 0.05), hsl(${c.h} ${c.s}% ${Math.max(3, c.l - 2)}% / 0.18))
          `,
        }}
      >
        {/* Layer 1: Canopy — branches + enchanted light (top-anchored, lingers downward) */}
        <CanopyBranches opacity={canopyOp * 0.85} progress={progress} />

        {/* Layer 2: Bark grain — the tree's living body (centered, fades to edges) */}
        <BarkGrain opacity={barkOp * 0.7} />

        {/* Layer 3: Root mycelium — ancient network (bottom-anchored, whispers upward) */}
        <RootMycelium opacity={rootOp * 0.8} progress={progress} />

        {/* Layer 4: Sparse floating motes — always present, color shifts with depth */}
        <FloatingMotes progress={progress} reducedMotion={reducedMotion} />

        {/* Layer 5: Depth vignette — deepens continuously */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 ${120 + progress * 80}px ${30 + progress * 30}px hsl(${c.h} ${c.s}% ${Math.max(3, c.l - 3)}% / ${0.2 + progress * 0.3})`,
          }}
        />
      </div>

      <ToggleButton enabled={enabled} onToggle={handleToggle} />
    </>
  );
};

export default memo(TreeDepthBackground);
