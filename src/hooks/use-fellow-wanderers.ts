import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WandererProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_discoverable: boolean;
}

export interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface CompanionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export function useFollows(userId: string | undefined) {
  const [following, setFollowing] = useState<FollowRelation[]>([]);
  const [followers, setFollowers] = useState<FollowRelation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fing, fers] = await Promise.all([
      supabase.from("follows").select("*").eq("follower_id", userId),
      supabase.from("follows").select("*").eq("following_id", userId),
    ]);
    setFollowing((fing.data as FollowRelation[]) || []);
    setFollowers((fers.data as FollowRelation[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const follow = async (targetId: string) => {
    if (!userId) return;
    await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
    fetch();
  };

  const unfollow = async (targetId: string) => {
    if (!userId) return;
    await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
    fetch();
  };

  const isFollowing = (targetId: string) => following.some((f) => f.following_id === targetId);

  return { following, followers, loading, follow, unfollow, isFollowing, refresh: fetch };
}

export function useCompanions(userId: string | undefined) {
  const [companions, setCompanions] = useState<CompanionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("grove_companions").select("*").or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
    setCompanions((data as CompanionRequest[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const sendRequest = async (recipientId: string) => {
    if (!userId) return;
    await supabase.from("grove_companions").insert({ requester_id: userId, recipient_id: recipientId });
    fetch();
  };

  const respond = async (requestId: string, accept: boolean) => {
    await supabase.from("grove_companions").update({ status: accept ? "accepted" : "declined" }).eq("id", requestId);
    fetch();
  };

  const remove = async (requestId: string) => {
    await supabase.from("grove_companions").delete().eq("id", requestId);
    fetch();
  };

  const isCompanion = (targetId: string) =>
    companions.some(
      (c) =>
        c.status === "accepted" &&
        (c.requester_id === targetId || c.recipient_id === targetId)
    );

  const pendingFor = (targetId: string) =>
    companions.find(
      (c) =>
        c.status === "pending" &&
        (c.requester_id === targetId || c.recipient_id === targetId)
    );

  return { companions, loading, sendRequest, respond, remove, isCompanion, pendingFor, refresh: fetch };
}

export function useWandererSearch() {
  const [results, setResults] = useState<WandererProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .rpc("search_discoverable_profiles", { search_query: query, result_limit: 20 });
    setResults((data as WandererProfile[]) || []);
    setSearching(false);
  }, []);

  return { results, searching, search, clearResults: () => setResults([]) };
}
