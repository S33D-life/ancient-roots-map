/**
 * HiveUserBalance — shows the logged-in user's personal species hearts
 * balance for a given hive family.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

interface Props {
  userId: string | null;
  family: string;
  accentHsl: string;
  icon: string;
}

const HiveUserBalance = ({ userId, family, accentHsl, icon }: Props) => {
  const { data: balance } = useQuery({
    queryKey: ["hive-user-balance", userId, family],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("species_heart_transactions")
        .select("amount")
        .eq("user_id", userId!)
        .eq("species_family", family);
      return (data || []).reduce((s, tx) => s + tx.amount, 0);
    },
  });

  if (!userId || !balance) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif border"
      style={{
        borderColor: `hsl(${accentHsl} / 0.3)`,
        background: `hsl(${accentHsl} / 0.08)`,
        color: `hsl(${accentHsl})`,
      }}
    >
      <Heart className="w-3 h-3" />
      <span className="tabular-nums font-bold">{balance}</span>
      <span>{icon} Your {family} Hearts</span>
    </div>
  );
};

export default HiveUserBalance;
