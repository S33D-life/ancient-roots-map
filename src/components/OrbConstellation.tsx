/**
 * OrbConstellation — radial action layout that blooms around the Orb.
 * Renders 6 action nodes in a circular/arc pattern anchored to the Orb position.
 * Edge-aware: adjusts arc when near screen boundaries.
 * Includes faint connecting lines from center to each node.
 */
import { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Z } from "@/lib/z-index";
import GlobalSearch from "@/components/GlobalSearch";
import { useState } from "react";
import teotagLogo from "@/assets/teotag-small.webp";
import { captureAndExport } from "@/lib/capture-view";

/* ─── Action definitions ─── */
export interface ConstellationAction {
  key: string;
  emoji: string;
  label: string;
  /** "nav" navigates, "search" opens search, "dialog" triggers onSelectAction, "capture" triggers screenshot */
  action: "nav" | "search" | "dialog" | "capture";
  to?: string;
}

const DEFAULT_ACTIONS: ConstellationAction[] = [
  { key: "search", emoji: "🔍", label: "Search", action: "search" },
  { key: "whisper", emoji: "🌬️", label: "Whisper", action: "nav", to: "/whispers" },
  { key: "companion", emoji: "📱", label: "Companion", action: "nav", to: "/companion" },
  { key: "add_tree", emoji: "🌳", label: "Add Tree", action: "nav", to: "/add-tree" },
  { key: "capture", emoji: "📸", label: "Capture", action: "capture" },
  { key: "spark", emoji: "🐞", label: "Spark", action: "dialog" },
];

const MAP_ACTIONS: ConstellationAction[] = [
  { key: "add_tree", emoji: "🌳", label: "Add Tree", action: "nav", to: "/add-tree" },
  { key: "search", emoji: "🔍", label: "Search", action: "search" },
  { key: "companion", emoji: "📱", label: "Companion", action: "nav", to: "/companion" },
  { key: "capture", emoji: "📸", label: "Capture", action: "capture" },
  { key: "whisper", emoji: "🌬️", label: "Whisper", action: "nav", to: "/whispers" },
  { key: "spark", emoji: "🐞", label: "Spark", action: "dialog" },
];

const TREE_ACTIONS: ConstellationAction[] = [
  { key: "whisper", emoji: "🌬️", label: "Whisper", action: "nav", to: "/whispers" },
  { key: "capture", emoji: "📸", label: "Capture", action: "capture" },
  { key: "companion", emoji: "📱", label: "Companion", action: "nav", to: "/companion" },
  { key: "search", emoji: "🔍", label: "Search", action: "search" },
  { key: "add_tree", emoji: "🌳", label: "Add Tree", action: "nav", to: "/add-tree" },
  { key: "spark", emoji: "🐞", label: "Spark", action: "dialog" },
];

function getActionsForRoute(pathname: string): ConstellationAction[] {
  if (pathname.startsWith("/map")) return MAP_ACTIONS;
  if (pathname.startsWith("/tree/")) return TREE_ACTIONS;
  return DEFAULT_ACTIONS;
}

/* ─── Layout geometry ─── */
const NODE_SIZE = 44;
const ORBIT_RADIUS = 76;
const REDUCED_MOTION = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

/** Compute the angle offset so constellation fans inward from screen edges */
function computeLayout(
  cx: number,
  cy: number,
  count: number,
): { angles: number[]; radius: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = NODE_SIZE / 2 + 8;

  // Full circle by default
  let startAngle = -Math.PI / 2; // top
  let sweep = Math.PI * 2;
  let radius = ORBIT_RADIUS;

  // Edge constraints — use arc instead of full circle
  const nearRight = cx > vw - ORBIT_RADIUS - pad;
  const nearLeft = cx < ORBIT_RADIUS + pad;
  const nearTop = cy < ORBIT_RADIUS + pad + 56; // header offset
  const nearBottom = cy > vh - ORBIT_RADIUS - pad - 56; // bottom nav

  if (nearRight || nearLeft || nearTop || nearBottom) {
    sweep = Math.PI * 1.4; // ~250° arc
    // Determine center of arc pointing inward
    if (nearRight && nearBottom) {
      startAngle = Math.PI * 0.75; // fan up-left
    } else if (nearRight && nearTop) {
      startAngle = Math.PI * 0.25; // fan down-left
    } else if (nearLeft && nearBottom) {
      startAngle = -Math.PI * 0.25; // fan up-right
    } else if (nearLeft && nearTop) {
      startAngle = -Math.PI * 0.75; // fan down-right
    } else if (nearRight) {
      startAngle = Math.PI * 0.4;
    } else if (nearLeft) {
      startAngle = -Math.PI * 0.4;
    } else if (nearTop) {
      startAngle = 0; // fan downward
    } else if (nearBottom) {
      startAngle = -Math.PI; // fan upward
    }
  }

  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    const frac = count === 1 ? 0 : i / (sweep >= Math.PI * 1.9 ? count : count - 1);
    angles.push(startAngle + frac * sweep);
  }

  return { angles, radius };
}

/* ─── Component ─── */
interface OrbConstellationProps {
  open: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  /** Center of the Orb (px) */
  cx: number;
  cy: number;
  /** App update state */
  updateAvailable?: boolean;
  onApplyUpdate?: () => void;
  onDismissUpdate?: () => void;
  /** Unread heart signals count */
  unreadSignals?: number;
}

export default function OrbConstellation({
  open,
  onClose,
  onSelectAction,
  cx,
  cy,
  updateAvailable,
  onApplyUpdate,
  onDismissUpdate,
  unreadSignals = 0,
}: OrbConstellationProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const baseActions = useMemo(() => getActionsForRoute(pathname), [pathname]);
  const actions = useMemo(() => {
    const result = [...baseActions];
    // Add signals action if there are unread signals
    if (unreadSignals > 0) {
      const signalAction: ConstellationAction = {
        key: "signals",
        emoji: "✨",
        label: `Signals (${unreadSignals})`,
        action: "dialog", // handled via onSelectAction
      };
      result.unshift(signalAction);
    }
    if (updateAvailable) {
      const updateAction: ConstellationAction = {
        key: "update",
        emoji: "🔄",
        label: "Update",
        action: "nav",
      };
      result.unshift(updateAction);
    }
    return result;
  }, [baseActions, updateAvailable, unreadSignals]);
  const layout = useMemo(() => computeLayout(cx, cy, actions.length), [cx, cy, actions.length]);

  const handleAction = useCallback(
    (a: ConstellationAction) => {
      onClose();
      if (a.key === "update" && onApplyUpdate) {
        setTimeout(() => onApplyUpdate(), 120);
        return;
      }
      if (a.action === "capture") {
        setTimeout(() => captureAndExport(), 200);
        return;
      }
      if (a.action === "search") {
        setTimeout(() => setSearchOpen(true), 120);
      } else if (a.action === "nav" && a.to) {
        setTimeout(() => navigate(a.to!), 120);
      } else {
        setTimeout(() => onSelectAction(a.key), 120);
      }
    },
    [onClose, navigate, onSelectAction, onApplyUpdate],
  );

  // Orb center in page coords
  const orbCenterX = cx + 24; // FAB_SIZE/2
  const orbCenterY = cy + 24;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-capture-exclude
            key="orb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ zIndex: Z.FLOATING - 1 }}
            onClick={onClose}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Constellation nodes + connecting lines */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-capture-exclude
            key="orb-constellation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: Z.FLOATING + 1 }}
          >
            {/* Faint connecting lines — SVG layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
            >
              {actions.map((a, i) => {
                const angle = layout.angles[i];
                const tx = orbCenterX + Math.cos(angle) * layout.radius;
                const ty = orbCenterY + Math.sin(angle) * layout.radius;
                return (
                  <motion.line
                    key={`line-${a.key}`}
                    x1={orbCenterX}
                    y1={orbCenterY}
                    x2={tx}
                    y2={ty}
                    stroke="hsl(var(--primary) / 0.12)"
                    strokeWidth={1}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{
                      duration: REDUCED_MOTION ? 0.1 : 0.3,
                      delay: REDUCED_MOTION ? 0 : i * 0.04,
                    }}
                  />
                );
              })}
            </svg>

            {/* TEOTAG center — replaces the orb when constellation is open */}
            <motion.button
              key="teotag-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
              onClick={() => {
                onClose();
                setTimeout(() => navigate("/dashboard?tab=teotag"), 120);
              }}
              className="fixed flex items-center justify-center pointer-events-auto rounded-full
                active:scale-90 transition-transform duration-150 group"
              style={{
                width: 52,
                height: 52,
                left: orbCenterX - 26,
                top: orbCenterY - 26,
              }}
              aria-label="TEOTAG — Enter the Hearth"
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <img
                src={teotagLogo}
                alt="TEOTAG"
                className="w-11 h-11 rounded-full object-cover transition-all duration-300
                  group-hover:scale-110 group-hover:shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                style={{
                  border: "1.5px solid hsl(var(--primary) / 0.4)",
                  boxShadow: "0 0 12px hsl(var(--primary) / 0.3)",
                }}
              />
              <span
                className="absolute text-[8px] font-serif tracking-wide whitespace-nowrap
                  text-muted-foreground/70 group-hover:text-primary/90 transition-colors duration-200"
                style={{ top: 56, left: "50%", transform: "translateX(-50%)" }}
              >
                Hearth
              </span>
            </motion.button>

            {/* Action nodes */}
            {actions.map((a, i) => {
              const angle = layout.angles[i];
              const tx = orbCenterX + Math.cos(angle) * layout.radius - NODE_SIZE / 2;
              const ty = orbCenterY + Math.sin(angle) * layout.radius - NODE_SIZE / 2;

              return (
                <motion.button
                  key={a.key}
                  initial={
                    REDUCED_MOTION
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.3, x: orbCenterX - NODE_SIZE / 2, y: orbCenterY - NODE_SIZE / 2 }
                  }
                  animate={
                    REDUCED_MOTION
                      ? { opacity: 1 }
                      : { opacity: 1, scale: 1, x: tx, y: ty }
                  }
                  exit={
                    REDUCED_MOTION
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.3, x: orbCenterX - NODE_SIZE / 2, y: orbCenterY - NODE_SIZE / 2 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 26,
                    delay: REDUCED_MOTION ? 0 : i * 0.04,
                  }}
                  onClick={() => handleAction(a)}
                  className="fixed flex flex-col items-center justify-center pointer-events-auto
                    active:scale-90 transition-transform duration-150 group"
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    left: REDUCED_MOTION ? tx : undefined,
                    top: REDUCED_MOTION ? ty : undefined,
                  }}
                  aria-label={a.label}
                >
                  {/* Node glow */}
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: a.key === "update"
                        ? "radial-gradient(circle, hsl(180 70% 55% / 0.25), transparent 70%)"
                        : a.key === "signals"
                        ? "radial-gradient(circle, hsl(45 90% 60% / 0.3), transparent 70%)"
                        : "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)",
                      filter: "blur(6px)",
                    }}
                  />
                  {/* Node body */}
                  <span
                    className="relative w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: a.key === "update"
                        ? "hsl(180 25% 15% / 0.95)"
                        : a.key === "signals"
                        ? "hsl(45 30% 15% / 0.95)"
                        : "hsl(var(--card) / 0.92)",
                      border: a.key === "update"
                        ? "1px solid hsl(180 60% 50% / 0.4)"
                        : a.key === "signals"
                        ? "1px solid hsl(45 80% 55% / 0.4)"
                        : "1px solid hsl(var(--primary) / 0.25)",
                      backdropFilter: "blur(12px)",
                      boxShadow: a.key === "signals"
                        ? "0 2px 16px hsl(45 90% 60% / 0.2), inset 0 0 8px hsl(45 90% 60% / 0.1)"
                        : "0 2px 12px hsl(var(--primary) / 0.1), inset 0 0 8px hsl(var(--primary) / 0.05)",
                    }}
                  >
                    <span className="text-base">{a.emoji}</span>
                  </span>
                  {/* Label — always visible but subtle */}
                  <span
                    className="absolute text-[8px] font-serif tracking-wide whitespace-nowrap
                      text-muted-foreground/60 group-hover:text-primary/80 transition-colors duration-200"
                    style={{
                      top: NODE_SIZE + 2,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    {a.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
