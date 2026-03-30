/**
 * useTreeCheckinStatus — unified status model for a user's relationship
 * with a specific tree, combining check-in history and proximity gate.
 *
 * Status light model:
 *   red     = never checked in here
 *   orange  = checked in before, but no active offering window
 *   green   = active (within 12h grace / currently present)
 *   flashing_green = less than 1 hour remains in offering window
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GateStatus } from "@/hooks/use-tree-proximity-gate";

export type CheckinLight = "red" | "orange" | "green" | "flashing_green";

export interface TreeCheckinStatus {
  light: CheckinLight;
  /** Has the user ever checked in at this tree? */
  hasVisited: boolean;
  /** Total user visits to this tree */
  userVisits: number;
  /** Last check-in timestamp */
  lastCheckin: string | null;
  /** Is user currently mapped as creator of this tree? */
  isMappedByUser: boolean;
  /** Loading state */
  loading: boolean;
}

interface UseTreeCheckinStatusOptions {
  treeId: string | undefined;
  userId: string | null;
  createdBy: string | null | undefined;
  /** From useTreeProximityGate */
  gateStatus: GateStatus;
  /** Remaining grace ms from proximity gate */
  graceMs: number;
}

export function useTreeCheckinStatus({
  treeId,
  userId,
  createdBy,
  gateStatus,
  graceMs,
}: UseTreeCheckinStatusOptions): TreeCheckinStatus {
  const [hasVisited, setHasVisited] = useState(false);
  const [userVisits, setUserVisits] = useState(0);
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!treeId || !userId) {
      setLoading(false);
      return;
    }

    supabase
      .from("tree_checkins")
      .select("checked_in_at")
      .eq("tree_id", treeId)
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const visits = data?.length || 0;
        setUserVisits(visits);
        setHasVisited(visits > 0);
        setLastCheckin(data?.[0]?.checked_in_at || null);
        setLoading(false);
      });
  }, [treeId, userId]);

  const isMappedByUser = !!(userId && createdBy && userId === createdBy);

  // Derive the status light
  let light: CheckinLight = "red";

  if (!hasVisited && !isMappedByUser) {
    light = "red";
  } else if (gateStatus === "unlocked_present" || gateStatus === "unlocked_grace" || gateStatus === "no_location") {
    // Active offering window
    if (graceMs > 0 && graceMs < 60 * 60 * 1000) {
      light = "flashing_green";
    } else {
      light = "green";
    }
  } else {
    // Has visited before but no active window
    light = "orange";
  }

  return { light, hasVisited, userVisits, lastCheckin, isMappedByUser, loading };
}
