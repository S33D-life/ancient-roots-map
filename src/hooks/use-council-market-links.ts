import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CouncilMarketLink {
  id: string;
  council_id: string;
  market_id: string;
  linked_by: string;
  notes: string | null;
  created_at: string;
}

export function useCouncilMarketLinks(marketId?: string, councilId?: string) {
  const [links, setLinks] = useState<CouncilMarketLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!marketId && !councilId) return;
    setLoading(true);
    let q = supabase.from("council_market_links").select("*");
    if (marketId) q = q.eq("market_id", marketId);
    if (councilId) q = q.eq("council_id", councilId);
    const { data } = await q;
    setLinks((data as CouncilMarketLink[]) || []);
    setLoading(false);
  }, [marketId, councilId]);

  useEffect(() => { fetch(); }, [fetch]);

  const linkMarketToCouncil = async (mId: string, cId: string, userId: string, notes?: string) => {
    const { error } = await supabase.from("council_market_links").insert({
      market_id: mId,
      council_id: cId,
      linked_by: userId,
      notes: notes || null,
    });
    if (!error) fetch();
    return error;
  };

  return { links, loading, refetch: fetch, linkMarketToCouncil };
}
