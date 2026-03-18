/**
 * useTreeEditPermission — determines the user's editing role for a given tree.
 * Returns { role, canDirectEdit, loading }.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TreeEditRole = "creator" | "steward" | "contributor" | "anonymous";

interface TreeEditPermission {
  role: TreeEditRole;
  canDirectEdit: boolean;
  loading: boolean;
  userId: string | null;
}

export function useTreeEditPermission(treeId: string | undefined): TreeEditPermission {
  const [role, setRole] = useState<TreeEditRole>("anonymous");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!treeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setRole("anonymous");
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Check via the server-side SECURITY DEFINER function
      const { data: canEdit } = await supabase.rpc("can_edit_tree", {
        _user_id: user.id,
        _tree_id: treeId,
      });

      if (cancelled) return;

      if (canEdit) {
        // Determine if creator or steward
        const { data: tree } = await supabase
          .from("trees")
          .select("created_by")
          .eq("id", treeId)
          .maybeSingle();

        if (cancelled) return;

        if (tree?.created_by === user.id) {
          setRole("creator");
        } else {
          setRole("steward");
        }
      } else {
        setRole("contributor");
      }

      setLoading(false);
    };

    check();
    return () => { cancelled = true; };
  }, [treeId]);

  return {
    role,
    canDirectEdit: role === "creator" || role === "steward",
    loading,
    userId,
  };
}
