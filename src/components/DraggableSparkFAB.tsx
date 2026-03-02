/**
 * DraggableSparkFAB — stable draggable FAB for Council Spark.
 *
 * STABILITY RULES (v4):
 * - No framer-motion gestures on FAB
 * - No window.resize listener (orientation-only)
 * - FAB frozen while dialog open (no position updates, pointer-events: none)
 * - RAF-throttled drag moves
 * - preventDefault deferred until drag threshold exceeded
 * - e.currentTarget for pointer capture (no conflicts)
 * - BugReportDialog lazy-mounted only after first open
 */
import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { Z } from "@/lib/z-index";
import { SPARK_FLAGS } from "@/lib/spark-flags";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";

const BugReportDialog = lazy(() => import("@/components/BugReportDialog"));

const STORAGE_KEY = "s33d-spark-fab-pos";
const EDGE_PAD = 12;
const FAB_SIZE = 48;
const DRAG_THRESHOLD = 8;
const TAP_DEBOUNCE_MS = 800;

interface StoredPos {
  y: number;
  edge: "left" | "right";
}

function loadPos(): StoredPos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as StoredPos;
      if (typeof p.y === "number" && (p.edge === "left" || p.edge === "right")) return p;
    }
  } catch { /* ignore */ }
  return { y: Math.round(window.innerHeight * 0.72), edge: "right" };
}

function savePos(p: StoredPos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function posToXY(p: StoredPos): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = p.edge === "right" ? vw - FAB_SIZE - EDGE_PAD : EDGE_PAD;
  const maxY = vh - FAB_SIZE - EDGE_PAD - 80;
  const minY = EDGE_PAD + 56;
  const y = Math.max(minY, Math.min(maxY, p.y));
  return { x, y };
}

const DraggableSparkFAB = () => {
  const allowed = usePopupGate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEverOpened, setDialogEverOpened] = useState(false);
  const [pos, setPos] = useState<StoredPos>(loadPos);
  const [xy, setXY] = useState(() => posToXY(pos));

  const isDragging = useRef(false);
  const dragConfirmed = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const totalMoved = useRef(0);
  const debounceRef = useRef(false);
  const xyRef = useRef(xy);
  const posRef = useRef(pos);
  const dialogOpenRef = useRef(false);
  const rafId = useRef(0);

  xyRef.current = xy;
  posRef.current = pos;
  dialogOpenRef.current = dialogOpen;

  // Orientation-only: reposition on device rotation, never on resize
  useEffect(() => {
    const onOrientation = () => {
      if (dialogOpenRef.current) return;
      // Small delay for orientation to settle
      setTimeout(() => {
        if (!dialogOpenRef.current) {
          setXY(posToXY(posRef.current));
        }
      }, 150);
    };
    window.addEventListener("orientationchange", onOrientation);
    return () => window.removeEventListener("orientationchange", onOrientation);
  }, []);

  const snapToEdge = useCallback((cx: number, cy: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge: "left" | "right" = cx + FAB_SIZE / 2 < vw / 2 ? "left" : "right";
    const maxY = vh - FAB_SIZE - EDGE_PAD - 80;
    const minY = EDGE_PAD + 56;
    const clampedY = Math.max(minY, Math.min(maxY, cy));
    const newPos: StoredPos = { y: clampedY, edge };
    setPos(newPos);
    setXY(posToXY(newPos));
    savePos(newPos);
  }, []);

  const handleTap = useCallback(() => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    const t0 = performance.now();
    console.info("[Spark] bug_icon_tap", { route: window.location.pathname, ts: t0 });

    try {
      setDialogEverOpened(true);
      setDialogOpen(true);
      console.info("[Spark] bug_icon_nav_success", { elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      console.error("[Spark] bug_icon_nav_fail", err);
    }

    setTimeout(() => { debounceRef.current = false; }, TAP_DEBOUNCE_MS);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (dialogOpenRef.current) return;
    try {
      isDragging.current = true;
      dragConfirmed.current = false;
      totalMoved.current = 0;
      dragStart.current = { px: e.clientX, py: e.clientY, ox: xyRef.current.x, oy: xyRef.current.y };
      // Use currentTarget to avoid pointer capture conflicts
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      // Do NOT preventDefault here — defer until drag threshold exceeded
      e.stopPropagation();
    } catch (err) {
      console.warn("[Spark] pointerDown error", err);
      isDragging.current = false;
    }
  }, []);

  // RAF-throttled drag updates
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const cx = e.clientX;
    const cy = e.clientY;
    totalMoved.current = Math.abs(cx - dragStart.current.px) + Math.abs(cy - dragStart.current.py);

    // Only confirm drag intent after threshold exceeded
    if (!dragConfirmed.current && totalMoved.current >= DRAG_THRESHOLD) {
      dragConfirmed.current = true;
    }

    if (dragConfirmed.current) {
      e.preventDefault();
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const nx = dragStart.current.ox + (cx - dragStart.current.px);
        const ny = dragStart.current.oy + (cy - dragStart.current.py);
        setXY({ x: nx, y: ny });
      });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    cancelAnimationFrame(rafId.current);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}

    try {
      if (totalMoved.current < DRAG_THRESHOLD) {
        handleTap();
      } else {
        snapToEdge(xyRef.current.x, xyRef.current.y);
      }
    } catch (err) {
      console.error("[Spark] pointerUp error", err);
    }
  }, [snapToEdge, handleTap]);

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
  }, []);

  if (!allowed || !SPARK_FLAGS.SPARK_LITE_DEFAULT_ON) return null;

  return (
    <>
      <button
        className="fixed flex items-center justify-center rounded-full shadow-lg touch-none select-none md:hidden
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          left: xy.x,
          top: xy.y,
          zIndex: Z.FLOATING,
          background: "hsl(var(--card) / 0.92)",
          color: "hsl(var(--primary))",
          border: "1px solid hsl(var(--border) / 0.4)",
          backdropFilter: "blur(12px)",
          cursor: dialogOpen ? "default" : "grab",
          pointerEvents: dialogOpen ? "none" : "auto",
          transition: isDragging.current ? "none" : "transform 0.15s ease",
          transform: "scale(1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Spark: report a bug or suggest an improvement"
        tabIndex={0}
      >
        <CouncilSparkIcon className="w-5 h-5 pointer-events-none" />
        <span
          className="absolute inset-0 rounded-full animate-pulse opacity-10 pointer-events-none"
          style={{ boxShadow: "0 0 12px 3px hsl(var(--primary) / 0.25)" }}
        />
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
        </span>
      </button>

      {dialogEverOpened && (
        <SparkErrorBoundary fallbackMessage="Spark couldn't open — please try again.">
          <Suspense fallback={null}>
            <BugReportDialog open={dialogOpen} onOpenChange={handleDialogChange} />
          </Suspense>
        </SparkErrorBoundary>
      )}
    </>
  );
};

export default DraggableSparkFAB;
