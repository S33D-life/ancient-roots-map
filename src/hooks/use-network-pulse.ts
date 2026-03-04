/**
 * useNetworkPulse — subscribes to real-time ecosystem events and
 * emits typed pulse signals for the Living Tree overlay.
 *
 * Event types:
 *   tree_mapped  — new tree added  → root pulse
 *   offering     — offering added  → trunk ripple
 *   council      — council event   → canopy glow
 *   library      — book/story added → heartwood glow
 *
 * Falls back to a gentle simulated heartbeat when no real events arrive.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PulseEventType = "tree_mapped" | "offering" | "council" | "library" | "heartbeat";

export interface PulseEvent {
  id: string;
  type: PulseEventType;
  timestamp: number;
  /** 0–1 intensity */
  intensity: number;
}

const MAX_EVENTS = 8;

export function useNetworkPulse() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<PulseEvent | null>(null);
  const eventCounter = useRef(0);

  const pushEvent = useCallback((type: PulseEventType, intensity = 0.6) => {
    const evt: PulseEvent = {
      id: `pulse-${eventCounter.current++}`,
      type,
      timestamp: Date.now(),
      intensity: Math.min(1, Math.max(0, intensity)),
    };
    setLatestEvent(evt);
    setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("network-pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trees" },
        () => pushEvent("tree_mapped", 0.8)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "offerings" },
        () => pushEvent("offering", 0.6)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookshelf_entries" },
        () => pushEvent("library", 0.5)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pushEvent]);

  // Gentle simulated heartbeat every 8–14s when no real events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const recent = prev.filter((e) => Date.now() - e.timestamp < 10_000);
        if (recent.length === 0) {
          pushEvent("heartbeat", 0.3);
        }
        return prev;
      });
    }, 8000 + Math.random() * 6000);

    return () => clearInterval(interval);
  }, [pushEvent]);

  // Auto-clear old events
  useEffect(() => {
    const cleanup = setInterval(() => {
      setEvents((prev) => prev.filter((e) => Date.now() - e.timestamp < 30_000));
    }, 10_000);
    return () => clearInterval(cleanup);
  }, []);

  return { events, latestEvent, pushEvent };
}
