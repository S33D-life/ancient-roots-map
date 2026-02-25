import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reusable wish toggle for any tree. Uses the existing tree_wishlist table.
 */
export function useWishToggle(treeId: string | null) {
  const [isWished, setIsWished] = useState(false);
  const [wishId, setWishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // Check if tree is in wishlist
  useEffect(() => {
    if (!userId || !treeId) { setIsWished(false); setWishId(null); return; }

    supabase
      .from("tree_wishlist")
      .select("id")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setIsWished(true);
          setWishId(data[0].id);
        } else {
          setIsWished(false);
          setWishId(null);
        }
      });
  }, [userId, treeId]);

  const toggle = useCallback(async () => {
    if (!userId || !treeId) return;
    setLoading(true);

    if (isWished && wishId) {
      await supabase.from("tree_wishlist").delete().eq("id", wishId);
      setIsWished(false);
      setWishId(null);
    } else {
      const { data } = await supabase
        .from("tree_wishlist")
        .insert({ user_id: userId, tree_id: treeId })
        .select("id")
        .single();
      if (data) {
        setIsWished(true);
        setWishId(data.id);
      }
    }

    setLoading(false);
  }, [userId, treeId, isWished, wishId]);

  return { isWished, toggle, loading, isLoggedIn: !!userId };
}
