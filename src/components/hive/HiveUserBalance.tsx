/**
 * HiveUserBalance — shows the logged-in user's personal species hearts
 * balance for a given hive family.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

interface Props {
  userId: string | null;
  family: string;
  accentHsl: string;
  icon: string;
}

const HiveUserBalance = ({ userId, family, accentHsl, icon }: Props) => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("species_heart_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("species_family", family)
      .then(({ data }) => {
        setBalance((data || []).reduce((s, tx) => s + tx.amount, 0));
      });
  }, [userId, family]);

  if (!userId || balance === null || balance === 0) return null;

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
