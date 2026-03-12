/**
 * useWitnessSession — manages the lifecycle of a co-witness tree scan session.
 *
 * Supports both initiating and joining sessions, with real-time sync via
 * the existing Companion broadcast channel and Supabase Realtime on the
 * witness_sessions table. Includes environmental snapshot capture.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanion } from "@/contexts/CompanionContext";
import type { WitnessSession, WitnessSessionStatus } from "@/lib/witness-types";
import { WITNESS_PROXIMITY_M, WITNESS_BONUS_HEARTS } from "@/lib/witness-types";
import type {
  TreeHealthSnapshot,
  CanopyLightReading,
  AmbientSoundReading,
  SnapshotQuality,
} from "@/lib/env-snapshot-types";
import { computeSnapshotQuality, getSeasonHint, getDeviceLabel } from "@/lib/env-snapshot-types";
import { computeDualGPS } from "@/lib/env-sensors";

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

async function getGPS(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  if (!("geolocation" in navigator)) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    );
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  } catch {
    return null;
  }
}

export function useWitnessSession(treeId: string) {
  const [session, setSession] = useState<WitnessSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session: companionSession, paired: companionPaired } = useCompanion();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Environmental snapshot state
  const [lightReading, setLightReading] = useState<CanopyLightReading | null>(null);
  const [soundReading, setSoundReading] = useState<AmbientSoundReading | null>(null);

  // Subscribe to realtime changes on the session
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`witness:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "witness_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(payload.new as unknown as WitnessSession);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.id]);

  // Auto-check for witnessed status and award hearts
  useEffect(() => {
    if (
      session?.status === "confirming" &&
      session.initiator_confirmed &&
      session.joiner_confirmed
    ) {
      finalizeSession(session.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.initiator_confirmed, session?.joiner_confirmed, session?.status]);

  /** Build and persist the environmental snapshot before finalizing */
  const buildSnapshot = useCallback(
    (ws: WitnessSession): { snapshot: TreeHealthSnapshot; quality: SnapshotQuality } | null => {
      try {
        const gps =
          ws.initiator_lat != null &&
          ws.joiner_lat != null &&
          ws.initiator_lng != null &&
          ws.joiner_lng != null
            ? computeDualGPS(
                ws.initiator_lat,
                ws.initiator_lng,
                ws.initiator_accuracy_m ?? 30,
                ws.joiner_lat,
                ws.joiner_lng,
                ws.joiner_accuracy_m ?? 30
              )
            : undefined;

        const photos =
          ws.initiator_photos.length > 0 || ws.joiner_photos.length > 0
            ? {
                initiatorCount: ws.initiator_photos.length,
                joinerCount: ws.joiner_photos.length,
                hasCanopyShot: false,
                hasTrunkShot: false,
              }
            : undefined;

        const snapshot: TreeHealthSnapshot = {
          version: 1,
          capturedAt: new Date().toISOString(),
          light: lightReading ?? undefined,
          sound: soundReading ?? undefined,
          gps,
          photos,
          seasonHint: getSeasonHint(ws.initiator_lat ?? undefined),
          devices: {
            initiator: getDeviceLabel(),
            joiner: getDeviceLabel(),
          },
        };

        const quality = computeSnapshotQuality(snapshot);
        return { snapshot, quality };
      } catch {
        return null;
      }
    },
    [lightReading, soundReading]
  );

  const finalizeSession = useCallback(
    async (sessionId: string) => {
      try {
        // Build snapshot from current state
        const snapData = session ? buildSnapshot(session) : null;

        await supabase
          .from("witness_sessions" as any)
          .update({
            status: "witnessed",
            verified_at: new Date().toISOString(),
            hearts_awarded: WITNESS_BONUS_HEARTS,
            ...(snapData
              ? {
                  env_snapshot: snapData.snapshot,
                  snapshot_quality: snapData.quality,
                }
              : {}),
          } as any)
          .eq("id", sessionId);
      } catch {}
    },
    [session, buildSnapshot]
  );

  /** Initiator starts a new session at a tree */
  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error("Sign in to start a witness session");

      const gps = await getGPS();
      if (!gps) throw new Error("Location is required for witness sessions");

      const channelName = companionSession?.channelName || null;

      const { data, error: insertErr } = await supabase
        .from("witness_sessions" as any)
        .insert({
          tree_id: treeId,
          initiator_id: userId,
          companion_channel: channelName,
          initiator_lat: gps.lat,
          initiator_lng: gps.lng,
          initiator_accuracy_m: gps.accuracy,
          status: "waiting",
        } as any)
        .select("*")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      setSession(data as unknown as WitnessSession);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [treeId, companionSession?.channelName]);

  /** Joiner joins an existing session */
  const joinSession = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) throw new Error("Sign in to join a witness session");

        const gps = await getGPS();
        if (!gps) throw new Error("Location is required for witness sessions");

        // Fetch the session to validate proximity
        const { data: existing, error: fetchErr } = await supabase
          .from("witness_sessions" as any)
          .select("*")
          .eq("id", sessionId)
          .single();

        if (fetchErr || !existing) throw new Error("Session not found");

        const ws = existing as unknown as WitnessSession;
        if (ws.status !== "waiting") throw new Error("Session is no longer available");
        if (ws.initiator_id === userId) throw new Error("You cannot join your own session");

        // Proximity check between joiner and initiator
        if (ws.initiator_lat != null && ws.initiator_lng != null) {
          const dist = haversineMeters(gps.lat, gps.lng, ws.initiator_lat, ws.initiator_lng);
          if (dist > WITNESS_PROXIMITY_M) {
            throw new Error(
              `Too far from the other warden (${Math.round(dist)}m away, must be within ${WITNESS_PROXIMITY_M}m)`
            );
          }
        }

        const { data, error: updateErr } = await supabase
          .from("witness_sessions" as any)
          .update({
            joiner_id: userId,
            joiner_lat: gps.lat,
            joiner_lng: gps.lng,
            joiner_accuracy_m: gps.accuracy,
            status: "joined",
          } as any)
          .eq("id", sessionId)
          .select("*")
          .single();

        if (updateErr) throw new Error(updateErr.message);
        setSession(data as unknown as WitnessSession);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Find an active session at a tree that the user can join */
  const findNearbySession = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("witness_sessions" as any)
        .select("*")
        .eq("tree_id", treeId)
        .eq("status", "waiting")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && (data as any[]).length > 0) {
        return data[0] as unknown as WitnessSession;
      }
      return null;
    } catch {
      return null;
    }
  }, [treeId]);

  /** Confirm your side of the witness */
  const confirmWitness = useCallback(async () => {
    if (!session) return;
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const isInitiator = userId === session.initiator_id;
      const updateField = isInitiator ? "initiator_confirmed" : "joiner_confirmed";

      // Move to confirming status if in joined
      const statusUpdate = session.status === "joined" ? { status: "confirming" } : {};

      await supabase
        .from("witness_sessions" as any)
        .update({
          [updateField]: true,
          ...statusUpdate,
        } as any)
        .eq("id", session.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  /** Cancel the session */
  const cancelSession = useCallback(async () => {
    if (!session) return;
    await supabase
      .from("witness_sessions" as any)
      .update({ status: "cancelled" } as any)
      .eq("id", session.id);
    setSession(null);
  }, [session]);

  return {
    session,
    loading,
    error,
    startSession,
    joinSession,
    findNearbySession,
    confirmWitness,
    cancelSession,
    companionPaired,
    clearError: () => setError(null),
    // Environmental sensing
    lightReading,
    soundReading,
    setLightReading,
    setSoundReading,
  };
}
