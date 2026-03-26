/**
 * useTreeProximityGate — gates offerings & whispers behind physical presence.
 *
 * Logic:
 * 1. If user is currently near the tree (< 500m) → unlocked, visit timestamp saved.
 * 2. If user visited this tree within 12 hours → unlocked (grace period).
 * 3. Otherwise → locked.
 *
 * Uses the same proximity radius as tree check-ins (500m).
 * Visit timestamps stored per-user-per-tree in localStorage.
 */
import { useState, useEffect, useCallback, useMemo } from "react";

const GRACE_HOURS = 12;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;
const PROXIMITY_M = 500;
const STORE_KEY = "s33d-tree-visits";

export type GateStatus = "checking" | "unlocked_present" | "unlocked_grace" | "locked" | "no_location";

interface VisitRecord {
  [treeId: string]: number; // timestamp ms
}

function getVisits(): VisitRecord {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVisit(treeId: string) {
  const visits = getVisits();
  visits[treeId] = Date.now();
  // Prune old entries (keep last 200)
  const entries = Object.entries(visits).sort((a, b) => b[1] - a[1]).slice(0, 200);
  localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function getGraceRemaining(treeId: string): number {
  const visits = getVisits();
  const lastVisit = visits[treeId];
  if (!lastVisit) return 0;
  const remaining = GRACE_MS - (Date.now() - lastVisit);
  return Math.max(0, remaining);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseTreeProximityGateOptions {
  treeId: string | undefined;
  treeLat: number | null | undefined;
  treeLng: number | null | undefined;
  userId: string | null;
}

export function useTreeProximityGate({ treeId, treeLat, treeLng, userId }: UseTreeProximityGateOptions) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [graceMs, setGraceMs] = useState(0);

  const checkProximity = useCallback(async () => {
    if (!treeId) { setStatus("locked"); return; }

    // First check grace period (fast, no geo needed)
    const remaining = getGraceRemaining(treeId);
    if (remaining > 0) {
      setGraceMs(remaining);
      setStatus("unlocked_grace");
    }

    // If tree has no coordinates, fall back to grace only
    if (!treeLat || !treeLng) {
      if (remaining > 0) return; // already set grace
      setStatus("no_location");
      return;
    }

    // Check if we even have geo permission before prompting
    if (!navigator.geolocation) {
      if (remaining > 0) return;
      setStatus("no_location");
      return;
    }

    try {
      // Only use cached/quick position — don't prompt if not granted
      const permStatus = await navigator.permissions?.query({ name: "geolocation" }).catch(() => null);
      if (permStatus && permStatus.state === "denied") {
        if (remaining <= 0) setStatus("no_location");
        return;
      }

      // Use a short timeout to get position quickly
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 120000, // accept 2-min cached position
        })
      );

      const dist = haversine(pos.coords.latitude, pos.coords.longitude, treeLat, treeLng);
      if (dist < PROXIMITY_M) {
        saveVisit(treeId);
        setGraceMs(GRACE_MS);
        setStatus("unlocked_present");
        return;
      }
    } catch {
      // Geo failed — rely on grace
    }

    // Not near tree — check grace one more time
    if (remaining > 0) return; // already set
    setStatus("locked");
  }, [treeId, treeLat, treeLng]);

  useEffect(() => {
    checkProximity();
  }, [checkProximity]);

  // Update grace countdown every minute
  useEffect(() => {
    if (status !== "unlocked_grace") return;
    const interval = setInterval(() => {
      if (!treeId) return;
      const remaining = getGraceRemaining(treeId);
      if (remaining <= 0) {
        setStatus("locked");
        setGraceMs(0);
      } else {
        setGraceMs(remaining);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [status, treeId]);

  const graceLabel = useMemo(() => {
    if (graceMs <= 0) return null;
    const hours = Math.floor(graceMs / (60 * 60 * 1000));
    const mins = Math.floor((graceMs % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  }, [graceMs]);

  const isUnlocked = status === "unlocked_present" || status === "unlocked_grace" || status === "no_location";

  /** Call when a check-in or visit happens elsewhere to immediately unlock */
  const recordVisitNow = useCallback(() => {
    if (!treeId) return;
    saveVisit(treeId);
    setGraceMs(GRACE_MS);
    setStatus("unlocked_present");
  }, [treeId]);

  return {
    status,
    isUnlocked,
    graceLabel,
    graceMs,
    recordVisitNow,
    recheckProximity: checkProximity,
  };
}
