import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TreeDeciduous, Flame, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * LibraryVaultPreview — compact economy snapshot shown on the Library landing.
 * Displays heart balance, trees mapped, nearest cycle progress, and active campaigns.
 */
const LibraryVaultPreview = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [heartBalance, setHeartBalance] = useState(0);
  const [treeCount, setTreeCount] = useState(0);
  const [topPool, setTopPool] = useState<{ name: string; hearts: number; threshold: number } | null>(null);
  const [campaignCount, setCampaignCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLoaded(true); return; }

      Promise.all([
        // Heart balance
        supabase.from("heart_transactions").select("amount").eq("user_id", uid),
        // Trees mapped
        supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", uid),
        // Top pool nearing 144
        supabase.from("tree_heart_pools").select("tree_id, total_hearts, windfall_count").order("total_hearts", { ascending: false }).limit(1),
        // Active campaigns
        supabase.from("heart_campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]).then(async ([hearts, trees, pools, campaigns]) => {
        setHeartBalance((hearts.data || []).reduce((s, r) => s + r.amount, 0));
        setTreeCount(trees.count || 0);
        setCampaignCount(campaigns.count || 0);

        const poolRow = pools.data?.[0];
        if (poolRow) {
          const threshold = (poolRow.windfall_count + 1) * 144;
          const { data: treeData } = await supabase.from("trees").select("name").eq("id", poolRow.tree_id).maybeSingle();
          setTopPool({ name: treeData?.name || "Unknown", hearts: poolRow.total_hearts, threshold });
        }
        setLoaded(true);
      });
    });
  }, []);

  if (!loaded) return null;

  // Not logged in — show gentle prompt
  if (!userId) {
    return (
      <div className="rounded-xl border border-amber-700/30 p-5 text-center" style={{ background: 'linear-gradient(135deg, hsl(28 25% 10% / 0.7), hsl(22 20% 8% / 0.8))' }}>
        <Heart className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(38 70% 55%)' }} />
        <p className="font-serif text-sm" style={{ color: 'hsl(38 50% 70% / 0.8)' }}>
          Sign in to see your Heart balance and grove progress.
        </p>
      </div>
    );
  }

  const poolProgress = topPool ? Math.min(100, (topPool.hearts / topPool.threshold) * 100) : 0;

  return (
    <div className="rounded-xl border border-amber-700/30 p-5 space-y-4" style={{ background: 'linear-gradient(135deg, hsl(28 25% 10% / 0.7), hsl(22 20% 8% / 0.8))' }}>
      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Heart, label: "Hearts", value: heartBalance.toLocaleString() },
          { icon: TreeDeciduous, label: "Trees mapped", value: treeCount.toLocaleString() },
          { icon: TrendingUp, label: "Campaigns", value: campaignCount > 0 ? `${campaignCount} active` : "—" },
          { icon: Flame, label: "Next windfall", value: topPool ? `${topPool.hearts}/${topPool.threshold}` : "—" },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <m.icon className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 65% 55%)' }} />
            <div>
              <p className="text-[10px] font-serif tracking-wide uppercase" style={{ color: 'hsl(38 30% 55% / 0.6)' }}>{m.label}</p>
              <p className="text-sm font-serif" style={{ color: 'hsl(38 50% 75%)' }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cycle progress bar */}
      {topPool && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-serif" style={{ color: 'hsl(38 30% 55% / 0.6)' }}>
            <span>Nearest fountain: {topPool.name}</span>
            <span>{Math.round(poolProgress)}%</span>
          </div>
          <Progress value={poolProgress} className="h-1.5" />
        </div>
      )}
    </div>
  );
};

export default LibraryVaultPreview;
