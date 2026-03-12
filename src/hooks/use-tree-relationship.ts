/**
 * useTreeRelationship — computes the user's relationship tier
 * with a specific tree from existing check-ins, offerings,
 * stewardship actions, and co-witness sessions.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeRelationship, type RelationshipProgress } from "@/lib/relationship-types";

export function useTreeRelationship(treeId: string | undefined, userId: string | null) {
  const [progress, setProgress] = useState<RelationshipProgress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!treeId || !userId) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        // Parallel queries for all activity signals
        const [checkinsRes, offeringsRes, stewardshipRes, witnessRes] = await Promise.all([
          // Check-ins (visits)
          supabase
            .from("tree_checkins")
            .select("id, checked_in_at")
            .eq("tree_id", treeId!)
            .eq("user_id", userId!)
            .order("checked_in_at", { ascending: true }),

          // Offerings count
          supabase
            .from("offerings")
            .select("id", { count: "exact", head: true })
            .eq("tree_id", treeId!)
            .eq("created_by", userId!),

          // Stewardship offerings specifically
          supabase
            .from("offerings")
            .select("id", { count: "exact", head: true })
            .eq("tree_id", treeId!)
            .eq("created_by", userId!)
            .eq("tree_role", "stewardship"),

          // Co-witness sessions (as either initiator or joiner)
          supabase
            .from("witness_sessions" as any)
            .select("id", { count: "exact", head: true })
            .eq("tree_id", treeId!)
            .eq("status", "witnessed")
            .or(`initiator_id.eq.${userId},joiner_id.eq.${userId}`),
        ]);

        if (cancelled) return;

        const checkins = checkinsRes.data || [];
        const totalVisits = checkins.length;
        const firstVisitDate = checkins.length > 0 ? checkins[0].checked_in_at : null;
        const latestVisitDate = checkins.length > 0 ? checkins[checkins.length - 1].checked_in_at : null;
        const offeringCount = offeringsRes.count || 0;
        const stewardshipActions = stewardshipRes.count || 0;
        const coWitnessCount = witnessRes.count || 0;

        const result = computeRelationship({
          totalVisits,
          offeringCount,
          stewardshipActions,
          coWitnessCount,
          firstVisitDate,
          latestVisitDate,
        });

        if (!cancelled) setProgress(result);
      } catch {
        // Silent fail — non-critical feature
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [treeId, userId]);

  return { progress, loading };
}
