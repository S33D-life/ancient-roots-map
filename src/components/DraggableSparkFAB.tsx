/**
 * DraggableSparkFAB — a draggable floating action button for Council Spark.
 * 
 * - Tap → opens Spark dialog
 * - Drag → repositions; snaps to nearest edge on release
 * - Position persisted in localStorage
 * - Respects usePopupGate() suppression
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { Z } from "@/lib/z-index";
import BugReportDialog from "@/components/BugReportDialog";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";

const STORAGE_KEY = "s33d-spark-fab-pos";
const EDGE_PAD = 12;
const FAB_SIZE = 48;
const DRAG_THRESHOLD = 8; // px movement before counting as drag

interface StoredPos {
  /** 0-1 ratio from top */
  yRatio: number;
  /** "left" | "right" */
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
  // Default: bottom-right
  return { yRatio: 0.72, edge: "right" };
}

function savePos(p: StoredPos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function posToXY(p: StoredPos): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = p.edge === "right" ? vw - FAB_SIZE - EDGE_PAD : EDGE_PAD;
  const maxY = vh - FAB_SIZE - EDGE_PAD - 80; // 80 = room above bottom nav
  const minY = EDGE_PAD + 56; // below header
  const y = Math.max(minY, Math.min(maxY, p.yRatio * vh));
  return { x, y };
}

const DraggableSparkFAB = () => {
  const allowed = usePopupGate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pos, setPos] = useState<StoredPos>(loadPos);
  const [xy, setXY] = useState(() => posToXY(pos));
  const isDragging = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const totalMoved = useRef(0);
  const debounceRef = useRef(false);

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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    totalMoved.current = 0;
    dragStart.current = { px: e.clientX, py: e.clientY, ox: xy.x, oy: xy.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [xy]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    totalMoved.current = Math.abs(dx) + Math.abs(dy);
    const nx = dragStart.current.ox + dx;
    const ny = dragStart.current.oy + dy;
    setXY({ x: nx, y: ny });
  }, []);

  // Track latest xy for snap without re-creating handler
  const xyRef = useRef(xy);
  xyRef.current = xy;

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}

    if (totalMoved.current < DRAG_THRESHOLD) {
      // It was a tap
      if (debounceRef.current) return;
      debounceRef.current = true;
      console.info("[Spark] spark_open_attempt", { route: window.location.pathname });
      setDialogOpen(true);
      setTimeout(() => { debounceRef.current = false; }, 800);
    } else {
      // It was a drag — snap to edge
      snapToEdge(xyRef.current.x, xyRef.current.y);
    }
  }, [snapToEdge]);

  if (!allowed) return null;

  return (
    <>
      <motion.button
        className="fixed flex items-center justify-center rounded-full shadow-lg touch-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <CouncilSparkIcon className="w-5 h-5 pointer-events-none" />
        {/* Subtle glow affordance */}
        <span
          className="absolute inset-0 rounded-full animate-pulse opacity-10 pointer-events-none"
          style={{ boxShadow: "0 0 12px 3px hsl(var(--primary) / 0.25)" }}
        />
        {/* Drag grip dots */}
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
          <span className="w-1 h-1 rounded-full bg-current opacity-20" />
        </span>
      </motion.button>

      <SparkErrorBoundary fallbackMessage="Spark couldn't open — please try again.">
        <BugReportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </SparkErrorBoundary>
    </>
  );
};

export default DraggableSparkFAB;
