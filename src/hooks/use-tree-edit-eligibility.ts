/**
 * useTreeEditEligibility — single shared rule for "may this person change this tree?"
 *
 * The rule lives in the database (public.tree_edit_eligibility) and is enforced
 * again on every write, so hiding a button is never the protection.
 *
 * Direct editing is allowed only when BOTH are true:
 *   - the signed-in person created the tree entry, AND
 *   - nobody else has contributed to its digital twin.
 *
 * Contributions are read from the append-only `tree_growth_events` ledger, so
 * deleting a contribution never silently restores unilateral editing rights.
 * Curators and keepers may always edit directly (existing review authority).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TreeEditEligibility {
  exists: boolean;
  signed_in: boolean;
  is_creator: boolean;
  is_curator: boolean;
  other_contributors: number;
  merged: boolean;
  can_direct_edit: boolean;
  tree_updated_at: string | null;
  reason:
    | "signed_out"
    | "curator"
    | "not_creator"
    | "others_contributed"
    | "creator_sole"
    | "merged";
}

const FALLBACK: TreeEditEligibility = {
  exists: false,
  signed_in: false,
  is_creator: false,
  is_curator: false,
  other_contributors: 0,
  merged: false,
  can_direct_edit: false,
  tree_updated_at: null,
  reason: "signed_out",
};

export async function fetchTreeEditEligibility(
  treeId: string,
): Promise<TreeEditEligibility> {
  const { data, error } = await (supabase.rpc as any)("tree_edit_eligibility", {
    _tree_id: treeId,
  });
  if (error || !data) return FALLBACK;
  return { ...FALLBACK, ...(data as Partial<TreeEditEligibility>) };
}

export function useTreeEditEligibility(treeId: string | undefined) {
  const [eligibility, setEligibility] = useState<TreeEditEligibility>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!treeId) {
      setLoading(false);
      return FALLBACK;
    }
    const next = await fetchTreeEditEligibility(treeId);
    setEligibility(next);
    setLoading(false);
    return next;
  }, [treeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!treeId) {
      setLoading(false);
      return;
    }
    fetchTreeEditEligibility(treeId).then((next) => {
      if (cancelled) return;
      setEligibility(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  return { eligibility, loading, refresh };
}
