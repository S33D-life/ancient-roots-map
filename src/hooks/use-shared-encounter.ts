import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  generatePairingCode,
  channelFromCode,
  SESSION_TTL_MS,
  type SharedEncounterState,
} from "@/lib/companion-types";

type RealtimeChannel = ReturnType<typeof supabase.channel>;

const PAIR_TIMEOUT_MS = 15_000;

interface EncounterSession {
  code: string;
  channelName: string;
  role: "host" | "guest";
  paired: boolean;
}

export function useSharedEncounter() {
  const [session, setSession] = useState<EncounterSession | null>(null);
  const [encounter, setEncounter] = useState<SharedEncounterState | null>(null);
  const [pairTimedOut, setPairTimedOut] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    [expiryRef, pairTimeoutRef].forEach((ref) => {
      if (ref.current) { clearTimeout(ref.current); ref.current = null; }
    });
    setSession(null);
    setEncounter(null);
    setPairTimedOut(false);
  }, []);

  /** Host: create an encounter session at a tree */
  const hostEncounter = useCallback(
    (treeId: string, treeName: string, hostUser: { userId: string; displayName: string }) => {
      cleanup();
      const code = generatePairingCode();
      const channelName = `encounter:${code}`;

      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "join_encounter" }, ({ payload }) => {
          const guest = payload as { userId: string; displayName: string };
          const state: SharedEncounterState = {
            treeId,
            treeName,
            participants: [hostUser, guest],
            startedAt: Date.now(),
            heartsMultiplier: 3,
            verified: true,
          };
          setEncounter(state);
          setSession((s) => s ? { ...s, paired: true } : s);
          if (pairTimeoutRef.current) { clearTimeout(pairTimeoutRef.current); pairTimeoutRef.current = null; }
          channel.send({ type: "broadcast", event: "encounter_state", payload: state });
        })
        .on("broadcast", { event: "leave_encounter" }, () => { cleanup(); })
        .subscribe();

      channelRef.current = channel;
      setSession({ code, channelName, role: "host", paired: false });
      expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
      pairTimeoutRef.current = setTimeout(() => setPairTimedOut(true), PAIR_TIMEOUT_MS);
    },
    [cleanup],
  );

  /** Guest: join an encounter by code */
  const joinEncounter = useCallback(
    (code: string, guestUser: { userId: string; displayName: string }): boolean => {
      cleanup();
      const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (normalized.length !== 6) return false;

      const channelName = `encounter:${normalized}`;
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "encounter_state" }, ({ payload }) => {
          setEncounter(payload as SharedEncounterState);
          setSession((s) => s ? { ...s, paired: true } : s);
          if (pairTimeoutRef.current) { clearTimeout(pairTimeoutRef.current); pairTimeoutRef.current = null; }
        })
        .on("broadcast", { event: "leave_encounter" }, () => { cleanup(); })
        .subscribe(() => {
          channel.send({ type: "broadcast", event: "join_encounter", payload: guestUser });
        });

      channelRef.current = channel;
      setSession({ code: normalized, channelName, role: "guest", paired: false });
      setPairTimedOut(false);
      pairTimeoutRef.current = setTimeout(() => setPairTimedOut(true), PAIR_TIMEOUT_MS);
      expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
      return true;
    },
    [cleanup],
  );

  const leave = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "leave_encounter", payload: {} });
    setTimeout(cleanup, 100);
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return {
    session,
    encounter,
    paired: session?.paired ?? false,
    pairTimedOut,
    hostEncounter,
    joinEncounter,
    leave,
  };
}
