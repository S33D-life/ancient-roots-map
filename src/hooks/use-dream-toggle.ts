import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reusable dream toggle for any tree. Uses the tree_wishlist table (Dream Tree system).
 */
export function useDreamToggle(treeId: string | null) {
  const [isDreamed, setIsDreamed] = useState(false);
  const [dreamId, setDreamId] = useState<string | null>(null);
  const [dreamStatus, setDreamStatus] = useState<"dreamed" | "planned" | "visited">("dreamed");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // Check if tree is dreamed
  useEffect(() => {
    if (!userId || !treeId) { setIsDreamed(false); setDreamId(null); return; }

    supabase
      .from("tree_wishlist")
      .select("id, status")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setIsDreamed(true);
          setDreamId(data[0].id);
          setDreamStatus((data[0] as any).status || "dreamed");
        } else {
          setIsDreamed(false);
          setDreamId(null);
        }
      });
  }, [userId, treeId]);

  const toggle = useCallback(async () => {
    if (!userId || !treeId) return;
    setLoading(true);

    if (isDreamed && dreamId) {
      await supabase.from("tree_wishlist").delete().eq("id", dreamId);
      setIsDreamed(false);
      setDreamId(null);
    } else {
      const { data } = await supabase
        .from("tree_wishlist")
        .insert({ user_id: userId, tree_id: treeId, status: "dreamed" } as any)
        .select("id")
        .single();
      if (data) {
        setIsDreamed(true);
        setDreamId(data.id);
        setDreamStatus("dreamed");
      }
    }

    setLoading(false);
  }, [userId, treeId, isDreamed, dreamId]);

  const updateStatus = useCallback(async (status: "dreamed" | "planned" | "visited") => {
    if (!dreamId) return;
    await supabase.from("tree_wishlist").update({ status } as any).eq("id", dreamId);
    setDreamStatus(status);
  }, [dreamId]);

  return { isDreamed, dreamStatus, toggle, updateStatus, loading, isLoggedIn: !!userId };
}

/** @deprecated Use useDreamToggle instead */
export const useWishToggle = useDreamToggle;
