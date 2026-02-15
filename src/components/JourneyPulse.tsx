import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserOfferingCount } from "@/hooks/use-offering-counts";
import { TreeDeciduous, Gift, Heart } from "lucide-react";

/**
 * Compact personal stats widget showing the user's journey across TETOL levels.
 * Shows in footer area — only visible when logged in.
 */
const JourneyPulse = () => {
  const [trees, setTrees] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const { count: offerings } = useUserOfferingCount(userId);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchStats(user.id);
      }
    };
    fetchUser();
  }, []);

  const fetchStats = async (uid: string) => {
    const [treesRes, heartTxRes] = await Promise.all([
      supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", uid),
      supabase.from("heart_transactions").select("amount").eq("user_id", uid),
    ]);

    const treeCount = treesRes.count || 0;
    const heartTxTotal = (heartTxRes.data || []).reduce((sum: number, h: any) => sum + (h.amount || 0), 0);

    setTrees(treeCount);
    setHearts(treeCount * 10 + heartTxTotal);
  };

  if (!userId || (trees === 0 && offerings === 0)) return null;

  return (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 text-[11px] font-serif text-muted-foreground"
    >
      <span className="flex items-center gap-1">
        <TreeDeciduous className="w-3 h-3 text-primary/70" />
        {trees}
      </span>
      <span className="text-border/40">·</span>
      <span className="flex items-center gap-1">
        <Gift className="w-3 h-3 text-accent/70" />
        {offerings}
      </span>
      <span className="text-border/40">·</span>
      <span className="flex items-center gap-1">
        <Heart className="w-3 h-3 text-primary/70 fill-primary/30" />
        {hearts}
      </span>
    </Link>
  );
};

export default JourneyPulse;
