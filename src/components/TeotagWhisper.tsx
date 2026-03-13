import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, X, Map, Route, BookOpen, Compass, TreeDeciduous, ShoppingBasket } from "lucide-react";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { useTeotagContext, type TeotagMode, type MapContext, type LibraryContext, type CouncilContext, type PageContext } from "@/contexts/TeotagContext";

/* ── Whisper types ────────────────────────────────── */
export type WhisperKind = "landscape" | "tree" | "knowledge" | "journey";

interface Whisper {
  kind: WhisperKind;
  message: string;
  action?: { label: string; emoji: string; onClick: () => void };
}

/* ── Whisper pools by context ────────────────────── */

function buildMapWhispers(ctx: MapContext, onAction: (type: string) => void): Whisper[] {
  const pool: Whisper[] = [];

  // Tree-specific whispers
  if (ctx.selectedTreeName) {
    pool.push({
      kind: "tree",
      message: `${ctx.selectedTreeName} holds a living story. Tap to explore what surrounds it.`,
      action: { label: "Show nearby", emoji: "🗺️", onClick: () => onAction("nearby") },
    });
    pool.push({
      kind: "journey",
      message: `Footpaths and rivers weave around ${ctx.selectedTreeName}. A walk awaits.`,
      action: { label: "Show route", emoji: "🥾", onClick: () => onAction("route") },
    });
    if (ctx.selectedTreeSpecies) {
      pool.push({
        kind: "knowledge",
        message: `${ctx.selectedTreeSpecies} trees are connected across the grove. Discover their shared stories.`,
        action: { label: "Explore species", emoji: "🌿", onClick: () => onAction("species") },
      });
    }
  }

  // Landscape whispers based on zoom and position
  if (ctx.zoom && ctx.zoom >= 12) {
    pool.push({
      kind: "landscape",
      message: "Ancient churches, waterways, and paths lie hidden in this landscape…",
      action: { label: "Show nearby", emoji: "🏛️", onClick: () => onAction("nearby") },
    });
  }
  if (ctx.zoom && ctx.zoom < 10) {
    pool.push({
      kind: "landscape",
      message: "Zoom closer to discover individual trees and the stories they carry.",
    });
  }
  if (ctx.visibleTreeCount && ctx.visibleTreeCount > 5) {
    pool.push({
      kind: "landscape",
      message: `${ctx.visibleTreeCount} ancient friends are visible in this grove. Each holds a memory.`,
    });
  }

  // Generic map whispers
  pool.push(
    { kind: "landscape", message: "Use the 'Find Me & Add Tree' button to mark a new encounter with an ancient friend." },
    { kind: "journey", message: "Every journey begins with a single tree. Where will yours lead?" },
  );

  return pool;
}

function buildLibraryWhispers(ctx: LibraryContext, onAction: (type: string) => void): Whisper[] {
  const pool: Whisper[] = [];

  if (ctx.selectedBookTitle) {
    pool.push({
      kind: "knowledge",
      message: `"${ctx.selectedBookTitle}" may connect to trees and council records you haven't seen yet.`,
      action: { label: "Explore related", emoji: "🔗", onClick: () => onAction("related") },
    });
  }

  pool.push(
    { kind: "knowledge", message: "The Heartwood holds the grove's living memory. Wander its shelves." },
    { kind: "knowledge", message: "Offerings of words, songs, and images gather here like fallen leaves." },
  );

  return pool;
}

function buildCouncilWhispers(_ctx: CouncilContext, onAction: (type: string) => void): Whisper[] {
  return [
    {
      kind: "knowledge",
      message: "The Council gathers in the canopy. Each gathering seeds new understanding.",
      action: { label: "View themes", emoji: "📋", onClick: () => onAction("themes") },
    },
    { kind: "knowledge", message: "Community wisdom grows like lichen — slowly, beautifully." },
  ];
}

/* ── Page-specific whispers ─────────────────────── */

function buildTreePageWhispers(ctx: NonNullable<PageContext["tree"]>, onAction: (type: string) => void): Whisper[] {
  const pool: Whisper[] = [
    {
      kind: "tree",
      message: `You are visiting ${ctx.name}. Every tree holds a living story waiting to be heard.`,
      action: { label: "Ask TEOTAG", emoji: "✨", onClick: () => onAction("open-guide") },
    },
  ];
  if (ctx.bloomStatus) {
    pool.push({
      kind: "landscape",
      message: `${ctx.name} is currently ${ctx.bloomStatus}. The seasons shape its rhythm.`,
    });
  }
  if (ctx.species) {
    pool.push({
      kind: "knowledge",
      message: `${ctx.species} trees share deep connections across the grove. Explore their kin.`,
      action: { label: "Explore species", emoji: "🌿", onClick: () => onAction("species") },
    });
  }
  if (ctx.offeringCount && ctx.offeringCount > 0) {
    pool.push({
      kind: "journey",
      message: `${ctx.offeringCount} offerings have been left at ${ctx.name}. Songs, stories, and images gather here.`,
    });
  }
  return pool;
}

function buildHarvestPageWhispers(ctx: NonNullable<PageContext["harvest"]>, onAction: (type: string) => void): Whisper[] {
  const pool: Whisper[] = [];
  if (ctx.produceName) {
    pool.push({
      kind: "landscape",
      message: `${ctx.produceName} — a gift from the living landscape. Discover its seasonal rhythm.`,
      action: { label: "Season guide", emoji: "📅", onClick: () => onAction("open-guide") },
    });
  }
  if (ctx.treeId) {
    pool.push({
      kind: "tree",
      message: "This harvest is linked to a living tree. Visit the source of this abundance.",
      action: { label: "View tree", emoji: "🌳", onClick: () => onAction("view-tree") },
    });
  }
  pool.push({
    kind: "journey",
    message: "The Harvest Exchange connects guardians and foragers through seasonal abundance.",
  });
  return pool;
}

function buildStaffPageWhispers(ctx: NonNullable<PageContext["staff"]>): Whisper[] {
  return [
    {
      kind: "journey",
      message: `The Walking Staff "${ctx.staffName || ctx.code}" carries the memory of its bearer's journey.`,
    },
    {
      kind: "knowledge",
      message: `${ctx.species || "This wood"} holds stories older than words. Each grain is a year remembered.`,
    },
  ];
}

function buildGenericWhispers(): Whisper[] {
  return [
    { kind: "landscape", message: "The roots remember what the branches dream…" },
    { kind: "journey", message: "Welcome to TETOL. Wander freely — every path leads somewhere true." },
  ];
}

/* ── Icons by whisper kind ───────────────────────── */
const kindIcons: Record<WhisperKind, typeof Leaf> = {
  landscape: Compass,
  tree: Leaf,
  knowledge: BookOpen,
  journey: Route,
};

/* ── Cooldown & frequency ────────────────────────── */
const MIN_INTERVAL_MS = 45_000; // minimum 45s between whispers
const SHOW_DURATION_MS = 10_000; // visible for 10s
const INITIAL_DELAY_MS = 12_000; // wait 12s before first whisper
const SESSION_KEY = "teotag-whisper-count";
const MAX_PER_SESSION = 8;

function getSessionCount(): number {
  try { return parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10); } catch { return 0; }
}
function incrementSessionCount() {
  try { sessionStorage.setItem(SESSION_KEY, String(getSessionCount() + 1)); } catch { /* noop */ }
}

/* ── Component ───────────────────────────────────── */

interface TeotagWhisperProps {
  onAction?: (actionType: string) => void;
}

const TeotagWhisper = ({ onAction }: TeotagWhisperProps) => {
  const popupsAllowed = usePopupGate();
  const { activeMode, mapContext, libraryContext, councilContext, pageContext } = useTeotagContext();
  const [current, setCurrent] = useState<Whisper | null>(null);
  const [visible, setVisible] = useState(false);
  const lastShownRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAction = useCallback((type: string) => {
    setVisible(false);
    onAction?.(type);
  }, [onAction]);

  const pickWhisper = useCallback((): Whisper | null => {
    if (getSessionCount() >= MAX_PER_SESSION) return null;

    let pool: Whisper[];

    // Page-level context takes priority
    if (pageContext.tree) {
      pool = buildTreePageWhispers(pageContext.tree, handleAction);
    } else if (pageContext.harvest?.id) {
      pool = buildHarvestPageWhispers(pageContext.harvest, handleAction);
    } else if (pageContext.staff?.code) {
      pool = buildStaffPageWhispers(pageContext.staff);
    } else {
      // Fall back to mode-based whispers
      switch (activeMode) {
        case "guide":
          pool = buildMapWhispers(mapContext, handleAction);
          break;
        case "librarian":
          pool = buildLibraryWhispers(libraryContext, handleAction);
          break;
        case "scribe":
          pool = buildCouncilWhispers(councilContext, handleAction);
          break;
        default:
          pool = buildGenericWhispers();
      }
    }

    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [activeMode, mapContext, libraryContext, councilContext, pageContext, handleAction]);

  const showNext = useCallback(() => {
    const now = Date.now();
    if (now - lastShownRef.current < MIN_INTERVAL_MS) return;

    const whisper = pickWhisper();
    if (!whisper) return;

    lastShownRef.current = now;
    incrementSessionCount();
    setCurrent(whisper);
    setVisible(true);

    // Auto-dismiss
    dismissTimerRef.current = setTimeout(() => setVisible(false), SHOW_DURATION_MS);
  }, [pickWhisper]);

  // Schedule whispers on context changes
  useEffect(() => {
    // Initial delay
    timerRef.current = setTimeout(() => {
      showNext();
      // Then periodic checks
      timerRef.current = setInterval(() => {
        // Only try if popups are allowed
        if (Math.random() < 0.4) showNext(); // 40% chance each interval to feel organic
      }, MIN_INTERVAL_MS) as unknown as ReturnType<typeof setTimeout>;
    }, INITIAL_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
    // Re-schedule when mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  // Show a fresh whisper when a tree is selected on map (with cooldown)
  useEffect(() => {
    if (mapContext.selectedTreeId) {
      const delay = setTimeout(() => showNext(), 3000);
      return () => clearTimeout(delay);
    }
  }, [mapContext.selectedTreeId, showNext]);

  // Show a contextual whisper when arriving at a tree/harvest/staff page
  useEffect(() => {
    const hasPageCtx = pageContext.tree || pageContext.harvest?.id || pageContext.staff?.code;
    if (hasPageCtx) {
      const delay = setTimeout(() => showNext(), 5000);
      return () => clearTimeout(delay);
    }
  }, [pageContext.tree?.id, pageContext.harvest?.id, pageContext.staff?.code, showNext]);

  const dismiss = () => {
    setVisible(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  const shouldShow = visible && popupsAllowed && current;
  const Icon = current ? kindIcons[current.kind] : Leaf;

  return (
    <AnimatePresence>
      {shouldShow && current && (
        <motion.div
          key={current.message}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed z-[60] left-3 right-3 sm:left-auto sm:right-4 sm:max-w-[320px]"
          style={{ bottom: "calc(5rem + max(env(safe-area-inset-bottom, 0px), 6px) + 16px)" }}
        >
          <div
            className="rounded-2xl rounded-br-md px-4 py-3 border backdrop-blur-md shadow-lg group cursor-default"
            style={{
              background: "hsl(var(--card) / 0.93)",
              borderColor: "hsl(var(--primary) / 0.2)",
            }}
          >
            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss whisper"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Message */}
            <div className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-card-foreground/85 leading-relaxed italic">
                  {current.message}
                </p>

                {/* Action button */}
                {current.action && (
                  <button
                    onClick={() => current.action!.onClick()}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>{current.action.emoji}</span>
                    <span className="underline underline-offset-2">{current.action.label}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attribution */}
            <p className="text-[9px] text-muted-foreground/35 font-serif mt-1.5 text-right select-none">
              — TEOTAG whispers
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeotagWhisper;
