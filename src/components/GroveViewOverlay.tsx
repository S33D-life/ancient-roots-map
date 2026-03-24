/**
 * GroveViewOverlay — "Living Earth Mode"
 *
 * A mythic ecological overlay that transforms the map into a breathing,
 * living forest view. Shows Grove Signals panel (including recent/nearby trees),
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
  const [signalsExpanded, setSignalsExpanded] = useState(true);
  const { signals, loading, liveEventCount, eventPulses } = useGroveEvents(timeframe, treeLookup);

  // Tree discovery data (merged from MapTreePanel)
  const [treeTab, setTreeTab] = useState<TreeTab>("recent");
  const [recentTrees, setRecentTrees] = useState<TreeItem[]>([]);
  const [nearbyTrees, setNearbyTrees] = useState<TreeItem[]>([]);

  // Drag state for Grove Signals panel
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const point = "touches" in e ? e.touches[0] : e;
    dragRef.current = { startX: point.clientX, startY: point.clientY, origX: dragOffset.x, origY: dragOffset.y };
  }, [dragOffset]);

  const onDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragRef.current) return;
    const point = "touches" in e ? e.touches[0] : e;
    setDragOffset({
      x: dragRef.current.origX + (point.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (point.clientY - dragRef.current.startY),
    });
  }, []);

  const onDragEnd = useCallback(() => { dragRef.current = null; }, []);

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
      const { data: candidates } = await supabase
        .from("trees")
        .select("id, name, species, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!candidates?.length) return;
      const awaiting: TreeItem[] = [];
      for (const tree of candidates) {
        if (awaiting.length >= 5) break;
        const { count } = await supabase
          .from("offerings")
          .select("*", { count: "exact", head: true })
          .eq("tree_id", tree.id);
        if ((count || 0) === 0) awaiting.push(tree);
      }
      setNearbyTrees(awaiting);
    };
    fetchAwaiting();
  }, [active]);

  if (onEventPulses && active) {
    onEventPulses(eventPulses);
  }

  const season = useMemo(() => getCurrentSeason(userLat), [userLat]);
  const palette = SEASON_PALETTE[season];

  const displayTrees = treeTab === "recent" ? recentTrees : nearbyTrees;

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

      {/* ── Grove Signals Panel (bottom-left) ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-1/2 -translate-x-1/2 z-[1001] w-[min(280px,calc(100vw-2rem))]"
            style={{ bottom: "calc(var(--bottom-nav-height, 3.5rem) + var(--safe-bottom, 8px) + var(--bottom-nav-height, 3.5rem) + 8px)" }}
          >
            {/* Collapse toggle */}
            <button
              onClick={() => setSignalsExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-t-xl text-[10px] font-serif tracking-wider transition-colors"
              style={{
                background: "hsla(120, 20%, 8%, 0.92)",
                color: "hsl(120, 40%, 65%)",
                border: "1px solid hsla(120, 30%, 30%, 0.3)",
                borderBottom: signalsExpanded ? "none" : undefined,
                borderRadius: signalsExpanded ? "12px 12px 0 0" : "12px",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="flex items-center gap-1.5">
                <motion.span
                  animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  🌿
                </motion.span>
                Grove Signals
                {liveEventCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold"
                    style={{
                      background: "hsla(120, 60%, 45%, 0.3)",
                      color: "hsl(120, 60%, 65%)",
                      border: "1px solid hsla(120, 50%, 50%, 0.4)",
                    }}
                  >
                    •
                  </motion.span>
                )}
              </span>
              <span style={{ transform: signalsExpanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
            </button>

            <AnimatePresence>
              {signalsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-3 pb-3 pt-2 space-y-2.5 rounded-b-xl"
                    style={{
                      background: "hsla(120, 20%, 8%, 0.92)",
                      border: "1px solid hsla(120, 30%, 30%, 0.3)",
                      borderTop: "none",
                      backdropFilter: "blur(12px)",
                    }}
                  >
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

                    {/* ── Tree Discovery (merged from MapTreePanel) ── */}
                    <div className="pt-1.5 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                      <div className="flex gap-1 mb-1.5">
                        <TreeTabButton
                          active={treeTab === "recent"}
                          onClick={() => setTreeTab("recent")}
                          label="🌱 Recent"
                          count={recentTrees.length}
                        />
                        <TreeTabButton
                          active={treeTab === "nearby"}
                          onClick={() => setTreeTab("nearby")}
                          label="🧭 Awaiting"
                          count={nearbyTrees.length}
                        />
                      </div>

                      <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                        {displayTrees.length === 0 ? (
                          <p className="text-[9px] font-serif italic text-center py-2" style={{ color: "hsl(120, 20%, 40%)" }}>
                            {treeTab === "recent" ? "No trees yet" : "All trees have offerings ✦"}
                          </p>
                        ) : (
                          displayTrees.map(t => (
                            <button
                              key={t.id}
                              onClick={() => onTreeClick?.(t.id)}
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
          </motion.div>
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
