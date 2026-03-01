/**
 * useGroveEvents — unified event model for GroveView "Living Earth Mode"
 *
 * Aggregates recent activity across trees, offerings, hearts, and checkins
 * into a single normalized event stream, filtered by mythic timeframe.
 * Includes realtime subscriptions for live pulse + coordinate-based event pulsing.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MythicTimeframe = "now" | "today" | "moon" | "all_seasons";

export const MYTHIC_TIMEFRAMES: { key: MythicTimeframe; label: string; icon: string }[] = [
  { key: "now", label: "Now", icon: "🌙" },
  { key: "today", label: "Today", icon: "🌗" },
  { key: "moon", label: "This Moon", icon: "🌕" },
  { key: "all_seasons", label: "All Seasons", icon: "🌳" },
];

export interface GroveEvent {
  id: string;
  type: "TREE_MAPPED" | "OFFERING_CREATED" | "HEART_EARNED" | "CHECKIN" | "QUOTE_UPVOTED" | "SEED_PLANTED";
  timestamp: string;
  treeId?: string;
  lat?: number;
  lng?: number;
  metadata?: Record<string, any>;
}

export interface GroveSignals {
  treesStirring: number;
  heartsGathered: number;
  offeringsThisMoon: number;
  mostLovedWisdom: string | null;
  recentEvents: GroveEvent[];
  activeWanderers: number;
}

/** Represents a pulse that should briefly shimmer on the map */
export interface EventPulse {
  id: string;
  lat: number;
  lng: number;
  type: "offering" | "heart";
  timestamp: number; // Date.now()
}

/**
 * Detect current season based on hemisphere.
 * Northern: Mar-May spring, Jun-Aug summer, Sep-Nov autumn, Dec-Feb winter
 * Southern: reversed
 */
export type Season = "spring" | "summer" | "autumn" | "winter";

export function getCurrentSeason(lat?: number): Season {
  const month = new Date().getMonth(); // 0-indexed
  const isNorthern = !lat || lat >= 0;

  if (isNorthern) {
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  } else {
    if (month >= 2 && month <= 4) return "autumn";
    if (month >= 5 && month <= 7) return "winter";
    if (month >= 8 && month <= 10) return "spring";
    return "summer";
  }
}

export const SEASON_PALETTE: Record<Season, {
  primary: string; secondary: string; glow: string; label: string;
}> = {
  spring: {
    primary: "hsla(120, 50%, 40%, 0.15)",
    secondary: "hsla(90, 60%, 45%, 0.1)",
    glow: "hsla(100, 55%, 50%, 0.12)",
    label: "🌱 Spring Awakening",
  },
  summer: {
    primary: "hsla(42, 70%, 50%, 0.12)",
    secondary: "hsla(60, 60%, 45%, 0.1)",
    glow: "hsla(50, 80%, 55%, 0.1)",
    label: "☀️ Summer Canopy",
  },
  autumn: {
    primary: "hsla(25, 65%, 45%, 0.15)",
    secondary: "hsla(35, 70%, 40%, 0.12)",
    glow: "hsla(15, 60%, 50%, 0.1)",
    label: "🍂 Autumn Turning",
  },
  winter: {
    primary: "hsla(210, 30%, 35%, 0.15)",
    secondary: "hsla(200, 25%, 30%, 0.12)",
    glow: "hsla(220, 20%, 45%, 0.08)",
    label: "❄️ Winter Rest",
  },
};

function getTimeframeCutoff(tf: MythicTimeframe): string {
  const now = new Date();
  switch (tf) {
    case "now": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "today": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "moon": return new Date(now.getTime() - 29.5 * 24 * 60 * 60 * 1000).toISOString();
    case "all_seasons": return "1970-01-01T00:00:00Z";
  }
}

/** H3-like hex binning using simple lat/lng grid (no h3-js dependency needed) */
export interface HexBin {
  id: string;
  lat: number;
  lng: number;
  count: number;
  intensity: number; // 0-1
}

export function computeHexBins(
  events: { lat: number; lng: number }[],
  resolution: number = 0.5 // degrees per bin
): HexBin[] {
  const bins = new Map<string, { lat: number; lng: number; count: number }>();

  for (const e of events) {
    const bLat = Math.floor(e.lat / resolution) * resolution + resolution / 2;
    const bLng = Math.floor(e.lng / resolution) * resolution + resolution / 2;
    const key = `${bLat.toFixed(2)},${bLng.toFixed(2)}`;
    const existing = bins.get(key);
    if (existing) {
      existing.count++;
    } else {
      bins.set(key, { lat: bLat, lng: bLng, count: 1 });
    }
  }

  const maxCount = Math.max(1, ...Array.from(bins.values()).map(b => b.count));
  return Array.from(bins.entries()).map(([id, b]) => ({
    id,
    lat: b.lat,
    lng: b.lng,
    count: b.count,
    intensity: b.count / maxCount,
  }));
}

export function useGroveEvents(timeframe: MythicTimeframe, treeLookup?: Map<string, { lat: number; lng: number }>) {
  const [signals, setSignals] = useState<GroveSignals>({
    treesStirring: 0,
    heartsGathered: 0,
    offeringsThisMoon: 0,
    mostLovedWisdom: null,
    recentEvents: [],
    activeWanderers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [liveEventCount, setLiveEventCount] = useState(0);
  const [eventPulses, setEventPulses] = useState<EventPulse[]>([]);
  const channelRef = useRef<any>(null);

  // Auto-expire pulses after 4 seconds
  useEffect(() => {
    if (eventPulses.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setEventPulses(prev => prev.filter(p => now - p.timestamp < 4000));
    }, 1000);
    return () => clearInterval(timer);
  }, [eventPulses.length]);

  const cutoff = useMemo(() => getTimeframeCutoff(timeframe), [timeframe]);

  const fetchSignals = useCallback(async () => {
    const [treesRes, offeringsRes, heartsRes, quoteRes, wanderersRes] = await Promise.all([
      supabase
        .from("offerings")
        .select("tree_id", { count: "exact", head: true })
        .gte("created_at", cutoff),
      supabase
        .from("offerings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", cutoff),
      supabase
        .from("heart_transactions")
        .select("amount")
        .gte("created_at", cutoff),
      supabase
        .from("offerings")
        .select("quote_text, influence_score")
        .not("quote_text", "is", null)
        .order("influence_score", { ascending: false })
        .limit(1),
      supabase
        .from("offerings")
        .select("created_by", { count: "exact", head: true })
        .gte("created_at", cutoff)
        .not("created_by", "is", null),
    ]);

    const heartTotal = heartsRes.data?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0;

    setSignals(prev => ({
      ...prev,
      treesStirring: treesRes.count || 0,
      heartsGathered: heartTotal,
      offeringsThisMoon: offeringsRes.count || 0,
      mostLovedWisdom: quoteRes.data?.[0]?.quote_text || null,
      activeWanderers: wanderersRes.count || 0,
    }));
    setLoading(false);
  }, [cutoff]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSignals().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchSignals]);

  // Realtime subscription for live event pulses
  useEffect(() => {
    const channel = supabase
      .channel('grove-events-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'offerings' },
        (payload) => {
          setLiveEventCount(c => c + 1);
          const treeId = payload.new.tree_id;
          const newEvent: GroveEvent = {
            id: payload.new.id,
            type: 'OFFERING_CREATED',
            timestamp: payload.new.created_at,
            treeId,
          };
          setSignals(prev => ({
            ...prev,
            offeringsThisMoon: prev.offeringsThisMoon + 1,
            recentEvents: [newEvent, ...prev.recentEvents].slice(0, 10),
          }));

          // Create coordinate pulse if we know tree location
          if (treeLookup && treeId) {
            const loc = treeLookup.get(treeId);
            if (loc) {
              setEventPulses(prev => [...prev, {
                id: payload.new.id,
                lat: loc.lat,
                lng: loc.lng,
                type: "offering",
                timestamp: Date.now(),
              }]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'heart_transactions' },
        (payload) => {
          setSignals(prev => ({
            ...prev,
            heartsGathered: prev.heartsGathered + (payload.new.amount || 0),
          }));

          // Create coordinate pulse for hearts
          if (treeLookup && payload.new.tree_id) {
            const loc = treeLookup.get(payload.new.tree_id);
            if (loc) {
              setEventPulses(prev => [...prev, {
                id: payload.new.id,
                lat: loc.lat,
                lng: loc.lng,
                type: "heart",
                timestamp: Date.now(),
              }]);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [treeLookup]);

  return { signals, loading, liveEventCount, eventPulses };
}
