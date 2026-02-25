import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const MARKET_SEEDS_PER_DAY = 3;
const GIFT_SEEDS_PER_DAY = 3;

interface MarketSeedStake {
  id: string;
  user_id: string;
  market_id: string;
  outcome_id: string;
  seeds_count: number;
  staked_at: string;
  hearts_earned: number | null;
  resolved_at: string | null;
}

interface GiftSeed {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  invite_code: string | null;
  seeds_count: number;
  message: string | null;
  created_at: string;
  activated_at: string | null;
  hearts_earned: number | null;
}

function getLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export function useMarketSeeds(userId: string | null) {
  const [stakes, setStakes] = useState<MarketSeedStake[]>([]);
  const [gifts, setGifts] = useState<GiftSeed[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<GiftSeed[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const midnight = getLocalMidnight().toISOString();

    const [stakesRes, giftsRes, receivedRes] = await Promise.all([
      supabase.from("market_seed_stakes").select("*").eq("user_id", userId),
      supabase.from("gift_seeds").select("*").eq("sender_id", userId),
      supabase.from("gift_seeds").select("*").eq("recipient_id", userId),
    ]);

    setStakes((stakesRes.data || []) as MarketSeedStake[]);
    setGifts((giftsRes.data || []) as GiftSeed[]);
    setReceivedGifts((receivedRes.data || []) as GiftSeed[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const midnight = getLocalMidnight();

  // Count seeds used today
  const marketSeedsUsedToday = stakes.filter(s =>
    new Date(s.staked_at) >= midnight
  ).reduce((sum, s) => sum + s.seeds_count, 0);

  const giftSeedsUsedToday = gifts.filter(g =>
    new Date(g.created_at) >= midnight
  ).reduce((sum, g) => sum + g.seeds_count, 0);

  const marketSeedsRemaining = Math.max(0, MARKET_SEEDS_PER_DAY - marketSeedsUsedToday);
  const giftSeedsRemaining = Math.max(0, GIFT_SEEDS_PER_DAY - giftSeedsUsedToday);

  // Stake seeds on a market outcome
  const stakeSeed = useCallback(async (
    marketId: string,
    outcomeId: string,
    count: number = 1
  ): Promise<boolean> => {
    if (!userId || count <= 0 || count > marketSeedsRemaining) return false;

    const { error } = await supabase.from("market_seed_stakes").insert({
      user_id: userId,
      market_id: marketId,
      outcome_id: outcomeId,
      seeds_count: count,
    });

    if (error) {
      console.error("Error staking seed:", error);
      return false;
    }

    await refresh();
    return true;
  }, [userId, marketSeedsRemaining, refresh]);

  // Send gift seeds to an existing user
  const sendGiftToUser = useCallback(async (
    recipientId: string,
    count: number = 1,
    message?: string
  ): Promise<boolean> => {
    if (!userId || count <= 0 || count > giftSeedsRemaining) return false;

    const { error } = await supabase.from("gift_seeds").insert({
      sender_id: userId,
      recipient_id: recipientId,
      seeds_count: count,
      message: message || null,
    });

    if (error) {
      console.error("Error sending gift:", error);
      return false;
    }

    await refresh();
    return true;
  }, [userId, giftSeedsRemaining, refresh]);

  // Generate an invite-link gift seed
  const sendGiftViaInvite = useCallback(async (
    count: number = 1,
    message?: string
  ): Promise<string | null> => {
    if (!userId || count <= 0 || count > giftSeedsRemaining) return null;

    const code = crypto.randomUUID().slice(0, 12);

    const { error } = await supabase.from("gift_seeds").insert({
      sender_id: userId,
      invite_code: code,
      seeds_count: count,
      message: message || null,
    });

    if (error) {
      console.error("Error creating gift invite:", error);
      return null;
    }

    await refresh();
    return code;
  }, [userId, giftSeedsRemaining, refresh]);

  // Activate received gift (converts to hearts)
  const activateGift = useCallback(async (giftId: string): Promise<boolean> => {
    if (!userId) return false;

    const gift = receivedGifts.find(g => g.id === giftId);
    if (!gift || gift.activated_at) return false;

    const { error } = await supabase
      .from("gift_seeds")
      .update({
        activated_at: new Date().toISOString(),
        hearts_earned: gift.seeds_count, // 1:1 on activation
      })
      .eq("id", giftId);

    if (error) return false;

    await refresh();
    return true;
  }, [userId, receivedGifts, refresh]);

  // Get user's stakes for a specific market
  const getStakesForMarket = useCallback((marketId: string) => {
    return stakes.filter(s => s.market_id === marketId);
  }, [stakes]);

  // Total hearts earned from market seeds
  const totalMarketHeartsEarned = stakes
    .filter(s => s.hearts_earned != null)
    .reduce((sum, s) => sum + (s.hearts_earned || 0), 0);

  // Total hearts earned from gift seeds
  const totalGiftHeartsEarned = gifts
    .filter(g => g.hearts_earned != null)
    .reduce((sum, g) => sum + (g.hearts_earned || 0), 0);

  // Unactivated received gifts
  const pendingGifts = receivedGifts.filter(g => !g.activated_at);

  return {
    loading,
    marketSeedsRemaining,
    giftSeedsRemaining,
    marketSeedsUsedToday,
    giftSeedsUsedToday,
    stakes,
    gifts,
    receivedGifts,
    pendingGifts,
    stakeSeed,
    sendGiftToUser,
    sendGiftViaInvite,
    activateGift,
    getStakesForMarket,
    totalMarketHeartsEarned,
    totalGiftHeartsEarned,
    refresh,
  };
}

export { MARKET_SEEDS_PER_DAY, GIFT_SEEDS_PER_DAY };
export type { MarketSeedStake, GiftSeed };
