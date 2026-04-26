/**
 * use-lottery — wraps `get_my_lottery_stats` RPC and recent-draws query.
 *
 * The RPC returns:
 *   {
 *     ok, tickets, tickets_breakdown { collections, tree_pool, windfalls,
 *       offerings, presence, council, contributions, other },
 *     total_staked, lifetime_prizes, lifetime_yield, estimated_yield_next,
 *     next_draw { id, draw_type, scheduled_at, prize_amount, prize_count, yield_bps }
 *   }
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface TicketsBreakdown {
  collections: number;
  tree_pool: number;
  windfalls: number;
  offerings: number;
  presence: number;
  council: number;
  contributions: number;
  other: number;
}

export interface NextDraw {
  id: string;
  draw_type: "new_moon" | "full_moon" | "equinox_spring" | "equinox_autumn" | "solstice_summer" | "solstice_winter";
  scheduled_at: string;
  prize_amount: number;
  prize_count: number;
  yield_bps: number;
}

export interface LotteryStats {
  ok: boolean;
  tickets: number;
  ticketsBreakdown: TicketsBreakdown;
  totalStaked: number;
  lifetimePrizes: number;
  lifetimeYield: number;
  estimatedYieldNext: number;
  nextDraw: NextDraw | null;
}

const EMPTY_BREAKDOWN: TicketsBreakdown = {
  collections: 0,
  tree_pool: 0,
  windfalls: 0,
  offerings: 0,
  presence: 0,
  council: 0,
  contributions: 0,
  other: 0,
};

export function useLotteryStats() {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["lottery-stats", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<LotteryStats> => {
      const { data, error } = await supabase.rpc("get_my_lottery_stats", {
        p_user_id: userId!,
      });
      if (error) throw error;
      const raw = (data as any) ?? {};
      return {
        ok: !!raw.ok,
        tickets: raw.tickets ?? 0,
        ticketsBreakdown: { ...EMPTY_BREAKDOWN, ...(raw.tickets_breakdown ?? {}) },
        totalStaked: raw.total_staked ?? 0,
        lifetimePrizes: raw.lifetime_prizes ?? 0,
        lifetimeYield: raw.lifetime_yield ?? 0,
        estimatedYieldNext: raw.estimated_yield_next ?? 0,
        nextDraw: raw.next_draw ?? null,
      };
    },
  });

  // When the scheduled moment passes, invalidate so users see the updated draw.
  const scheduledAt = query.data?.nextDraw?.scheduled_at;
  useEffect(() => {
    if (!scheduledAt) return;
    const ms = new Date(scheduledAt).getTime() - Date.now();
    if (ms <= 0 || ms > 2_147_000_000) return;
    const t = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["lottery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lottery-recent-draws"] });
    }, ms + 5_000);
    return () => clearTimeout(t);
  }, [scheduledAt, queryClient]);

  return query;
}

export interface RecentDrawWinner {
  prize_rank: number;
  prize_amount: number;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface RecentDraw {
  id: string;
  draw_type: NextDraw["draw_type"];
  scheduled_at: string;
  executed_at: string | null;
  entries_total: number;
  yield_paid_total: number;
  prize_pool_total: number;
  random_seed: string | null;
  winners: RecentDrawWinner[];
}

export function useRecentDraws(limit = 8) {
  return useQuery({
    queryKey: ["lottery-recent-draws", limit],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<RecentDraw[]> => {
      const { data, error } = await supabase
        .from("lottery_draws")
        .select(
          `id, draw_type, scheduled_at, executed_at,
           entries_total, yield_paid_total, prize_pool_total, random_seed,
           lottery_winners ( prize_rank, prize_amount, user_id )`
        )
        .eq("status", "complete")
        .order("scheduled_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const draws = (data ?? []) as any[];

      // Pull winner profiles in a single follow-up query (RLS-friendly).
      const winnerIds = Array.from(
        new Set(draws.flatMap((d) => (d.lottery_winners ?? []).map((w: any) => w.user_id)))
      );
      let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (winnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", winnerIds);
        profileMap = new Map(
          (profiles ?? []).map((p: any) => [
            p.id,
            { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null },
          ])
        );
      }

      return draws.map((d) => ({
        id: d.id,
        draw_type: d.draw_type,
        scheduled_at: d.scheduled_at,
        executed_at: d.executed_at,
        entries_total: d.entries_total ?? 0,
        yield_paid_total: d.yield_paid_total ?? 0,
        prize_pool_total: d.prize_pool_total ?? 0,
        random_seed: d.random_seed ?? null,
        winners: (d.lottery_winners ?? [])
          .map((w: any) => ({
            prize_rank: w.prize_rank,
            prize_amount: w.prize_amount,
            user_id: w.user_id,
            full_name: profileMap.get(w.user_id)?.full_name ?? null,
            avatar_url: profileMap.get(w.user_id)?.avatar_url ?? null,
          }))
          .sort((a: any, b: any) => a.prize_rank - b.prize_rank),
      }));
    },
  });
}

export function useLotteryConfig() {
  return useQuery({
    queryKey: ["lottery-config"],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ── Display helpers ────────────────────────────────────────

export function drawEmoji(type: NextDraw["draw_type"] | undefined | null): string {
  switch (type) {
    case "new_moon": return "🌑";
    case "full_moon": return "🌕";
    case "equinox_spring": return "🌸";
    case "equinox_autumn": return "🍂";
    case "solstice_summer": return "☀️";
    case "solstice_winter": return "❄️";
    default: return "🌙";
  }
}

export function drawLabel(type: NextDraw["draw_type"] | undefined | null): string {
  switch (type) {
    case "new_moon": return "New Moon";
    case "full_moon": return "Full Moon";
    case "equinox_spring": return "Spring Equinox";
    case "equinox_autumn": return "Autumn Equinox";
    case "solstice_summer": return "Summer Solstice";
    case "solstice_winter": return "Winter Solstice";
    default: return "Next Moon";
  }
}
