/**
 * DraggableSparkFAB — a draggable floating action button for Council Spark.
 *
 * CRASH-PROOF ARCHITECTURE (v2):
 * - No framer-motion whileTap/whileHover (conflicts with pointer capture on mobile)
 * - Dialog lazy-mounted only when opened
 * - Safe click guard with 800ms debounce
 * - All pointer handlers wrapped in try/catch
 * - Global error hooks for crash capture
 */
import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { Z } from "@/lib/z-index";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";

// Lazy-load the heavy dialog — never mount until needed
const BugReportDialog = lazy(() => import("@/components/BugReportDialog"));

const STORAGE_KEY = "s33d-spark-fab-pos";
const EDGE_PAD = 12;
const FAB_SIZE = 48;
const DRAG_THRESHOLD = 8;
const TAP_DEBOUNCE_MS = 800;

interface StoredPos {
  yRatio: number;
  edge: "left" | "right";
}

function loadPos(): StoredPos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as StoredPos;
      if (p.yRatio >= 0 && p.yRatio <= 1 && (p.edge === "left" || p.edge === "right")) return p;
    }
  } catch { /* ignore */ }
  return { yRatio: 0.72, edge: "right" };
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
  const y = Math.max(minY, Math.min(maxY, p.yRatio * vh));
  return { x, y };
}

const DraggableSparkFAB = () => {
  const allowed = usePopupGate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEverOpened, setDialogEverOpened] = useState(false);
  const [pos, setPos] = useState<StoredPos>(loadPos);
  const [xy, setXY] = useState(() => posToXY(pos));
  const isDragging = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const totalMoved = useRef(0);
  const debounceRef = useRef(false);
  const xyRef = useRef(xy);
  xyRef.current = xy;

  // Recalculate on resize
  useEffect(() => {
    const onResize = () => setXY(posToXY(pos));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  const snapToEdge = useCallback((cx: number, cy: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge: "left" | "right" = cx + FAB_SIZE / 2 < vw / 2 ? "left" : "right";
    const maxY = vh - FAB_SIZE - EDGE_PAD - 80;
    const minY = EDGE_PAD + 56;
    const clampedY = Math.max(minY, Math.min(maxY, cy));
    const yRatio = clampedY / vh;
    const newPos: StoredPos = { yRatio, edge };
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
    try {
      isDragging.current = true;
      totalMoved.current = 0;
      dragStart.current = { px: e.clientX, py: e.clientY, ox: xyRef.current.x, oy: xyRef.current.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      console.warn("[Spark] pointerDown error", err);
      isDragging.current = false;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    try {
      const dx = e.clientX - dragStart.current.px;
      const dy = e.clientY - dragStart.current.py;
      totalMoved.current = Math.abs(dx) + Math.abs(dy);
      const nx = dragStart.current.ox + dx;
      const ny = dragStart.current.oy + dy;
      setXY({ x: nx, y: ny });
    } catch { /* swallow */ }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}

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

  if (!allowed) return null;

  return (
    <>
      {/* FAB button — pure CSS, no framer-motion gestures to avoid pointer capture conflicts */}
      <button
        className="fixed flex items-center justify-center rounded-full shadow-lg touch-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform active:scale-95 hover:scale-105"
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
          cursor: isDragging.current ? "grabbing" : "grab",
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

      {/* Dialog — only mount after first open to avoid loading heavy component tree */}
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
