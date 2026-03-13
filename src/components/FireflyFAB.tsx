/**
 * FireflyFAB — TEOTAG's guiding orb.
 *
 * A living, movable floating action button that serves as the wanderer's
 * companion light — sent from TEOTAG's staff to guide, assist, and illuminate.
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
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Z } from "@/lib/z-index";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";
import OrbConstellation from "@/components/OrbConstellation";
import FireflyGuidance from "@/components/FireflyGuidance";
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";

const BugReportDialog = lazy(() => import("@/components/BugReportDialog"));

const STORAGE_KEY = "s33d-firefly-fab-pos";
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
  return { y: Math.round(window.innerHeight * 0.58), edge: "right" };
}

function savePos(p: StoredPos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function posToXY(p: StoredPos): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = p.edge === "right" ? vw - FAB_SIZE - EDGE_PAD : EDGE_PAD;
  const maxY = vh - FAB_SIZE - 56 - 24;
  const minY = EDGE_PAD + 56;
  const y = Math.max(minY, Math.min(maxY, p.y));
  return { x, y };
}

const DOUBLE_TAP_MS = 350;

const FireflyFAB = () => {
  const navigate = useNavigate();
  const { activeLens, lensConfig } = useSeasonalLens();
  const [constellationOpen, setConstellationOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEverOpened, setDialogEverOpened] = useState(false);
  const [preselectedType, setPreselectedType] = useState("bug");
  const [pos, setPos] = useState<StoredPos>(loadPos);
  const [xy, setXY] = useState(() => posToXY(pos));
  const [hovered, setHovered] = useState(false);

  // One-time drag hint
  const DRAG_HINT_KEY = "s33d_orb_drag_hint_seen";
  const [showDragHint, setShowDragHint] = useState(() => {
    try { return !localStorage.getItem(DRAG_HINT_KEY); } catch { return false; }
  });

  useEffect(() => {
    if (!showDragHint) return;
    const timer = setTimeout(() => {
      setShowDragHint(false);
      try { localStorage.setItem(DRAG_HINT_KEY, "1"); } catch {}
    }, 6000);
    const dismiss = () => {
      setShowDragHint(false);
      try { localStorage.setItem(DRAG_HINT_KEY, "1"); } catch {}
    };
    window.addEventListener("pointerdown", dismiss, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener("pointerdown", dismiss); };
  }, [showDragHint]);

  const isDragging = useRef(false);
  const dragConfirmed = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const totalMoved = useRef(0);
  const debounceRef = useRef(false);
  const lastTapTime = useRef(0);
  const xyRef = useRef(xy);
  const posRef = useRef(pos);
  const anyOpenRef = useRef(false);
  const rafId = useRef(0);

  xyRef.current = xy;
  posRef.current = pos;
  anyOpenRef.current = constellationOpen || dialogOpen;

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
    const maxY = vh - FAB_SIZE - 56 - 24;
    const minY = EDGE_PAD + 56;
    const clampedY = Math.max(minY, Math.min(maxY, cy));
    const newPos: StoredPos = { y: clampedY, edge };
    setPos(newPos);
    setXY(posToXY(newPos));
    savePos(newPos);
  }, []);

  const handleTap = useCallback(() => {
    if (debounceRef.current) return;
    const now = Date.now();
    if (now - lastTapTime.current < DOUBLE_TAP_MS) {
      lastTapTime.current = 0;
      debounceRef.current = true;
      navigate("/");
      window.scrollTo({ top: 0, behavior: "instant" });
      setTimeout(() => { debounceRef.current = false; }, TAP_DEBOUNCE_MS);
      return;
    }
    lastTapTime.current = now;
    debounceRef.current = true;
    setConstellationOpen(true);
    setTimeout(() => { debounceRef.current = false; }, TAP_DEBOUNCE_MS);
  }, [navigate]);

  const handleClick = useCallback((e: React.MouseEvent) => {
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
    } catch {
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
      // Dismiss drag hint on first real drag
      if (showDragHint) {
        setShowDragHint(false);
        try { localStorage.setItem(DRAG_HINT_KEY, "1"); } catch {}
      }
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
    } catch { /* ignore */ }
  }, [snapToEdge, handleTap]);

  const handleSelectAction = useCallback((type: string) => {
    setPreselectedType(type);
    setDialogEverOpened(true);
    setDialogOpen(true);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
  }, []);

  const anyOpen = constellationOpen || dialogOpen;

  return (
    <>
      {/* TEOTAG's Guiding Orb */}
      <button
        className="fixed flex items-center justify-center rounded-full touch-none select-none
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          group"
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          left: xy.x,
          top: xy.y,
          zIndex: Z.FLOATING,
          cursor: anyOpen ? "default" : "grab",
          pointerEvents: anyOpen ? "none" : "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="TEOTAG's guiding orb — explore, contribute, and discover"
        tabIndex={0}
      >
        {/* Outer ambient glow — always present */}
        <span
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ${anyOpen ? '' : 'firefly-ambient'}`}
          style={{
            inset: -8,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* Core orb body */}
        <span
          className="absolute inset-0 rounded-full transition-transform duration-300"
          style={{
            background: "radial-gradient(circle at 38% 32%, hsl(48 92% 68% / 0.95), hsl(36 85% 48% / 0.9) 60%, hsl(30 70% 35% / 0.85))",
            boxShadow: hovered || constellationOpen
              ? "0 0 24px 8px hsl(45 90% 60% / 0.35), inset 0 0 12px hsl(50 95% 80% / 0.4)"
              : "0 0 16px 4px hsl(45 90% 60% / 0.2), inset 0 0 8px hsl(50 95% 80% / 0.3)",
            transform: hovered || constellationOpen ? "scale(1.08)" : "scale(1)",
          }}
        />

        {/* Inner light — the "soul" of the orb */}
        <span
          className="absolute rounded-full"
          style={{
            inset: 6,
            background: "radial-gradient(circle at 42% 38%, hsl(50 97% 85% / 0.8), transparent 65%)",
          }}
        />

        {/* TEOTAG sigil — leaf symbol */}
        <span className="relative text-[13px] drop-shadow-sm" style={{ filter: "drop-shadow(0 0 4px hsl(45 90% 75% / 0.7))" }}>
          🍃
        </span>

        {/* Seasonal lens badge — subtle emoji indicator */}
        {activeLens && lensConfig && (
          <span
            className="absolute -top-1 -right-1 text-[10px] leading-none pointer-events-none animate-in fade-in duration-500"
            title={lensConfig.label}
          >
            {lensConfig.emoji}
          </span>
        )}

        {/* Breathing pulse ring — arterial rhythm */}
        <span
          className={`absolute inset-0 rounded-full pointer-events-none ${anyOpen ? '' : 'firefly-pulse'}`}
          style={{
            boxShadow: "0 0 20px 6px hsl(45 90% 60% / 0.15)",
          }}
        />
      </button>

      {/* One-time drag hint */}
      <AnimatePresence>
        {showDragHint && !anyOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed pointer-events-none"
            style={{
              left: xy.x - 120,
              top: xy.y - 44,
              zIndex: Z.FLOATING - 1,
            }}
          >
            <span
              className="inline-block text-[10px] font-serif px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{
                background: "hsl(var(--card) / 0.92)",
                color: "hsl(var(--muted-foreground))",
                border: "1px solid hsl(var(--border) / 0.3)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 2px 12px hsl(var(--primary) / 0.08)",
              }}
            >
              Drag the Orb if it covers something 🍃
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual guidance whispers from TEOTAG */}
      <FireflyGuidance
        fabPosition={xy}
        visible={!anyOpen}
      />

      {/* Staff Constellation — radial actions around the Orb */}
      <OrbConstellation
        open={constellationOpen}
        onClose={() => setConstellationOpen(false)}
        onSelectAction={handleSelectAction}
        cx={xy.x}
        cy={xy.y}
      />

      {/* Heavy dialog — lazy, only after first action selected */}
      {dialogEverOpened && (
        <SparkErrorBoundary fallbackMessage="The orb couldn't open the form — please try again.">
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
