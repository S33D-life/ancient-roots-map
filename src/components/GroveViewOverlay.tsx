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

      {/* Signal panel moved to MapControlPanel — only atmosphere remains */}
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
