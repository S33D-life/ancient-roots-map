import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TreeSource {
  id: string;
  tree_id: string;
  research_tree_id: string | null;
  source_title: string;
  source_type: string;
  url: string | null;
  description: string | null;
  submitted_by: string | null;
  submitted_at: string;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  contributor_name: string | null;
}

export function useTreeSources(treeId?: string, researchTreeId?: string) {
  const [sources, setSources] = useState<TreeSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!treeId && !researchTreeId) { setSources([]); setLoading(false); return; }
    setLoading(true);
    let query = (supabase.from as any)("tree_sources_public").select("*");
    if (treeId) query = query.eq("tree_id", treeId);
    if (researchTreeId) query = query.eq("research_tree_id", researchTreeId);
    query = query.order("submitted_at", { ascending: false });
    const { data } = await query;
    setSources((data as TreeSource[]) || []);
    setLoading(false);
  }, [treeId, researchTreeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const verified = sources.filter(s => s.verification_status === "verified");
  const pending = sources.filter(s => s.verification_status === "pending");

  return { sources, verified, pending, loading, refetch: fetch };
}
