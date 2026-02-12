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
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", inviteeIds),
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
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", (myReferrer as any).inviter_id)
        .maybeSingle();
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
  // Look up the invite link
  const { data: link } = await supabase
    .from("invite_links")
    .select("id, created_by")
    .eq("code", inviteCode)
    .maybeSingle();

  if (!link) return { error: "Invalid invite code" };

  // Don't self-refer
  if (link.created_by === inviteeId) return { error: "Cannot refer yourself" };

  const { error } = await supabase.from("referrals").insert({
    inviter_id: link.created_by,
    invitee_id: inviteeId,
    invite_link_id: link.id,
  });

  if (error?.code === "23505") return { error: "Already referred" }; // unique constraint
  return { error: error?.message || null };
}
