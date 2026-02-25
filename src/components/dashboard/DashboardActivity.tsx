import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sprout, TreeDeciduous, Heart, Clock, Flame, Award,
  TrendingUp, Users, Info, Shield, Timer
} from "lucide-react";

interface DashboardActivityProps {
  userId: string;
}

/* ── A) Earnable Today ─────────────────────────────── */
const EarnableToday = ({ userId }: { userId: string }) => {
  const [seedsUsed, setSeedsUsed] = useState(0);
  const [checkins, setCheckins] = useState(0);
  const [heartBalance, setHeartBalance] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    // Seeds planted today
    supabase
      .from("planted_seeds")
      .select("id", { count: "exact", head: true })
      .eq("planter_id", userId)
      .gte("planted_at", today)
      .then(({ count }) => setSeedsUsed(count || 0));

    // Check-ins today
    supabase
      .from("daily_reward_caps")
      .select("checkin_count")
      .eq("user_id", userId)
      .eq("reward_date", today)
      .then(({ data }) => {
        const total = (data || []).reduce((s, r) => s + r.checkin_count, 0);
        setCheckins(total);
      });

    // Total heart balance
    supabase
      .from("heart_transactions")
      .select("amount")
      .eq("user_id", userId)
      .then(({ data }) => {
        setHeartBalance((data || []).reduce((s, r) => s + r.amount, 0));
      });
  }, [userId]);

  const seedsRemaining = Math.max(0, 3 - seedsUsed);

  const items = [
    { icon: Sprout, label: "Seeds available", value: `${seedsRemaining}/3`, tip: "Plant seeds near trees to grow hearts. Resets at midnight." },
    { icon: TreeDeciduous, label: "Check-ins today", value: `${checkins}`, tip: "Visit trees to earn S33D Hearts. Max 3 per tree per day." },
    { icon: Heart, label: "Hearts earned", value: `${heartBalance}`, tip: "Total S33D Hearts across all actions." },
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

/* ── B) Active Campaigns ───────────────────────────── */
const ActiveCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("heart_campaigns")
      .select("*")
      .eq("status", "active")
      .order("ends_at", { ascending: true })
      .limit(5)
      .then(({ data }) => setCampaigns(data || []));
  }, []);

  if (campaigns.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/20 text-center">
        <p className="text-sm text-muted-foreground font-serif italic">No active campaigns right now. The grove rests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => {
        const now = Date.now();
        const end = new Date(c.ends_at).getTime();
        const start = new Date(c.starts_at).getTime();
        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

        return (
          <div key={c.id} className="p-4 rounded-xl bg-card/60 backdrop-blur border border-border/30 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-serif text-sm text-foreground">{c.title}</h4>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Timer className="w-3.5 h-3.5" />
                {daysLeft}d
              </div>
            </div>
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{c.hearts_distributed}/{c.heart_pool} hearts</span>
                <span>{Math.round(progress)}% elapsed</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── C) Tree Cycle Status ──────────────────────────── */
const TreeCycleStatus = ({ userId }: { userId: string }) => {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get tree heart pools approaching 144 threshold
    supabase
      .from("tree_heart_pools")
      .select("tree_id, total_hearts, windfall_count")
      .order("total_hearts", { ascending: false })
      .limit(8)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }

        // Fetch tree names
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

/* ── D) Proposal Branches ──────────────────────────── */
const ProposalBranches = () => {
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("value_proposals")
      .select("*")
      .in("status", ["pending", "active"])
      .order("support_count", { ascending: false })
      .limit(6)
      .then(({ data }) => setProposals(data || []));
  }, []);

  if (proposals.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/20 text-center">
        <p className="text-sm text-muted-foreground font-serif italic">No open proposals. The grove awaits new ideas.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    active: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-2">
      {proposals.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 backdrop-blur border border-border/30">
          <Award className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground truncate">{p.title}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Users className="w-3 h-3" />{p.support_count}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors.pending}`}>
              {p.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── E) Personal Snapshot ──────────────────────────── */
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
      // Total hearts
      supabase.from("heart_transactions").select("amount").eq("user_id", userId),
      // Trees this month
      supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", userId).gte("created_at", cycleIso),
      // Staff status
      supabase.from("profiles").select("active_staff_id").eq("id", userId).maybeSingle(),
      // Last heart action
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

/* ── Main Composite ────────────────────────────────── */
const DashboardActivity = ({ userId }: DashboardActivityProps) => {
  const sections = [
    { title: "Earnable Today", icon: Sprout, children: <EarnableToday userId={userId} /> },
    { title: "Active Campaigns", icon: Flame, children: <ActiveCampaigns /> },
    { title: "Tree Cycles", icon: TrendingUp, children: <TreeCycleStatus userId={userId} /> },
    { title: "Proposal Branches", icon: Award, children: <ProposalBranches /> },
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
