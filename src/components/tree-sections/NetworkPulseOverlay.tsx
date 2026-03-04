/**
 * NetworkPulseOverlay — the Living Tree's nervous system.
 *
 * A pure CSS/SVG overlay that renders:
 * 1. A slow arterial heartbeat pulse through the trunk
 * 2. Event-triggered ripples (root glow, trunk shimmer, canopy lanterns)
 * 3. Vitality-scaled ambient glow
 *
 * All animations are GPU-accelerated (opacity + transform only).
 * Respects prefers-reduced-motion.
 */
import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PulseEvent, PulseEventType } from "@/hooks/use-network-pulse";
import type { TreeVitality } from "@/hooks/use-tree-vitality";

interface Props {
  latestEvent: PulseEvent | null;
  vitality?: TreeVitality;
}

/** Where each event type visually manifests */
const EVENT_ZONES: Record<PulseEventType, { position: string; hue: string; label: string }> = {
  tree_mapped: {
    position: "bottom-[8%]",
    hue: "120 45% 50%",
    label: "A new Ancient Friend joins the network",
  },
  offering: {
    position: "bottom-[45%]",
    hue: "35 60% 55%",
    label: "An offering rises through the heartwood",
  },
  council: {
    position: "top-[20%]",
    hue: "150 40% 50%",
    label: "The council stirs in the canopy",
  },
  library: {
    position: "bottom-[55%]",
    hue: "28 50% 50%",
    label: "A story enters the library",
  },
  heartbeat: {
    position: "bottom-[40%]",
    hue: "42 70% 55%",
    label: "",
  },
};

/** Single ripple effect component */
const PulseRipple = memo(({ event }: { event: PulseEvent }) => {
  const zone = EVENT_ZONES[event.type];
  const isHeartbeat = event.type === "heartbeat";

  return (
    <motion.div
      key={event.id}
      className={`absolute left-1/2 -translate-x-1/2 ${zone.position} pointer-events-none z-[5]`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: event.intensity * (isHeartbeat ? 0.3 : 0.6), scale: 1 }}
      exit={{ opacity: 0, scale: 1.4 }}
      transition={{ duration: isHeartbeat ? 3.6 : 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Radial glow */}
      <div
        className="w-40 h-40 md:w-56 md:h-56 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(${zone.hue} / ${event.intensity * 0.15}), transparent 70%)`,
        }}
      />
      {/* Event label — only for non-heartbeat, and very subtle */}
      {!isHeartbeat && (
        <motion.p
          className="absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-serif tracking-[0.2em] text-center select-none"
          style={{ color: `hsl(${zone.hue} / 0.5)` }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 1.5 }}
        >
          {zone.label}
        </motion.p>
      )}
    </motion.div>
  );
});

PulseRipple.displayName = "PulseRipple";

/** Trunk arterial line — a vertical glow that pulses with the heartbeat */
const ArterialLine = memo(({ vitality }: { vitality: number }) => (
  <div
    className="absolute left-1/2 -translate-x-1/2 w-[1px] pointer-events-none z-[3]"
    style={{
      top: "15%",
      bottom: "10%",
      background: `linear-gradient(
        to bottom,
        hsl(45 70% 60% / ${0.02 + vitality * 0.04}),
        hsl(35 50% 50% / ${0.04 + vitality * 0.06}) 30%,
        hsl(28 40% 45% / ${0.05 + vitality * 0.07}) 50%,
        hsl(120 30% 40% / ${0.03 + vitality * 0.05}) 80%,
        hsl(120 25% 35% / ${0.02 + vitality * 0.03})
      )`,
      animation: "arterial-flow 3.6s ease-in-out infinite",
    }}
  />
));

ArterialLine.displayName = "ArterialLine";

/** Root mycelium glow — bottom of the page, intensity scales with vitality */
const MyceliumGlow = memo(({ vitality, stage }: { vitality: number; stage: string }) => {
  const spread = stage === "sparse" ? 30 : stage === "growing" ? 45 : stage === "thriving" ? 60 : 75;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
      style={{
        height: `${spread}%`,
        background: `radial-gradient(
          ellipse at 50% 100%,
          hsl(120 35% 40% / ${0.03 + vitality * 0.05}),
          hsl(90 25% 35% / ${0.02 + vitality * 0.03}) 40%,
          transparent 80%
        )`,
        animation: "mycelium-breathe 6s ease-in-out infinite",
      }}
    />
  );
});

MyceliumGlow.displayName = "MyceliumGlow";

/** Canopy ambient glow — top of the page */
const CanopyGlow = memo(({ vitality }: { vitality: number }) => (
  <div
    className="absolute top-0 left-0 right-0 pointer-events-none z-[2]"
    style={{
      height: "25%",
      background: `radial-gradient(
        ellipse at 50% 0%,
        hsl(45 60% 65% / ${0.02 + vitality * 0.04}),
        hsl(150 30% 50% / ${0.01 + vitality * 0.02}) 50%,
        transparent 85%
      )`,
      animation: "canopy-breathe 8s ease-in-out infinite",
    }}
  />
));

CanopyGlow.displayName = "CanopyGlow";

const NetworkPulseOverlay = ({ latestEvent, vitality }: Props) => {
  const [activeRipples, setActiveRipples] = useState<PulseEvent[]>([]);
  const v = vitality?.vitality ?? 0.2;
  const stage = vitality?.stage ?? "sparse";

  // Reduced motion check
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Queue ripples when events arrive
  useEffect(() => {
    if (!latestEvent || prefersReduced) return;
    setActiveRipples((prev) => [latestEvent, ...prev].slice(0, 4));

    // Auto-remove after animation
    const timeout = setTimeout(() => {
      setActiveRipples((prev) => prev.filter((e) => e.id !== latestEvent.id));
    }, latestEvent.type === "heartbeat" ? 4000 : 3000);

    return () => clearTimeout(timeout);
  }, [latestEvent, prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4]" aria-hidden="true">
      {/* Structural ambient layers */}
      <CanopyGlow vitality={v} />
      <ArterialLine vitality={v} />
      <MyceliumGlow vitality={v} stage={stage} />

      {/* Event ripples */}
      <AnimatePresence mode="sync">
        {activeRipples.map((evt) => (
          <PulseRipple key={evt.id} event={evt} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default memo(NetworkPulseOverlay);
