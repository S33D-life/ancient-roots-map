import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TreeDeciduous, Sprout, Sparkles, Gift } from "lucide-react";
import { Loader2 } from "lucide-react";
import GiftSeedInbox from "@/components/GiftSeedInbox";

interface HeartActivity {
  id: string;
  amount: number;
  heart_type: string;
  tree_id: string;
  created_at: string;
  tree_name?: string;
}

interface HearthHeartsProps {
  userId: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  wanderer: { label: "Wanderer", icon: Sprout, color: "120 50% 50%" },
  sower: { label: "Sower", icon: TreeDeciduous, color: "42 80% 55%" },
  windfall: { label: "Windfall", icon: Sparkles, color: "280 60% 60%" },
  tree: { label: "Tree", icon: TreeDeciduous, color: "120 40% 40%" },
  gift: { label: "Gift", icon: Gift, color: "330 70% 55%" },
};

const HearthHearts = ({ userId }: HearthHeartsProps) => {
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<HeartActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHearts = async () => {
      const { data } = await supabase
        .from("heart_transactions")
        .select("id, amount, heart_type, tree_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      const items = data || [];
      const sum = items.reduce((s, h) => s + (h.amount || 0), 0);

      // Get full total
      const { data: allData } = await supabase
        .from("heart_transactions")
        .select("amount")
        .eq("user_id", userId);
      const fullTotal = (allData || []).reduce((s: number, h: any) => s + (h.amount || 0), 0);

      // Fetch tree names for recent
      const treeIds = [...new Set(items.map(i => i.tree_id))];
      let treeMap: Record<string, string> = {};
      if (treeIds.length > 0) {
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name")
          .in("id", treeIds);
        (trees || []).forEach(t => { treeMap[t.id] = t.name; });
      }

      setRecent(items.map(i => ({ ...i, tree_name: treeMap[i.tree_id] || "Unknown tree" })));
      setTotal(fullTotal);
      setLoading(false);
    };
    fetchHearts();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total heart counter */}
      <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-card/40 border border-border/20">
        <Heart className="w-6 h-6 text-primary fill-primary/30" />
        <div className="text-center">
          <p className="text-2xl font-serif text-primary">{total}</p>
          <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50">Hearts Collected</p>
        </div>
      </div>

      {/* Recent activity */}
      {recent.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">Recent Heart Activity</p>
          {recent.map((h) => {
            const cfg = TYPE_CONFIG[h.heart_type] || TYPE_CONFIG.wanderer;
            const Icon = cfg.icon;
            return (
              <div key={h.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-card/30 transition-colors">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${cfg.color} / 0.15)`, border: `1px solid hsl(${cfg.color} / 0.3)` }}
                >
                  <Icon className="w-3 h-3" style={{ color: `hsl(${cfg.color})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground/80 truncate">
                    +{h.amount} {cfg.label} heart{h.amount > 1 ? "s" : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 truncate">{h.tree_name}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/30 shrink-0">
                  {new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Heart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
          <p className="text-xs font-serif text-muted-foreground/50">No heart activity yet</p>
          <p className="text-[10px] font-serif text-muted-foreground/30 mt-1">Plant seeds near trees to start collecting hearts</p>
        </div>
      )}

      {/* Gift Seed Inbox */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm tracking-widest text-primary uppercase">Gift Seeds</h3>
        </div>
        <GiftSeedInbox userId={userId} />
      </div>
    </div>
  );
};

export default HearthHearts;
