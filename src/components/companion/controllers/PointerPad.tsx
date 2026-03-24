import { useRef, useCallback, useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import type { CompanionCommand } from "@/lib/companion-types";

/**
 * Trackpad-style touch surface for companion controller.
 *
 * - 1 finger drag → pointer_delta (relative movement like a laptop trackpad)
 * - 1 finger tap → pointer_click
 * - 2 finger drag → scroll
 * - touch-action: none + non-passive listeners to prevent page scroll
 */

interface PointerPadProps {
  send: (cmd: CompanionCommand) => void;
  /** Optional: show debug info */
  debug?: boolean;
}

/** Dead zone in px — ignore micro-jitter */
const DEAD_ZONE = 2;
/** Sensitivity multiplier for pointer movement */
const POINTER_SENSITIVITY = 1.8;
/** Sensitivity multiplier for scroll */
const SCROLL_SENSITIVITY = 1.2;
/** Max ms between touchstart and touchend to count as a tap */
const TAP_MAX_MS = 200;
/** Max px movement to still count as a tap */
const TAP_MAX_DISTANCE = 10;

interface DebugInfo {
  mode: "idle" | "pointer" | "scroll" | "tap";
  lastDx: number;
  lastDy: number;
  touches: number;
}

export default function PointerPad({ send, debug = false }: PointerPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTwoTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const movedRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    mode: "idle", lastDx: 0, lastDy: 0, touches: 0,
  });

  // Use non-passive event listeners via useEffect to allow preventDefault
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;

      if (e.touches.length === 1) {
        const t = e.touches[0];
        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        lastTwoTouchRef.current = null;
        if (debug) setDebugInfo(d => ({ ...d, mode: "pointer", touches: 1 }));
      } else if (e.touches.length === 2) {
        // Switch to scroll mode
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        lastTwoTouchRef.current = { x: midX, y: midY };
        lastTouchRef.current = null;
        touchStartRef.current = null; // cancel tap
        if (debug) setDebugInfo(d => ({ ...d, mode: "scroll", touches: 2 }));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.touches.length === 1 && lastTouchRef.current) {
        // One-finger drag → pointer delta
        const t = e.touches[0];
        const rawDx = t.clientX - lastTouchRef.current.x;
        const rawDy = t.clientY - lastTouchRef.current.y;

        // Dead zone check
        if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;

        movedRef.current = true;
        const dx = rawDx * POINTER_SENSITIVITY;
        const dy = rawDy * POINTER_SENSITIVITY;

        send({ type: "pointer_delta", dx, dy });
        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };

        if (debug) setDebugInfo(d => ({ ...d, lastDx: Math.round(dx), lastDy: Math.round(dy) }));

      } else if (e.touches.length === 2 && lastTwoTouchRef.current) {
        // Two-finger drag → scroll
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const rawDx = midX - lastTwoTouchRef.current.x;
        const rawDy = midY - lastTwoTouchRef.current.y;

        if (Math.abs(rawDx) < DEAD_ZONE && Math.abs(rawDy) < DEAD_ZONE) return;

        movedRef.current = true;
        const dx = rawDx * SCROLL_SENSITIVITY;
        const dy = rawDy * SCROLL_SENSITIVITY;

        send({ type: "scroll", dx, dy });
        lastTwoTouchRef.current = { x: midX, y: midY };

        if (debug) setDebugInfo(d => ({ ...d, lastDx: Math.round(dx), lastDy: Math.round(dy) }));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Detect tap: short duration, minimal movement, single finger
      if (
        touchStartRef.current &&
        !movedRef.current &&
        e.touches.length === 0
      ) {
        const elapsed = Date.now() - touchStartRef.current.time;
        if (elapsed < TAP_MAX_MS) {
          // Send click at the pad-relative position (normalised 0-1)
          const rect = pad.getBoundingClientRect();
          const nx = (touchStartRef.current.x - rect.left) / rect.width;
          const ny = (touchStartRef.current.y - rect.top) / rect.height;
          send({ type: "pointer_click", x: nx, y: ny });
          if (debug) setDebugInfo(d => ({ ...d, mode: "tap" }));
        }
      }

      // Reset when all fingers lifted
      if (e.touches.length === 0) {
        lastTouchRef.current = null;
        lastTwoTouchRef.current = null;
        touchStartRef.current = null;
        movedRef.current = false;
        send({ type: "pointer_hide" });
        if (debug) setDebugInfo(d => ({ ...d, mode: "idle", touches: 0 }));
      } else if (e.touches.length === 1) {
        // Went from 2 fingers to 1: reset to pointer mode
        const t = e.touches[0];
        lastTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        lastTwoTouchRef.current = null;
        if (debug) setDebugInfo(d => ({ ...d, mode: "pointer", touches: 1 }));
      }
    };

    // CRITICAL: { passive: false } so preventDefault() works on iOS Safari
    pad.addEventListener("touchstart", onTouchStart, { passive: false });
    pad.addEventListener("touchmove", onTouchMove, { passive: false });
    pad.addEventListener("touchend", onTouchEnd, { passive: false });
    pad.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      pad.removeEventListener("touchstart", onTouchStart);
      pad.removeEventListener("touchmove", onTouchMove);
      pad.removeEventListener("touchend", onTouchEnd);
      pad.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [send, debug]);

  // Mouse fallback for desktop testing
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1 || !lastMouseRef.current) return;
      const dx = (e.clientX - lastMouseRef.current.x) * POINTER_SENSITIVITY;
      const dy = (e.clientY - lastMouseRef.current.y) * POINTER_SENSITIVITY;
      if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
      send({ type: "pointer_delta", dx, dy });
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [send],
  );

  const handleMouseUp = useCallback(() => {
    lastMouseRef.current = null;
    send({ type: "pointer_hide" });
  }, [send]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-serif">
        <Crosshair className="w-3 h-3" />
        <span>Trackpad</span>
        <span className="text-muted-foreground/40 ml-1">1-finger: move · 2-finger: scroll · tap: click</span>
      </div>
      <div
        ref={padRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full aspect-video rounded-xl border border-border/40 bg-secondary/20
          cursor-crosshair relative overflow-hidden select-none"
        style={{ touchAction: "none" }}
      >
        {/* Grid hint */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "25% 25%",
          }}
        />
        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Crosshair className="w-5 h-5 text-muted-foreground/20" />
        </div>
      </div>

      {/* Debug overlay */}
      {debug && (
        <div className="w-full text-[9px] font-mono text-muted-foreground/60 flex gap-3 justify-center mt-0.5">
          <span>mode: {debugInfo.mode}</span>
          <span>touches: {debugInfo.touches}</span>
          <span>Δ: {debugInfo.lastDx},{debugInfo.lastDy}</span>
        </div>
      )}
    </div>
  );
}
