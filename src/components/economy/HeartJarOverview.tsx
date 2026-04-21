/**
 * HeartJarOverview — Phase 1 simplified Heart Jar contents.
 *
 * Sections:
 *   A. Balance (large)
 *   B. Recent Activity (last 8 heart_transactions)
 *   C. Light Flow Signal (sum of last 24h)
 *   D. Single CTA → /vault
 *
 * Reads only existing tables. No hourly buckets, no taxonomy, no social.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, Sparkles, TreeDeciduous, Wind, Gift, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  amount: number;
  heart_type: string | null;
  tree_id: string | null;
  tree_name: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  hearts: number;
}

const ACTIVITY_LIMIT = 8;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function labelFor(a: Activity): { icon: JSX.Element; text: string } {
  const t = (a.heart_type || "").toLowerCase();
  if (t === "wanderer" || t === "visit" || t === "checkin") {
    return {
      icon: <TreeDeciduous className="w-3.5 h-3.5 text-primary/70" />,
      text: a.tree_name ? `from ${a.tree_name} visit` : "from a tree visit",
    };
  }
  if (t === "sower" || t === "offering") {
    return {
      icon: <Gift className="w-3.5 h-3.5 text-primary/70" />,
      text: a.tree_name ? `from offering at ${a.tree_name}` : "from an offering",
    };
  }
  if (t === "windfall") {
    return {
      icon: <Wind className="w-3.5 h-3.5 text-primary/70" />,
      text: a.tree_name ? `windfall at ${a.tree_name}` : "windfall",
    };
  }
  if (t === "encounter" || t === "council" || t === "gathering") {
    return {
      icon: <Users className="w-3.5 h-3.5 text-primary/70" />,
      text: "from an encounter",
    };
  }
  return {
    icon: <Sparkles className="w-3.5 h-3.5 text-primary/70" />,
    text: a.tree_name ? `from ${a.tree_name}` : a.heart_type || "hearts gathered",
  };
}

const HeartJarOverview = ({ userId, hearts }: Props) => {
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [flow24, setFlow24] = useState<number>(0);
  const [today, setToday] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const sinceToday = new Date();
      sinceToday.setHours(0, 0, 0, 0);
      const sinceTodayIso = sinceToday.toISOString();

      const [recentRes, flowRes, todayRes] = await Promise.all([
        supabase
          .from("heart_transactions")
          .select("id, amount, heart_type, tree_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(ACTIVITY_LIMIT),
        supabase
          .from("heart_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", since24),
        supabase
          .from("heart_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", sinceTodayIso),
      ]);

      if (cancelled) return;

      const rows = (recentRes.data || []) as Omit<Activity, "tree_name">[];
      // Resolve tree names in one round-trip
      const treeIds = Array.from(new Set(rows.map((r) => r.tree_id).filter(Boolean))) as string[];
      let nameMap: Record<string, string> = {};
      if (treeIds.length > 0) {
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name, species")
          .in("id", treeIds);
        nameMap = Object.fromEntries(
          (trees || []).map((t: any) => [t.id, t.name || t.species || "a tree"]),
        );
      }
      if (cancelled) return;

      setActivity(rows.map((r) => ({ ...r, tree_name: r.tree_id ? nameMap[r.tree_id] || null : null })));
      setFlow24((flowRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0));
      setToday((todayRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Soft cap for the flow bar — grows organically; 100 is a comfy daily reference
  const flowPct = Math.min(100, (flow24 / 100) * 100);

  return (
    <div className="space-y-5">
      {/* ── A. Balance ── */}
      <div className="flex flex-col items-center text-center pt-2">
        <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-[0.2em]">
          Your Hearts
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <Heart className="w-6 h-6 text-primary fill-primary/30" />
          <span className="text-4xl font-serif font-bold tabular-nums text-primary">
            {hearts.toLocaleString()}
          </span>
        </div>
        {today > 0 && (
          <p
            className="text-xs font-serif mt-1"
            style={{ color: "hsl(140 45% 45%)" }}
          >
            +{today} today
          </p>
        )}
      </div>

      {/* ── B. Recent Activity ── */}
      <section>
        <h3 className="text-[10px] font-serif uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">
          Recent activity
        </h3>
        {activity === null ? (
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{ background: "hsl(var(--secondary) / 0.2)" }}
              />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div
            className="text-center px-3 py-5 rounded-xl"
            style={{
              background: "hsl(var(--secondary) / 0.1)",
              border: "1px dashed hsl(var(--border) / 0.4)",
            }}
          >
            <p className="text-sm font-serif text-foreground">Your jar is ready</p>
            <p className="text-xs font-serif text-muted-foreground mt-0.5">
              Visit a tree to begin the flow
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {activity.map((a) => {
              const { icon, text } = labelFor(a);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                  style={{ background: "hsl(var(--secondary) / 0.08)" }}
                >
                  <span className="shrink-0">{icon}</span>
                  <span className="text-xs font-serif text-foreground flex-1 truncate">{text}</span>
                  <span className="text-xs font-serif font-bold tabular-nums text-primary shrink-0">
                    {a.amount > 0 ? "+" : ""}
                    {a.amount}
                  </span>
                  <span className="text-[10px] font-serif text-muted-foreground/70 shrink-0 tabular-nums">
                    {timeAgo(a.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── C. Light Flow Signal ── */}
      <section>
        <div className="flex items-baseline justify-between px-1 mb-1.5">
          <h3 className="text-[10px] font-serif uppercase tracking-[0.2em] text-muted-foreground">
            Flow today
          </h3>
          <span className="text-xs font-serif text-foreground tabular-nums">
            {flow24} <span className="text-muted-foreground">hearts</span>
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "hsl(var(--secondary) / 0.25)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${flowPct}%`,
              background:
                "linear-gradient(to right, hsl(var(--primary) / 0.6), hsl(140 50% 55% / 0.7))",
            }}
          />
        </div>
        <p className="text-[10px] font-serif text-muted-foreground/70 mt-1.5 px-1">
          last 24 hours
        </p>
      </section>

      {/* ── D. Single CTA → Vault ── */}
      <Link
        to="/vault"
        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group"
        style={{
          background: "hsl(var(--primary) / 0.1)",
          border: "1px solid hsl(var(--primary) / 0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary fill-primary/20" />
          <span className="text-sm font-serif font-medium text-foreground">
            Open Heartwood Vault
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

export default HeartJarOverview;
