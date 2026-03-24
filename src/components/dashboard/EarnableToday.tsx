import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sprout, TreeDeciduous, Heart, Info } from "lucide-react";

interface Props {
  userId: string;
}

const EarnableToday = ({ userId }: Props) => {
  const today = new Date().toISOString().split("T")[0];

  const { data: seedsUsed = 0 } = useQuery({
    queryKey: ["seeds-today", userId, today],
    queryFn: async () => {
      const { count } = await supabase
        .from("planted_seeds")
        .select("id", { count: "exact", head: true })
        .eq("planter_id", userId)
        .gte("planted_at", today);
      return count || 0;
    },
    staleTime: 60_000,
    enabled: !!userId,
  });

  const { data: checkins = 0 } = useQuery({
    queryKey: ["checkins-today", userId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_reward_caps")
        .select("checkin_count")
        .eq("user_id", userId)
        .eq("reward_date", today);
      return (data || []).reduce((s, r) => s + r.checkin_count, 0);
    },
    staleTime: 30_000,
    enabled: !!userId,
  });

  const { data: heartBalance = 0 } = useQuery({
    queryKey: ["heart-balance-total", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("heart_transactions")
        .select("amount")
        .eq("user_id", userId);
      return (data || []).reduce((s, r) => s + r.amount, 0);
    },
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });

  const seedsRemaining = Math.max(0, 3 - seedsUsed);

  const items = [
    { icon: Sprout, label: "Seeds available", value: `${seedsRemaining}/3`, tip: "Plant up to 3 seeds per day. Each seed carries 33 hearts. Resets at midnight." },
    { icon: TreeDeciduous, label: "Check-ins today", value: `${checkins}`, tip: "Visit trees to earn S33D Hearts — the commons currency. Max 3 per tree per day." },
    { icon: Heart, label: "Hearts earned", value: `${heartBalance}`, tip: "Total S33D Hearts earned through active stewardship." },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/30">
                <item.icon className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-serif tracking-wide">{item.label}</p>
                  <p className="text-lg font-serif text-foreground">{item.value}</p>
                </div>
                <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-xs">
              {item.tip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default EarnableToday;
