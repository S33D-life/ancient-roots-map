import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Move, ScrollText, GripVertical } from "lucide-react";
import type { CompanionCommand, CompanionMode, CompanionSettings } from "@/lib/companion-types";
import { hapticClick, hapticDragStart } from "@/lib/haptics";

/**
 * Multi-mode gesture surface for companion controller.
 *
 * Trackpad: 1-finger drag = pointer delta, tap = click, 2-finger = scroll
 * Pointer:  1-finger drag = direct pointer (higher sensitivity)
 * Scroll:   1-finger drag = scroll only
 *
 * All modes support drag via long-press or drag toggle.
 */

interface PointerPadProps {
  send: (cmd: CompanionCommand) => void;
  mode: CompanionMode;
  settings: CompanionSettings;
  dragging: boolean;
  debug?: boolean;
}

const DEAD_ZONE = 2;
const TAP_MAX_MS = 200;
const LONG_PRESS_MS = 400;

interface DebugInfo {
  gesture: string;
  touches: number;
  dx: number;
  dy: number;
}

const MODE_HINTS: Record<CompanionMode, string> = {
  trackpad: "drag: move · 2-finger: scroll · tap: click",
  pointer: "guide the pointer across the desktop",
  scroll: "drag to scroll the desktop view",
};

const MODE_ICONS: Record<CompanionMode, typeof Crosshair> = {
  trackpad: Crosshair,
  pointer: Move,
  scroll: ScrollText,
};

export default function PointerPad({ send, mode, settings, dragging, debug = false }: PointerPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTwoTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const movedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({ gesture: "idle", touches: 0, dx: 0, dy: 0 });
  const [touchActive, setTouchActive] = useState(false);

  const scrollDir = settings.naturalScroll ? 1 : -1;

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

        // Long-press detection for drag (trackpad/pointer modes only)
        if (mode !== "scroll" && !dragging) {
          longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            hapticDragStart();
            send({ type: "drag_start" });
            if (debug) setDebugInfo(d => ({ ...d, gesture: "drag" }));
          }, LONG_PRESS_MS);
        }

        if (debug) setDebugInfo(d => ({ ...d, gesture: mode === "scroll" ? "scroll" : "pointer", touches: 1 }));
      } else if (e.touches.length === 2 && mode === "trackpad") {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        lastTwoTouchRef.current = { x: midX, y: midY };
        lastTouchRef.current = null;
        touchStartRef.current = null;
        if (debug) setDebugInfo(d => ({ ...d, gesture: "scroll-2f", touches: 2 }));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel long-press if finger moves
      if (!movedRef.current && longPressTimerRef.current) {
        const t = e.touches[0];
        if (t && touchStartRef.current) {
          const dist = Math.hypot(t.clientX - touchStartRef.current.x, t.clientY - touchStartRef.current.y);
          if (dist > 6) {
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
        movedRef.current = true;

        if (mode === "scroll") {
          // Scroll mode: 1-finger scrolls
          send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
        } else if (dragging || isLongPressRef.current) {
          // Drag mode
          send({ type: "drag_move", dx: rawDx * settings.pointerSensitivity, dy: rawDy * settings.pointerSensitivity });
        } else {
          // Pointer/trackpad: move cursor
          const sens = mode === "pointer" ? settings.pointerSensitivity * 1.4 : settings.pointerSensitivity;
          send({ type: "pointer_delta", dx: rawDx * sens, dy: rawDy * sens });
        }

        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        if (debug) setDebugInfo(d => ({ ...d, dx: Math.round(rawDx), dy: Math.round(rawDy) }));

      } else if (e.touches.length === 2 && lastTwoTouchRef.current && mode === "trackpad") {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rawDx = midX - lastTwoTouchRef.current.x;
        const rawDy = midY - lastTwoTouchRef.current.y;
        if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;
        movedRef.current = true;
        send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
        lastTwoTouchRef.current = { x: midX, y: midY };
        if (debug) setDebugInfo(d => ({ ...d, dx: Math.round(rawDx), dy: Math.round(rawDy) }));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // End drag if was long-pressing
      if (isLongPressRef.current) {
        send({ type: "drag_end" });
        isLongPressRef.current = false;
      }

      // Tap detection (trackpad & pointer modes)
      if (touchStartRef.current && !movedRef.current && e.touches.length === 0 && mode !== "scroll") {
        const elapsed = Date.now() - touchStartRef.current.time;
        if (elapsed < TAP_MAX_MS) {
          const rect = pad.getBoundingClientRect();
          const nx = (touchStartRef.current.x - rect.left) / rect.width;
          const ny = (touchStartRef.current.y - rect.top) / rect.height;
          send({ type: "pointer_click", x: nx, y: ny });
          hapticClick();
          if (debug) setDebugInfo(d => ({ ...d, gesture: "tap" }));
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
    };
  }, [send, mode, settings, dragging, debug, scrollDir]);

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
      send({ type: "scroll", dx: rawDx * settings.scrollSensitivity * scrollDir, dy: rawDy * settings.scrollSensitivity * scrollDir });
    } else {
      send({ type: "pointer_delta", dx: rawDx * settings.pointerSensitivity, dy: rawDy * settings.pointerSensitivity });
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [send, mode, settings, scrollDir]);
  const handleMouseUp = useCallback(() => {
    lastMouseRef.current = null;
    setTouchActive(false);
    send({ type: "pointer_hide" });
  }, [send]);

  const CenterIcon = MODE_ICONS[mode];

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Gesture surface */}
      <div
        ref={padRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full rounded-2xl border relative overflow-hidden select-none transition-all duration-300"
        style={{
          touchAction: "none",
          aspectRatio: "16/10",
          background: touchActive
            ? "linear-gradient(160deg, hsl(var(--secondary) / 0.4), hsl(var(--primary) / 0.06))"
            : "linear-gradient(160deg, hsl(var(--secondary) / 0.25), hsl(var(--muted) / 0.1))",
          borderColor: touchActive
            ? "hsl(var(--primary) / 0.3)"
            : dragging
              ? "hsl(42 60% 55% / 0.5)"
              : "hsl(var(--border) / 0.4)",
          boxShadow: touchActive
            ? "inset 0 0 40px hsl(var(--primary) / 0.04), 0 0 20px hsl(var(--primary) / 0.06)"
            : "inset 0 1px 0 hsl(var(--border) / 0.05)",
          cursor: mode === "scroll" ? "grab" : "crosshair",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06] transition-opacity duration-300"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Radial glow at center */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: touchActive ? 0.15 : 0.04,
            background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.4), transparent 70%)",
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{
              opacity: touchActive ? 0.08 : 0.15,
              scale: touchActive ? 0.9 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <CenterIcon className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Drag indicator overlay */}
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

      {/* Mode hint */}
      <p className="text-[10px] text-muted-foreground/50 font-serif text-center">
        {MODE_HINTS[mode]}
      </p>

      {/* Debug overlay */}
      {debug && (
        <div className="w-full text-[9px] font-mono text-muted-foreground/50 flex gap-3 justify-center">
          <span>{debugInfo.gesture}</span>
          <span>t:{debugInfo.touches}</span>
          <span>Δ:{debugInfo.dx},{debugInfo.dy}</span>
          <span>sens:{settings.pointerSensitivity.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
