import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Referral {
  id: string;
  inviter_id: string;
  invitee_id: string;
  invite_link_id: string | null;
  created_at: string;
}

export interface ReferralWithProfile extends Referral {
  invitee_name: string | null;
  invitee_avatar: string | null;
  invitee_trees: number;
}

export function useReferrals(userId: string | undefined) {
  const [referrals, setReferrals] = useState<ReferralWithProfile[]>([]);
  const [referredBy, setReferredBy] = useState<{ name: string | null; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch people I referred
    const { data: myReferrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false });

    // Fetch who referred me
    const { data: myReferrer } = await supabase
      .from("referrals")
      .select("*")
      .eq("invitee_id", userId)
      .maybeSingle();

    // Enrich with profiles and tree counts
    if (myReferrals && myReferrals.length > 0) {
      const inviteeIds = myReferrals.map((r: any) => r.invitee_id);
      
      const [profilesRes, treesRes] = await Promise.all([
        supabase.rpc("get_safe_profiles", { p_ids: inviteeIds }),
        supabase.from("trees").select("created_by").in("created_by", inviteeIds),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => { profileMap[p.id] = p; });

      const treeCountMap: Record<string, number> = {};
      (treesRes.data || []).forEach((t: any) => {
        treeCountMap[t.created_by] = (treeCountMap[t.created_by] || 0) + 1;
      });

      setReferrals(
        myReferrals.map((r: any) => ({
          ...r,
          invitee_name: profileMap[r.invitee_id]?.full_name || null,
          invitee_avatar: profileMap[r.invitee_id]?.avatar_url || null,
          invitee_trees: treeCountMap[r.invitee_id] || 0,
        }))
      );
    } else {
      setReferrals([]);
    }

    if (myReferrer) {
      const { data: referrerProfiles } = await supabase
        .rpc("get_safe_profiles", { p_ids: [(myReferrer as any).inviter_id] });
      const referrerProfile = referrerProfiles?.[0] || null;
      setReferredBy({
        id: (myReferrer as any).inviter_id,
        name: referrerProfile?.full_name || null,
      });
    } else {
      setReferredBy(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const totalTreesFromReferrals = referrals.reduce((sum, r) => sum + r.invitee_trees, 0);

  return { referrals, referredBy, loading, refresh: fetchReferrals, totalTreesFromReferrals };
}

/**
 * Record a referral after signup. Call once after the user creates an account.
 */
export async function recordReferral(inviteeId: string, inviteCode: string) {
  const { data, error } = await supabase.rpc("record_referral_secure", {
    p_invitee_id: inviteeId,
    p_invite_code: inviteCode,
  });

  if (error) return { error: error.message };
  const result = data as { error: string | null };
  return { error: result?.error || null };
}
