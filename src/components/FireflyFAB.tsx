/**
 * FireflyFAB — stable movable floating action button.
 *
 * STABILITY RULES (inherited from DraggableSparkFAB v4):
 * - No framer-motion gestures on FAB
 * - No window.resize listener (orientation-only)
 * - FAB frozen while dialog open (no position updates, pointer-events: none)
 * - RAF-throttled drag moves
 * - preventDefault deferred until drag threshold exceeded
 * - e.currentTarget for pointer capture (no conflicts)
 * - BugReportDialog lazy-mounted only after first open
 */
import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { Z } from "@/lib/z-index";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";
import FireflyPanel from "@/components/FireflyPanel";

const BugReportDialog = lazy(() => import("@/components/BugReportDialog"));

const STORAGE_KEY = "s33d-firefly-fab-pos";
const EDGE_PAD = 12;
const FAB_SIZE = 44;
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

const FireflyFAB = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEverOpened, setDialogEverOpened] = useState(false);
  const [preselectedType, setPreselectedType] = useState("bug");
  const [pos, setPos] = useState<StoredPos>(loadPos);
  const [xy, setXY] = useState(() => posToXY(pos));

  const isDragging = useRef(false);
  const dragConfirmed = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const totalMoved = useRef(0);
  const debounceRef = useRef(false);
  const xyRef = useRef(xy);
  const posRef = useRef(pos);
  const anyOpenRef = useRef(false);
  const rafId = useRef(0);

  xyRef.current = xy;
  posRef.current = pos;
  anyOpenRef.current = panelOpen || dialogOpen;

  // Orientation-only: reposition on device rotation
  useEffect(() => {
    const onOrientation = () => {
      if (anyOpenRef.current) return;
      setTimeout(() => {
        if (!anyOpenRef.current) setXY(posToXY(posRef.current));
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
    // snap silently
  }, []);

  const handleTap = useCallback(() => {
    if (debounceRef.current) return;
    debounceRef.current = true;
    // open panel
    setPanelOpen(true);
    setTimeout(() => { debounceRef.current = false; }, TAP_DEBOUNCE_MS);
  }, []);

  // onClick fallback for accessibility and automation (keyboard Enter, assistive tech)
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Skip if drag just happened
    if (dragConfirmed.current) return;
    handleTap();
  }, [handleTap]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (anyOpenRef.current) return;
    try {
      isDragging.current = true;
      dragConfirmed.current = false;
      totalMoved.current = 0;
      dragStart.current = { px: e.clientX, py: e.clientY, ox: xyRef.current.x, oy: xyRef.current.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.stopPropagation();
    } catch (err) {
      // pointerDown error — ignore
      isDragging.current = false;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const cx = e.clientX;
    const cy = e.clientY;
    totalMoved.current = Math.abs(cx - dragStart.current.px) + Math.abs(cy - dragStart.current.py);

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
      // pointerUp error — ignore
    }
  }, [snapToEdge, handleTap]);

  const handleSelectAction = useCallback((type: string) => {
    // action selected
    setPreselectedType(type);
    setDialogEverOpened(true);
    setDialogOpen(true);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
  }, []);

  // FAB is always visible — not gated by usePopupGate

  const anyOpen = panelOpen || dialogOpen;

  return (
    <>
      {/* Firefly orb */}
      <button
        className="fixed flex items-center justify-center rounded-full touch-none select-none
          glow-button glow-breath
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          left: xy.x,
          top: xy.y,
          zIndex: Z.FLOATING,
          background: "radial-gradient(circle at 40% 35%, hsl(48 90% 65% / 0.9), hsl(38 80% 45% / 0.85))",
          cursor: anyOpen ? "default" : "grab",
          pointerEvents: anyOpen ? "none" : "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        aria-label="Firefly: report a bug, suggest improvements, or share insights"
        tabIndex={0}
      >
        {/* Firefly inner glow */}
        <span
          className="absolute inset-1 rounded-full"
          style={{
            background: "radial-gradient(circle at 45% 40%, hsl(50 95% 80% / 0.7), transparent 70%)",
          }}
        />
        {/* Spark symbol */}
        <span className="relative text-sm" style={{ filter: "drop-shadow(0 0 3px hsl(45 90% 75% / 0.6))" }}>
          ✦
        </span>
        {/* Breathing pulse — arterial rhythm, pauses when dialog open */}
        <span
          className={`absolute inset-0 rounded-full pointer-events-none ${anyOpen ? '' : 'pulse-cta'}`}
          style={{
            boxShadow: "0 0 16px 5px hsl(45 90% 60% / 0.2)",
          }}
        />
      </button>

      {/* Lightweight panel */}
      <FireflyPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSelectAction={handleSelectAction}
      />

      {/* Heavy dialog — lazy, only after first action selected */}
      {dialogEverOpened && (
        <SparkErrorBoundary fallbackMessage="Firefly couldn't open the form — please try again.">
          <Suspense fallback={null}>
            <BugReportDialog
              open={dialogOpen}
              onOpenChange={handleDialogChange}
              initialReportType={preselectedType}
            />
          </Suspense>
        </SparkErrorBoundary>
      )}
    </>
  );
};

export default FireflyFAB;
