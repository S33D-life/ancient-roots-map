/**
 * MapControlPanel — unified entry point for Legend, Signals, and Layers.
 * Replaces scattered legend/signal/filter buttons with ONE floating pill
 * that expands into a tabbed panel with integrated perspective control.
 *
 * Hierarchy: Legend (teaches) → Perspective (grounds) → Signals (reveals) → Layers (refines)
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  useGroveEvents,
  MYTHIC_TIMEFRAMES,
  getCurrentSeason,
  SEASON_PALETTE,
  type MythicTimeframe,
  type EventPulse,
} from "@/hooks/use-grove-events";
import {
  useMapFilters,
  PERSPECTIVES,
  type Perspective,
} from "@/contexts/MapFilterContext";

const STORAGE_KEY = "s33d-map-control-tab";
type PanelTab = "legend" | "signals" | "layers";

function loadLastTab(): PanelTab {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "legend" || v === "signals" || v === "layers") return v;
  } catch {}
  return "legend";
}

interface TreeItem {
  id: string;
  name: string;
  species: string | null;
  created_at: string;
}

interface MapControlPanelProps {
  groveActive: boolean;
  userLat?: number;
  treeLookup?: Map<string, { lat: number; lng: number }>;
  onEventPulses?: (pulses: EventPulse[]) => void;
  onTreeClick?: (treeId: string) => void;
  onOpenLayers: () => void;
  layersPanelOpen: boolean;
  activeCount: number;
  liveSignalCount?: number;
  onPerspectivePreset?: (perspective: Perspective) => void;
}

const LEGEND_ITEMS = [
  { emoji: "✨", label: "Ancient tree", color: "42, 80%, 55%" },
  { emoji: "💚", label: "Hearts available", color: "140, 40%, 55%" },
  { emoji: "🌬️", label: "Whisper waiting", color: "260, 40%, 60%" },
  { emoji: "🌱", label: "Seed planted", color: "120, 50%, 50%" },
  { emoji: "🐦", label: "Birdsong recorded", color: "200, 60%, 55%" },
  { emoji: "🌿", label: "Grove cluster", color: "130, 45%, 50%" },
  { emoji: "🔮", label: "Rootstone", color: "280, 50%, 55%" },
];

const TAB_CONFIG: { key: PanelTab; label: string; icon: string }[] = [
  { key: "legend", label: "Legend", icon: "✦" },
  { key: "signals", label: "Signals", icon: "🌿" },
  { key: "layers", label: "Layers", icon: "🗺️" },
];

export default function MapControlPanel({
  groveActive,
  userLat,
  treeLookup,
  onEventPulses,
  onTreeClick,
  onOpenLayers,
  layersPanelOpen,
  activeCount,
  onPerspectivePreset,
}: MapControlPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>(loadLastTab);
  const panelRef = useRef<HTMLDivElement>(null);

  // Perspective from context
  const { perspective, setPerspective } = useMapFilters();

  // Signal data
  const [timeframe, setTimeframe] = useState<MythicTimeframe>("moon");
  const { signals, loading, liveEventCount, eventPulses } = useGroveEvents(timeframe, treeLookup);
  const [recentTrees, setRecentTrees] = useState<TreeItem[]>([]);

  // Propagate event pulses
  useEffect(() => {
    if (onEventPulses && groveActive && eventPulses.length > 0) {
      onEventPulses(eventPulses);
    }
  }, [onEventPulses, groveActive, eventPulses]);

  // Fetch recent trees for signals tab
  useEffect(() => {
    if (!open || tab !== "signals") return;
    supabase
      .from("trees")
      .select("id, name, species, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentTrees(data || []));
  }, [open, tab]);

  // Save tab preference
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, tab); } catch {}
  }, [tab]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // When layers tab selected, open sidebar
  const handleTabChange = useCallback((t: PanelTab) => {
    setTab(t);
    if (t === "layers") {
      onOpenLayers();
      setOpen(false);
    }
  }, [onOpenLayers]);

  const handleToggle = useCallback(() => {
    if (layersPanelOpen) return;
    setOpen(v => !v);
  }, [layersPanelOpen]);

  const handlePerspectiveChange = useCallback((p: Perspective) => {
    setPerspective(p);
    onPerspectivePreset?.(p);
  }, [setPerspective, onPerspectivePreset]);

  const season = useMemo(() => getCurrentSeason(userLat), [userLat]);
  const palette = SEASON_PALETTE[season];
  const totalBadge = activeCount + (liveEventCount > 0 ? 1 : 0);
  const activePerspective = PERSPECTIVES.find(p => p.key === perspective);
  const activeAccent = activePerspective?.accent || "42, 90%, 55%";

  return (
    <div
      ref={panelRef}
      className="absolute left-3 z-[1005] select-none"
      style={{
        pointerEvents: "auto",
        top: "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px) + 0.75rem)",
      }}
    >
      {/* ── Entry pill ── */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 h-10 px-3.5 rounded-full transition-all duration-200 active:scale-95"
        style={{
          background: open
            ? "hsla(120, 30%, 12%, 0.95)"
            : "hsla(30, 20%, 10%, 0.88)",
          border: open
            ? "1px solid hsla(120, 40%, 40%, 0.5)"
            : "1px solid hsla(42, 40%, 30%, 0.4)",
          backdropFilter: "blur(12px)",
          color: open
            ? "hsl(120, 50%, 65%)"
            : "hsl(42, 60%, 60%)",
          boxShadow: open
            ? "0 0 12px hsla(120, 50%, 40%, 0.15)"
            : "0 2px 10px rgba(0,0,0,0.3)",
        }}
        aria-label={open ? "Close map controls" : "Open map controls"}
        aria-expanded={open}
      >
        <Layers className="w-4 h-4" />
        <span className="text-[11px] font-serif tracking-wider">Map</span>
        {/* Perspective indicator */}
        <span className="text-[12px]">{activePerspective?.icon}</span>
        {totalBadge > 0 && !open && (
          <span
            className="min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              background: "hsl(42, 80%, 55%)",
              color: "hsl(30, 20%, 10%)",
              boxShadow: "0 0 6px hsla(42, 80%, 55%, 0.4)",
            }}
          >
            {totalBadge}
          </span>
        )}
        {liveEventCount > 0 && !open && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "hsl(120, 55%, 50%)",
              boxShadow: "0 0 6px hsla(120, 55%, 50%, 0.6)",
              animation: "ancientGlow 3s ease-in-out infinite",
            }}
          />
        )}
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-2 rounded-xl overflow-hidden"
            style={{
              width: "min(300px, calc(100vw - 1.5rem))",
              background: "hsla(30, 18%, 8%, 0.96)",
              border: "1px solid hsla(42, 40%, 30%, 0.3)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px hsla(42, 20%, 20%, 0.1)",
            }}
          >
            {/* ── Perspective control — primary, above tabs ── */}
            <div className="px-3 pt-3 pb-2">
              <div
                className="flex rounded-full p-[2px]"
                style={{
                  background: "hsla(30, 20%, 12%, 0.8)",
                  border: `1px solid hsla(${activeAccent}, 0.2)`,
                }}
              >
                <TooltipProvider delayDuration={300}>
                {PERSPECTIVES.map(p => {
                  const isActive = perspective === p.key;
                  return (
                    <Tooltip key={p.key}>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => handlePerspectiveChange(p.key)}
                          whileTap={{ scale: 0.95 }}
                          className="relative flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-[10px] font-serif transition-colors duration-200"
                          style={{
                            color: isActive ? `hsl(${p.accent})` : "hsla(42, 30%, 50%, 0.5)",
                            background: isActive ? `hsla(${p.accent}, 0.12)` : "transparent",
                          }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="perspective-glow"
                              className="absolute inset-0 rounded-full"
                              style={{
                                border: `1px solid hsla(${p.accent}, 0.35)`,
                                boxShadow: `0 0 8px hsla(${p.accent}, 0.12)`,
                              }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 text-[12px]">{p.icon}</span>
                          <span className="relative z-10 tracking-wide">{p.label}</span>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="font-serif text-[11px] border-0"
                        style={{
                          background: "hsla(30, 20%, 10%, 0.95)",
                          color: `hsl(${p.accent})`,
                          border: `1px solid hsla(${p.accent}, 0.25)`,
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {p.description}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                </TooltipProvider>
              </div>
            </div>

            {/* Soft divider */}
            <div className="mx-3" style={{ height: "1px", background: "hsla(42, 30%, 30%, 0.15)" }} />

            {/* Tab bar */}
            <div
              className="flex px-1.5 pt-1.5 pb-1 gap-0.5"
            >
              {TAB_CONFIG.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-serif tracking-wider transition-all duration-200"
                  style={{
                    background: tab === t.key ? "hsla(42, 50%, 40%, 0.15)" : "transparent",
                    color: tab === t.key ? "hsl(42, 70%, 65%)" : "hsl(42, 30%, 40%)",
                    border: tab === t.key ? "1px solid hsla(42, 50%, 40%, 0.25)" : "1px solid transparent",
                  }}
                >
                  <span className="text-xs">{t.icon}</span>
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => setOpen(false)}
                className="px-1.5 py-1 transition-colors"
                style={{ color: "hsl(42, 40%, 45%)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tab content */}
            <div className="px-3 py-2 max-h-[calc(100svh-16rem)] overflow-y-auto overscroll-contain space-y-2">
              {tab === "legend" && (
                <div className="space-y-2">
                  <p className="text-[9px] font-serif uppercase tracking-[0.15em]" style={{ color: "hsl(42, 40%, 45%)" }}>
                    Map Symbols
                  </p>
                  {LEGEND_ITEMS.map(item => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0">{item.emoji}</span>
                      <span className="text-[11px] font-serif" style={{ color: `hsl(${item.color})` }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2" style={{ borderTop: "1px solid hsla(42, 30%, 30%, 0.12)" }}>
                    <p className="text-[9px] font-serif italic leading-relaxed" style={{ color: "hsl(42, 30%, 40%)" }}>
                      Tap any tree to discover its story.
                      <br />
                      Use <strong>Signals</strong> to see live activity, or <strong>Layers</strong> to refine what the forest reveals.
                    </p>
                  </div>
                </div>
              )}

              {tab === "signals" && (
                <SignalsContent
                  signals={signals}
                  loading={loading}
                  liveEventCount={liveEventCount}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  palette={palette}
                  recentTrees={recentTrees}
                  onTreeClick={(id) => { onTreeClick?.(id); setOpen(false); }}
                />
              )}

              {tab === "layers" && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => { onOpenLayers(); setOpen(false); }}
                    className="flex items-center justify-center gap-2 mx-auto px-5 py-3 rounded-xl text-[12px] font-serif tracking-wider transition-all active:scale-95"
                    style={{
                      background: "hsla(42, 40%, 20%, 0.3)",
                      border: "1px solid hsla(42, 50%, 40%, 0.35)",
                      color: "hsl(42, 70%, 60%)",
                      boxShadow: "0 2px 10px hsla(42, 80%, 55%, 0.15)",
                    }}
                  >
                    <Layers className="w-4 h-4" />
                    Open Living Layers
                  </button>
                  {activeCount > 0 && (
                    <p className="text-[10px] font-serif mt-2" style={{ color: "hsl(42, 40%, 50%)" }}>
                      {activeCount} filter{activeCount > 1 ? "s" : ""} active
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Signals tab content ── */
function SignalsContent({
  signals,
  loading,
  liveEventCount,
  timeframe,
  setTimeframe,
  palette,
  recentTrees,
  onTreeClick,
}: {
  signals: any;
  loading: boolean;
  liveEventCount: number;
  timeframe: MythicTimeframe;
  setTimeframe: (t: MythicTimeframe) => void;
  palette: any;
  recentTrees: TreeItem[];
  onTreeClick: (id: string) => void;
}) {
  return (
    <>
      {/* Season indicator */}
      <div
        className="text-[9px] font-serif text-center py-1 rounded-md"
        style={{
          background: palette.primary,
          color: "hsl(42, 60%, 70%)",
          border: `1px solid ${palette.glow}`,
        }}
      >
        {palette.label}
      </div>

      {/* Mythic Time Selector */}
      <div className="flex gap-1">
        {MYTHIC_TIMEFRAMES.map(tf => (
          <button
            key={tf.key}
            onClick={() => setTimeframe(tf.key)}
            className="flex-1 px-1 py-1.5 rounded-md text-center transition-all"
            style={{
              background: timeframe === tf.key ? "hsla(42, 60%, 40%, 0.2)" : "transparent",
              color: timeframe === tf.key ? "hsl(42, 80%, 65%)" : "hsl(42, 30%, 40%)",
              border: timeframe === tf.key ? "1px solid hsla(42, 60%, 40%, 0.3)" : "1px solid transparent",
              fontSize: "9px",
              fontFamily: "serif",
            }}
            title={tf.label}
          >
            <span className="block text-[13px] leading-none">{tf.icon}</span>
            <span className="block mt-0.5">{tf.label}</span>
          </button>
        ))}
      </div>

      {/* Signal rows */}
      <div className="space-y-1.5">
        <SignalRow icon="🌿" label="Trees Stirring" value={loading ? "…" : signals.treesStirring.toLocaleString()} color="120, 45%, 55%" />
        <SignalRow icon="❤️" label="Hearts Gathered" value={loading ? "…" : signals.heartsGathered.toLocaleString()} color="0, 65%, 55%" />
        <SignalRow icon="🌙" label="Offerings" value={loading ? "…" : signals.offeringsThisMoon.toLocaleString()} color="42, 80%, 55%" />
        <SignalRow icon="👣" label="Wanderers Active" value={loading ? "…" : signals.activeWanderers.toLocaleString()} color="260, 45%, 60%" />
        {signals.mostLovedWisdom && (
          <div className="pt-1 border-t" style={{ borderColor: "hsla(42, 30%, 30%, 0.2)" }}>
            <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(42, 40%, 45%)" }}>
              📜 Most Loved Wisdom
            </p>
            <p className="text-[10px] font-serif italic leading-relaxed line-clamp-2" style={{ color: "hsl(42, 60%, 65%)" }}>
              "{signals.mostLovedWisdom}"
            </p>
          </div>
        )}
      </div>

      {/* Recent Trees */}
      {recentTrees.length > 0 && (
        <div className="pt-1.5 border-t" style={{ borderColor: "hsla(42, 30%, 30%, 0.2)" }}>
          <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(42, 40%, 45%)" }}>
            🌱 Recently Added
          </p>
          <div className="space-y-0.5 max-h-[100px] overflow-y-auto overscroll-contain">
            {recentTrees.map(t => (
              <button
                key={t.id}
                onClick={() => onTreeClick(t.id)}
                className="w-full text-left px-2 py-1.5 rounded-lg transition-colors min-h-[32px]"
                style={{ color: "hsl(120, 30%, 60%)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "hsla(120, 30%, 30%, 0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <p className="text-[10px] font-serif truncate" style={{ color: "hsl(42, 50%, 65%)" }}>
                  {t.name}
                </p>
                <div className="flex items-center gap-2 text-[8px] font-mono" style={{ color: "hsl(120, 20%, 40%)" }}>
                  {t.species && <span className="italic truncate">{t.species}</span>}
                  <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live events */}
      {signals.recentEvents?.length > 0 && (
        <div className="pt-1 border-t" style={{ borderColor: "hsla(42, 30%, 30%, 0.2)" }}>
          <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(120, 35%, 45%)" }}>
            ✦ Live Signals
          </p>
          <div className="space-y-1 max-h-[60px] overflow-hidden">
            {signals.recentEvents.slice(0, 3).map((evt: any) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[9px] font-serif"
                style={{ color: "hsl(120, 30%, 50%)" }}
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[8px]"
                >
                  ◌
                </motion.span>
                <span>
                  {evt.type === "OFFERING_CREATED" ? "New offering stirred" :
                   evt.type === "HEART_EARNED" ? "Heart gathered" : "Signal received"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function SignalRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-serif flex items-center gap-1.5" style={{ color: `hsl(${color})` }}>
        <span className="text-[12px]">{icon}</span>
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-[11px] font-serif tabular-nums"
        style={{ color: `hsl(${color})` }}
      >
        {value}
      </motion.span>
    </div>
  );
}
