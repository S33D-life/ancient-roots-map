/**
 * useRefinementTrail — read-only unified view of a tree's evolution.
 *
 * Fetches the several refinement source tables independently (each is resilient:
 * an RLS-blocked or empty source simply contributes nothing), normalises them via
 * the pure helpers in `utils/refinementTrail`, resolves actor display names from
 * `profiles`, and returns one newest-first chronological list.
 *
 * READ-ONLY: this hook never writes. No schema changes.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fromEditHistory,
  fromChangeLog,
  fromProposals,
  fromLocationHistory,
  fromMergeHistory,
  mergeTrail,
  type RefinementTrailEntry,
  type EditHistoryRow,
  type ChangeLogRow,
  type ProposalRow,
  type LocationHistoryRow,
  type MergeHistoryRow,
} from "@/utils/refinementTrail";

interface RefinementTrailState {
  entries: RefinementTrailEntry[];
  /** actorId → display name (best-effort; falls back to "A wanderer"). */
  names: Record<string, string>;
  loading: boolean;
}

/** Fetch rows from one source table; never throws — returns [] on any error. */
async function safeRows<T>(
  table: string,
  treeColumn: string,
  treeId: string,
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .eq(treeColumn, treeId)
      .limit(200);
    if (error) return [];
    return (data as unknown as T[]) ?? [];
  } catch {
    return [];
  }
}

export function useRefinementTrail(treeId: string | undefined): RefinementTrailState {
  const [state, setState] = useState<RefinementTrailState>({
    entries: [],
    names: {},
    loading: true,
  });

  useEffect(() => {
    if (!treeId) {
      setState({ entries: [], names: {}, loading: false });
      return;
    }
    let cancelled = false;

    (async () => {
      setState((s) => ({ ...s, loading: true }));

      // Merge history is keyed by primary_tree_id; the rest by tree_id.
      const [edits, changes, proposals, locations, merges] = await Promise.all([
        safeRows<EditHistoryRow>("tree_edit_history", "tree_id", treeId),
        safeRows<ChangeLogRow>("tree_change_log", "tree_id", treeId),
        safeRows<ProposalRow>("tree_edit_proposals", "tree_id", treeId),
        safeRows<LocationHistoryRow>("tree_location_history", "tree_id", treeId),
        safeRows<MergeHistoryRow>("tree_merge_history", "primary_tree_id", treeId),
      ]);

      if (cancelled) return;

      const entries = mergeTrail(
        fromEditHistory(edits),
        fromChangeLog(changes),
        fromProposals(proposals),
        fromLocationHistory(locations),
        fromMergeHistory(merges),
      );

      // Resolve actor + reviewer display names in one batched query.
      const ids = new Set<string>();
      for (const e of entries) {
        if (e.actorId) ids.add(e.actorId);
        const reviewer = e.meta?.reviewerId;
        if (typeof reviewer === "string") ids.add(reviewer);
      }

      let names: Record<string, string> = {};
      if (ids.size > 0) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", [...ids]);
          names = Object.fromEntries(
            (data ?? []).map((p: { id: string; full_name: string | null }) => [
              p.id,
              p.full_name || "A wanderer",
            ]),
          );
        } catch {
          names = {};
        }
      }

      if (cancelled) return;
      setState({ entries, names, loading: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [treeId]);

  return state;
}
