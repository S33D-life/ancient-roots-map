/**
 * YourPlaceInCycle — Personal progress through the Encounter Economy cycle.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, HandHeart, Wheat, ArrowLeftRight, TreePine, Music, MapPin, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartBalance } from "@/hooks/use-heart-balance";

interface Props {
  userId: string;
}

const YourPlaceInCycle = ({ userId }: Props) => {
  const heartBalance = useHeartBalance(userId);
  const [verifiedCount, setVerifiedCount] = useState(0);

  useEffect(() => {
    // count trees the user has verified via curation/contribution
    supabase
      .from("tree_contributions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count }) => setVerifiedCount(count || 0));
  }, [userId]);

  const stats = [
    { icon: <Eye className="w-3.5 h-3.5" />, label: "Trees Encountered", value: heartBalance.counts.trees + heartBalance.counts.offerings, color: "hsl(150 50% 45%)" },
    { icon: <Music className="w-3.5 h-3.5" />, label: "Offerings Shared", value: heartBalance.counts.offerings, color: "hsl(30 70% 50%)" },
    { icon: <TreePine className="w-3.5 h-3.5" />, label: "Trees Mapped", value: heartBalance.counts.trees, color: "hsl(var(--primary))" },
    { icon: <Shield className="w-3.5 h-3.5" />, label: "Trees Verified", value: verifiedCount, color: "hsl(42 80% 50%)" },
    { icon: <Heart className="w-3.5 h-3.5" />, label: "Hearts Earned", value: heartBalance.totalHearts, color: "hsl(0 65% 55%)" },
    { icon: <ArrowLeftRight className="w-3.5 h-3.5" />, label: "Vault Rewards", value: "→", color: "hsl(280 40% 55%)", link: "/vault" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 space-y-3"
    >
      <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-primary/60" />
        Your Place in the Cycle
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center space-y-1">
            <div className="flex justify-center" style={{ color: s.color }}>{s.icon}</div>
            <p className="text-sm font-serif text-foreground">{s.value}</p>
            <p className="text-[8px] text-muted-foreground font-serif leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default YourPlaceInCycle;
