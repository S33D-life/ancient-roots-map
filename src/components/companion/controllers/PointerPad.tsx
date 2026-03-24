import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Move, ScrollText, GripVertical, Map, MousePointerClick } from "lucide-react";
import type { CompanionCommand, CompanionMode, CompanionSettings } from "@/lib/companion-types";
import { hapticClick, hapticDragStart, hapticTap } from "@/lib/haptics";

/**
 * Multi-mode gesture surface for companion controller.
 *
 * Trackpad: 1-finger = pointer delta, tap = click, 2-finger = scroll (or map_pan in map mode)
 * Pointer:  1-finger = pointer (higher sensitivity), edge = slow map pan in map mode
 * Scroll:   1-finger vertical = scroll (or map zoom in map mode), horizontal = pan
 *
 * Bottom click strip: always visible, tapping it sends a click at current pointer position.
 */

interface PointerPadProps {
  send: (cmd: CompanionCommand) => void;
  mode: CompanionMode;
  settings: CompanionSettings;
  dragging: boolean;
  isMapMode?: boolean;
  debug?: boolean;
}

const DEAD_ZONE = 2;
const TAP_MAX_MS = 300;
const TAP_MAX_DIST = 8;
const LONG_PRESS_MS = 400;
/** Edge zone (0-1 normalised) for pointer-mode edge-panning */
const EDGE_ZONE = 0.12;
const EDGE_PAN_SPEED = 3;

interface DebugInfo {
  gesture: string;
  touches: number;
  dx: number;
  dy: number;
}

const MODE_HINTS: Record<CompanionMode, { default: string; map: string }> = {
  trackpad: {
    default: "drag: move · tap: click · 2-finger: scroll",
    map: "drag: pointer · 2-finger: pan map · tap: select tree",
  },
  pointer: {
    default: "guide the pointer across the desktop",
    map: "hover trees · tap to select · edges pan map",
  },
  scroll: {
    default: "drag to scroll the desktop view",
    map: "vertical: zoom map · horizontal: pan",
  },
};

const MODE_ICONS: Record<CompanionMode, typeof Crosshair> = {
  trackpad: Crosshair,
  pointer: Move,
  scroll: ScrollText,
};

export default function PointerPad({ send, mode, settings, dragging, isMapMode = false, debug = false }: PointerPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTwoTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const movedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const edgePanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({ gesture: "idle", touches: 0, dx: 0, dy: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const [clickFlash, setClickFlash] = useState(false);

  const scrollDir = settings.naturalScroll ? 1 : -1;

  const doClick = useCallback(() => {
    send({ type: "pointer_click", x: 0, y: 0 });
    hapticClick();
    setClickFlash(true);
    setTimeout(() => setClickFlash(false), 200);
    if (debug) setDebugInfo(d => ({ ...d, gesture: "click" }));
  }, [send, debug]);

  // Edge-pan: when in pointer+map mode, if pointer is near pad edge, continuously pan
  const startEdgePan = useCallback((nx: number, ny: number) => {
    if (!isMapMode || mode !== "pointer") return;
    if (edgePanTimerRef.current) clearInterval(edgePanTimerRef.current);

    const getPanDelta = () => {
      let dx = 0, dy = 0;
      if (nx < EDGE_ZONE) dx = EDGE_PAN_SPEED * (EDGE_ZONE - nx) / EDGE_ZONE;
      else if (nx > 1 - EDGE_ZONE) dx = -EDGE_PAN_SPEED * (nx - (1 - EDGE_ZONE)) / EDGE_ZONE;
      if (ny < EDGE_ZONE) dy = EDGE_PAN_SPEED * (EDGE_ZONE - ny) / EDGE_ZONE;
      else if (ny > 1 - EDGE_ZONE) dy = -EDGE_PAN_SPEED * (ny - (1 - EDGE_ZONE)) / EDGE_ZONE;
      return { dx, dy };
    };

    const { dx, dy } = getPanDelta();
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      edgePanTimerRef.current = setInterval(() => {
        const d = getPanDelta();
        if (Math.abs(d.dx) > 0.1 || Math.abs(d.dy) > 0.1) {
          send({ type: "map_pan", dx: d.dx * 15, dy: d.dy * 15 });
        }
      }, 50);
    }
  }, [isMapMode, mode, send]);

  const stopEdgePan = useCallback(() => {
    if (edgePanTimerRef.current) {
      clearInterval(edgePanTimerRef.current);
      edgePanTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
      isLongPressRef.current = false;
      setTouchActive(true);

      if (e.touches.length === 1) {
        const t = e.touches[0];
        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        lastTwoTouchRef.current = null;

        if (mode !== "scroll" && !dragging) {
          longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            hapticDragStart();
            send({ type: "drag_start" });
            if (debug) setDebugInfo(d => ({ ...d, gesture: "drag" }));
          }, LONG_PRESS_MS);
        }

        if (debug) setDebugInfo(d => ({ ...d, gesture: mode === "scroll" ? "scroll" : "pointer", touches: 1 }));
      } else if (e.touches.length === 2) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        lastTwoTouchRef.current = { x: midX, y: midY };
        lastTouchRef.current = null;
        touchStartRef.current = null;
        if (debug) setDebugInfo(d => ({ ...d, gesture: isMapMode ? "map-pan" : "scroll-2f", touches: 2 }));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel long-press if finger moves beyond threshold
      if (longPressTimerRef.current && touchStartRef.current) {
        const t = e.touches[0];
        if (t) {
          const dist = Math.hypot(t.clientX - touchStartRef.current.x, t.clientY - touchStartRef.current.y);
          if (dist > TAP_MAX_DIST) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }

      if (e.touches.length === 1 && lastTouchRef.current) {
        const t = e.touches[0];
        const rawDx = t.clientX - lastTouchRef.current.x;
        const rawDy = t.clientY - lastTouchRef.current.y;
        if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;

        // Check total distance from start to decide if this is a move vs tap
        if (touchStartRef.current) {
          const totalDist = Math.hypot(t.clientX - touchStartRef.current.x, t.clientY - touchStartRef.current.y);
          if (totalDist > TAP_MAX_DIST) movedRef.current = true;
        }

        if (mode === "scroll") {
          if (isMapMode) {
            if (Math.abs(rawDy) > Math.abs(rawDx) * 1.5) {
              const zoomDelta = -rawDy * settings.scrollSensitivity * scrollDir * 0.02;
              send({ type: "map_zoom", delta: zoomDelta });
            } else {
              send({ type: "map_pan", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
            }
          } else {
            send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
          }
        } else if (dragging || isLongPressRef.current) {
          send({ type: "drag_move", dx: rawDx * settings.pointerSensitivity, dy: rawDy * settings.pointerSensitivity });
        } else {
          const sens = mode === "pointer" ? settings.pointerSensitivity * 1.4 : settings.pointerSensitivity;
          send({ type: "pointer_delta", dx: rawDx * sens, dy: rawDy * sens });

          if (isMapMode && mode === "pointer") {
            const rect = pad.getBoundingClientRect();
            const nx = (t.clientX - rect.left) / rect.width;
            const ny = (t.clientY - rect.top) / rect.height;
            startEdgePan(nx, ny);
          }
        }

        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        if (debug) setDebugInfo(d => ({ ...d, dx: Math.round(rawDx), dy: Math.round(rawDy) }));

      } else if (e.touches.length === 2 && lastTwoTouchRef.current) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rawDx = midX - lastTwoTouchRef.current.x;
        const rawDy = midY - lastTwoTouchRef.current.y;
        if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;
        movedRef.current = true;

        if (isMapMode) {
          send({ type: "map_pan", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
        } else {
          send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
        }

        lastTwoTouchRef.current = { x: midX, y: midY };
        if (debug) setDebugInfo(d => ({ ...d, dx: Math.round(rawDx), dy: Math.round(rawDy) }));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopEdgePan();

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isLongPressRef.current) {
        send({ type: "drag_end" });
        isLongPressRef.current = false;
      }

      // Tap detection — click at current pointer position (not finger position)
      if (touchStartRef.current && !movedRef.current && e.touches.length === 0 && mode !== "scroll") {
        const elapsed = Date.now() - touchStartRef.current.time;
        if (elapsed < TAP_MAX_MS) {
          doClick();
        }
      }

      if (e.touches.length === 0) {
        lastTouchRef.current = null;
        lastTwoTouchRef.current = null;
        touchStartRef.current = null;
        movedRef.current = false;
        setTouchActive(false);
        if (mode !== "scroll") send({ type: "pointer_hide" });
        if (debug) setDebugInfo(d => ({ ...d, gesture: "idle", touches: 0 }));
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        lastTwoTouchRef.current = null;
        if (debug) setDebugInfo(d => ({ ...d, touches: 1 }));
      }
    };

    pad.addEventListener("touchstart", onTouchStart, { passive: false });
    pad.addEventListener("touchmove", onTouchMove, { passive: false });
    pad.addEventListener("touchend", onTouchEnd, { passive: false });
    pad.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      pad.removeEventListener("touchstart", onTouchStart);
      pad.removeEventListener("touchmove", onTouchMove);
      pad.removeEventListener("touchend", onTouchEnd);
      pad.removeEventListener("touchcancel", onTouchEnd);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      stopEdgePan();
    };
  }, [send, mode, settings, dragging, isMapMode, debug, scrollDir, startEdgePan, stopEdgePan, doClick]);

  // Mouse fallback
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setTouchActive(true);
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1 || !lastMouseRef.current) return;
    const rawDx = e.clientX - lastMouseRef.current.x;
    const rawDy = e.clientY - lastMouseRef.current.y;
    if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;
    if (mode === "scroll") {
      if (isMapMode) {
        send({ type: "map_pan", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
      } else {
        send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
      }
    } else {
      send({ type: "pointer_delta", dx: rawDx * settings.pointerSensitivity, dy: rawDy * settings.pointerSensitivity });
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [send, mode, settings, isMapMode, scrollDir]);
  const handleMouseUp = useCallback(() => {
    lastMouseRef.current = null;
    setTouchActive(false);
    send({ type: "pointer_hide" });
  }, [send]);

  const CenterIcon = isMapMode ? Map : MODE_ICONS[mode];
  const hints = MODE_HINTS[mode];

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Gesture surface */}
      <div
        ref={padRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full rounded-t-2xl border border-b-0 relative overflow-hidden select-none transition-all duration-300"
        style={{
          touchAction: "none",
          aspectRatio: "16/10",
          background: isMapMode
            ? touchActive
              ? "linear-gradient(160deg, hsl(120 12% 14% / 0.6), hsl(42 20% 12% / 0.3))"
              : "linear-gradient(160deg, hsl(120 10% 12% / 0.4), hsl(30 10% 10% / 0.2))"
            : touchActive
              ? "linear-gradient(160deg, hsl(var(--secondary) / 0.4), hsl(var(--primary) / 0.06))"
              : "linear-gradient(160deg, hsl(var(--secondary) / 0.25), hsl(var(--muted) / 0.1))",
          borderColor: touchActive
            ? isMapMode ? "hsl(120 25% 40% / 0.4)" : "hsl(var(--primary) / 0.3)"
            : dragging
              ? "hsl(42 60% 55% / 0.5)"
              : "hsl(var(--border) / 0.4)",
          boxShadow: touchActive
            ? isMapMode
              ? "inset 0 0 40px hsl(120 20% 30% / 0.06), 0 0 20px hsl(120 20% 30% / 0.08)"
              : "inset 0 0 40px hsl(var(--primary) / 0.04), 0 0 20px hsl(var(--primary) / 0.06)"
            : "inset 0 1px 0 hsl(var(--border) / 0.05)",
          cursor: mode === "scroll" ? "grab" : "crosshair",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: isMapMode ? 0.04 : 0.06,
            backgroundImage: isMapMode
              ? "radial-gradient(circle, hsl(120 30% 50% / 0.4) 1px, transparent 1px)"
              : "radial-gradient(circle, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: touchActive ? 0.12 : 0.03,
            background: isMapMode
              ? "radial-gradient(circle at 50% 50%, hsl(120 25% 40% / 0.3), transparent 70%)"
              : "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.4), transparent 70%)",
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{
              opacity: touchActive ? 0.06 : 0.12,
              scale: touchActive ? 0.85 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <CenterIcon className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Map mode badge */}
        <AnimatePresence>
          {isMapMode && !touchActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[8px] font-serif pointer-events-none"
              style={{ color: "hsl(120 20% 50% / 0.5)" }}
            >
              <Map className="w-2.5 h-2.5" />
              Map
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag indicator */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-serif"
              style={{
                background: "hsl(42 60% 55% / 0.15)",
                border: "1px solid hsl(42 60% 55% / 0.3)",
                color: "hsl(42 60% 55%)",
              }}
            >
              <GripVertical className="w-2.5 h-2.5" />
              Dragging
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Click strip (bottom bar, like a real trackpad click zone) ── */}
      {mode !== "scroll" && (
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            hapticTap();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            doClick();
          }}
          onClick={(e) => {
            e.preventDefault();
            doClick();
          }}
          className="w-full rounded-b-2xl border relative overflow-hidden select-none transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.99]"
          style={{
            touchAction: "none",
            height: "44px",
            background: clickFlash
              ? isMapMode ? "hsl(120 20% 18% / 0.5)" : "hsl(var(--primary) / 0.1)"
              : isMapMode ? "hsl(120 8% 10% / 0.4)" : "hsl(var(--secondary) / 0.15)",
            borderColor: clickFlash
              ? isMapMode ? "hsl(120 25% 40% / 0.5)" : "hsl(var(--primary) / 0.4)"
              : "hsl(var(--border) / 0.4)",
            borderTop: "1px solid hsl(var(--border) / 0.15)",
          }}
        >
          <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-serif text-muted-foreground/50">Click</span>
        </button>
      )}

      {/* Divider for scroll mode (no click strip) */}
      {mode === "scroll" && (
        <div className="w-full h-px" style={{ background: "hsl(var(--border) / 0.2)" }} />
      )}

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/50 font-serif text-center mt-1.5">
        {isMapMode ? hints.map : hints.default}
      </p>

      {/* Debug */}
      {debug && (
        <div className="w-full text-[9px] font-mono text-muted-foreground/50 flex gap-3 justify-center">
          <span>{debugInfo.gesture}</span>
          <span>t:{debugInfo.touches}</span>
          <span>Δ:{debugInfo.dx},{debugInfo.dy}</span>
          <span>{isMapMode ? "🗺" : ""}</span>
        </div>
      )}
    </div>
  );
}