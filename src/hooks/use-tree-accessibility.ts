/**
 * Resolves a tree's effective accessibility tier for the current viewer.
 * Wraps tree.accessibility_tier + a check against tree_access_grants.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  effectiveTier,
  type AccessibilityTier,
  type EffectiveAccessibilityTier,
} from "@/lib/treeAccessibility";

interface UseTreeAccessibilityArgs {
  treeId?: string | null;
  tier?: AccessibilityTier | null;
  userId?: string | null;
}

interface UseTreeAccessibilityResult {
  tier: EffectiveAccessibilityTier;
  hasGrant: boolean;
  loading: boolean;
}

export function useTreeAccessibility({
  treeId,
  tier,
  userId,
}: UseTreeAccessibilityArgs): UseTreeAccessibilityResult {
  const [hasGrant, setHasGrant] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Only need to look up grants for private trees with a logged-in viewer.
    if (!treeId || !userId || tier !== "private") {
      setHasGrant(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("tree_access_grants")
        .select("id")
        .eq("tree_id", treeId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setHasGrant(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [treeId, userId, tier]);

  return {
    tier: effectiveTier(tier, hasGrant),
    hasGrant,
    loading,
  };
}
