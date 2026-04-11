/**
 * Hook to fetch the current user's invitation allowance.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvitationAllowance {
  invitesRemaining: number;
  invitesSent: number;
  invitesAccepted: number;
  invitedByUserId: string | null;
  lineageStaffId: string | null;
}

export function useInvitationAllowance(userId: string | null | undefined) {
  const [data, setData] = useState<InvitationAllowance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setData(null); setLoading(false); return; }
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("invites_remaining, invites_sent, invites_accepted, invited_by_user_id, lineage_staff_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      setData({
        invitesRemaining: (profile as any).invites_remaining ?? 144,
        invitesSent: (profile as any).invites_sent ?? 0,
        invitesAccepted: (profile as any).invites_accepted ?? 0,
        invitedByUserId: (profile as any).invited_by_user_id ?? null,
        lineageStaffId: (profile as any).lineage_staff_id ?? null,
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { allowance: data, loading, refetch: fetch };
}
