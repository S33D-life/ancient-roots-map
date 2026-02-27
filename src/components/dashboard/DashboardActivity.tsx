import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sprout, TreeDeciduous, Heart, Clock, Flame,
  TrendingUp, Shield, Info
} from "lucide-react";

interface DashboardActivityProps {
  userId: string;
}

/* ── Tree Cycle Status ──────────────────────────── */
const TreeCycleStatus = ({ userId }: { userId: string }) => {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tree_heart_pools")
      .select("tree_id, total_hearts, windfall_count")
      .order("total_hearts", { ascending: false })
      .limit(8)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }
        const treeIds = data.map((p) => p.tree_id);
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name, species")
          .in("id", treeIds);
        const merged = data.map((p) => {
          const tree = (trees || []).find((t) => t.id === p.tree_id);
          const nextThreshold = (p.windfall_count + 1) * 144;
          return {
            ...p,
            name: tree?.name || "Unknown Tree",
            species: tree?.species || "",
            nextThreshold,
            progress: Math.min(100, (p.total_hearts / nextThreshold) * 100),
          };
        });
        setPools(merged);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="text-center py-4 text-muted-foreground text-sm font-serif">Sensing cycles…</div>;
  if (pools.length === 0) return <div className="p-4 rounded-xl bg-card/40 border border-border/20 text-center"><p className="text-sm text-muted-foreground font-serif italic">No tree cycles active yet.</p></div>;

  return (
    <div className="space-y-3">
      {pools.map((p) => (
        <div key={p.tree_id} className="p-3 rounded-xl bg-card/60 backdrop-blur border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-sm font-serif text-foreground truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground italic">{p.species}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-primary shrink-0">
                    <Flame className="w-3.5 h-3.5" />
                    {p.total_hearts}/{p.nextThreshold}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[180px]">
                  Every 144 tree hearts triggers a windfall — 12 bonus hearts shared among visitors.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={p.progress} className="h-2" />
          {p.windfall_count > 0 && (
            <p className="text-[10px] text-accent mt-1">🌊 {p.windfall_count} windfall{p.windfall_count > 1 ? "s" : ""} released</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Personal Snapshot ──────────────────────────── */
const PersonalSnapshot = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState({
    totalHearts: 0,
    treesThisCycle: 0,
    staffActive: false,
    lastAction: "",
  });

  useEffect(() => {
    const cycleStart = new Date();
    cycleStart.setDate(1);
    const cycleIso = cycleStart.toISOString();

    Promise.all([
      supabase.from("heart_transactions").select("amount").eq("user_id", userId),
      supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", userId).gte("created_at", cycleIso),
      supabase.from("profiles").select("active_staff_id").eq("id", userId).maybeSingle(),
      supabase.from("heart_transactions").select("heart_type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]).then(([hearts, trees, profile, lastAction]) => {
      const totalHearts = (hearts.data || []).reduce((s, r) => s + r.amount, 0);
      const lastEntry = lastAction.data?.[0];
      const lastLabel = lastEntry
        ? `${lastEntry.heart_type} — ${new Date(lastEntry.created_at).toLocaleDateString()}`
        : "None yet";
      setStats({
        totalHearts,
        treesThisCycle: trees.count || 0,
        staffActive: !!profile.data?.active_staff_id,
        lastAction: lastLabel,
      });
    });
  }, [userId]);

  const items = [
    { icon: Heart, label: "Hearts balance", value: stats.totalHearts.toLocaleString(), color: "text-primary" },
    { icon: TreeDeciduous, label: "Trees this cycle", value: stats.treesThisCycle.toString(), color: "text-emerald-400" },
    { icon: Shield, label: "Staff", value: stats.staffActive ? "Active" : "None", color: stats.staffActive ? "text-amber-400" : "text-muted-foreground" },
    { icon: Clock, label: "Last earned", value: stats.lastAction, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="p-3 rounded-xl bg-card/60 backdrop-blur border border-border/30 space-y-1">
          <div className="flex items-center gap-2">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <p className="text-[10px] text-muted-foreground font-serif tracking-wide uppercase">{item.label}</p>
          </div>
          <p className="text-sm font-serif text-foreground truncate">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Main: Journey-focused Activity ──────────────── */
const DashboardActivity = ({ userId }: DashboardActivityProps) => {
  const sections = [
    { title: "Tree Cycles", icon: TrendingUp, children: <TreeCycleStatus userId={userId} /> },
    { title: "Personal Snapshot", icon: Heart, children: <PersonalSnapshot userId={userId} /> },
  ];

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.title}>
          <div className="flex items-center gap-2 mb-3">
            <s.icon className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-sm tracking-widest text-primary uppercase">{s.title}</h3>
          </div>
          {s.children}
        </section>
      ))}
    </div>
  );
};

export default DashboardActivity;
