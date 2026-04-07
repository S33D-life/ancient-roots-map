/**
 * GroveViewOverlay — "Living Earth Mode"
 *
 * A mythic ecological overlay that transforms the map into a breathing,
 * living forest view. Shows Grove Signals panel (top-right dropdown),
 * mythic time selector, live event stream, and seasonal atmosphere shifts.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface TreeItem {
  id: string;
  name: string;
  species: string | null;
  created_at: string;
}

type TreeTab = "recent" | "nearby";

interface GroveViewOverlayProps {
  active: boolean;
  onToggle: () => void;
  userLat?: number;
  treeLookup?: Map<string, { lat: number; lng: number }>;
  onEventPulses?: (pulses: EventPulse[]) => void;
  onTreeClick?: (treeId: string) => void;
}

const GroveViewOverlay = ({ active, onToggle, userLat, treeLookup, onEventPulses, onTreeClick }: GroveViewOverlayProps) => {
  const [timeframe, setTimeframe] = useState<MythicTimeframe>("moon");
  const [panelOpen, setPanelOpen] = useState(false);
  const { signals, loading, liveEventCount, eventPulses } = useGroveEvents(timeframe, treeLookup);

  // Tree discovery data
  const [treeTab, setTreeTab] = useState<TreeTab>("recent");
  const [recentTrees, setRecentTrees] = useState<TreeItem[]>([]);
  const [nearbyTrees, setNearbyTrees] = useState<TreeItem[]>([]);

  // Close panel on outside click
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [panelOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen]);

  // Close panel when overlay deactivates
  useEffect(() => {
    if (!active) setPanelOpen(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    supabase
      .from("trees")
      .select("id, name, species, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentTrees(data || []));
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const fetchAwaiting = async () => {
      // Single query: get recent trees that have zero offerings (avoids N+1)
      const { data } = await supabase.rpc("get_trees_without_offerings" as any, { p_limit: 5 });
      if (data) {
        setNearbyTrees(data as TreeItem[]);
      } else {
        // Fallback: simple query if RPC doesn't exist yet
        const { data: candidates } = await supabase
          .from("trees")
          .select("id, name, species, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        setNearbyTrees(candidates || []);
      }
    };
    fetchAwaiting();
  }, [active]);

  // Propagate event pulses to parent via useEffect (not during render)
  useEffect(() => {
    if (onEventPulses && active && eventPulses.length > 0) {
      onEventPulses(eventPulses);
    }
  }, [onEventPulses, active, eventPulses]);

  const season = useMemo(() => getCurrentSeason(userLat), [userLat]);
  const palette = SEASON_PALETTE[season];
  const displayTrees = treeTab === "recent" ? recentTrees : nearbyTrees;

  // Early return when inactive — prevents mounting effects and rendering overlay DOM
  if (!active) return null;

  return (
    <>
      {/* Seasonal atmosphere overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={`atmosphere-${season}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${palette.primary} 0%, ${palette.secondary} 60%, ${palette.glow} 100%)`,
              mixBlendMode: "multiply",
            }}
          />
        )}
      </AnimatePresence>

      {/* Breathing shimmer */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.02, 0.06, 0.02] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 z-[6] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 40%, hsla(42, 80%, 55%, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${palette.glow} 0%, transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Mycelial network */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.01, 0.04, 0.01] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 80%, ${palette.primary} 0%, transparent 30%), radial-gradient(circle at 20% 60%, ${palette.secondary} 0%, transparent 25%), radial-gradient(circle at 80% 40%, ${palette.glow} 0%, transparent 20%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Grove Signals — top-right toggle + dropdown ── */}
      <AnimatePresence>
        {active && (
          <div
            ref={panelRef}
            className="absolute left-3 z-[1003]"
            style={{ top: "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px) + 5.5rem)" }}
          >
            {/* Toggle button — matches map control sizing (44px) */}
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="flex items-center gap-1.5 h-11 px-3 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: panelOpen
                  ? "hsla(120, 30%, 12%, 0.95)"
                  : "hsla(30, 20%, 10%, 0.85)",
                border: panelOpen
                  ? "1px solid hsla(120, 40%, 40%, 0.5)"
                  : "1px solid hsla(42, 40%, 30%, 0.4)",
                backdropFilter: "blur(12px)",
                color: panelOpen
                  ? "hsl(120, 50%, 65%)"
                  : "hsl(42, 60%, 60%)",
                boxShadow: panelOpen
                  ? "0 0 12px hsla(120, 50%, 40%, 0.15)"
                  : "0 2px 8px rgba(0,0,0,0.25)",
              }}
              aria-label={panelOpen ? "Close Grove Signals" : "Open Grove Signals"}
              aria-expanded={panelOpen}
            >
              <span className="text-sm">🌿</span>
              <span className="text-[10px] font-serif tracking-wider hidden sm:inline">Signals</span>
              {liveEventCount > 0 && !panelOpen && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "hsl(120, 55%, 50%)",
                    boxShadow: "0 0 6px hsla(120, 55%, 50%, 0.6)",
                  }}
                />
              )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {panelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="mt-2 rounded-xl overflow-hidden"
                  style={{
                    width: "min(280px, calc(100vw - 1.5rem))",
                    background: "hsla(120, 20%, 8%, 0.94)",
                    border: "1px solid hsla(120, 30%, 30%, 0.3)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px hsla(120, 20%, 20%, 0.1)",
                  }}
                >
                  <div className="px-3 py-3 space-y-2.5 max-h-[calc(100svh-8rem)] overflow-y-auto overscroll-contain">
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
                        <div className="pt-1 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                          <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(42, 40%, 45%)" }}>
                            📜 Most Loved Wisdom
                          </p>
                          <p className="text-[10px] font-serif italic leading-relaxed line-clamp-2" style={{ color: "hsl(42, 60%, 65%)" }}>
                            "{signals.mostLovedWisdom}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tree Discovery */}
                    <div className="pt-1.5 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                      <div className="flex gap-1 mb-1.5">
                        <TreeTabButton active={treeTab === "recent"} onClick={() => setTreeTab("recent")} label="🌱 Recent" count={recentTrees.length} />
                        <TreeTabButton active={treeTab === "nearby"} onClick={() => setTreeTab("nearby")} label="🧭 Awaiting" count={nearbyTrees.length} />
                      </div>
                      <div className="space-y-0.5 max-h-[120px] overflow-y-auto overscroll-contain">
                        {displayTrees.length === 0 ? (
                          <p className="text-[9px] font-serif italic text-center py-2" style={{ color: "hsl(120, 20%, 40%)" }}>
                            {treeTab === "recent" ? "No trees yet" : "All trees have offerings ✦"}
                          </p>
                        ) : (
                          displayTrees.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { onTreeClick?.(t.id); setPanelOpen(false); }}
                              className="w-full text-left px-2 py-1.5 rounded-lg transition-colors min-h-[36px]"
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
                          ))
                        )}
                      </div>
                    </div>

                    {/* Live event stream */}
                    {signals.recentEvents.length > 0 && (
                      <div className="pt-1 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                        <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(120, 35%, 45%)" }}>
                          ✦ Live Mycelial Whispers
                        </p>
                        <div className="space-y-1 max-h-[60px] overflow-hidden">
                          {signals.recentEvents.slice(0, 3).map(evt => (
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
                                {evt.type === 'OFFERING_CREATED' ? 'New offering stirred' :
                                 evt.type === 'HEART_EARNED' ? 'Heart gathered' : 'Signal received'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

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

function TreeTabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-1.5 py-1 rounded-md text-[9px] font-serif transition-all flex items-center justify-center gap-1"
      style={{
        background: active ? "hsla(120, 40%, 30%, 0.25)" : "transparent",
        color: active ? "hsl(120, 50%, 65%)" : "hsl(120, 20%, 40%)",
        border: active ? "1px solid hsla(120, 40%, 40%, 0.3)" : "1px solid transparent",
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="text-[7px] px-1 rounded-full"
          style={{
            background: active ? "hsla(120, 50%, 45%, 0.25)" : "hsla(120, 20%, 30%, 0.3)",
            color: active ? "hsl(120, 60%, 65%)" : "hsl(120, 20%, 45%)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default GroveViewOverlay;
