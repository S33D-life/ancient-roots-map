/**
 * RecentActivityFeed — Compact system activity feed combining key events.
 * Shows the last 15 meaningful actions across the contribution economy.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, CONTRIBUTION_TYPE_LABELS } from "@/lib/lifecycle-labels";

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  agent: string;
  emoji: string;
  time: string;
  detail?: string;
}

export function RecentActivityFeed() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch contributions + ledger in parallel (single query each, no N+1)
      const [contribRes, ledgerRes] = await Promise.all([
        supabase
          .from("agent_contribution_events")
          .select("id, contribution_type, validation_status, reward_status, created_at, agent_profiles(agent_name, avatar_emoji)")
          .in("contribution_type", [
            "candidate_promoted", "candidate_rejected", "duplicate_marked",
            "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
          ])
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("agent_reward_ledger")
          .select("id, reason, hearts_amount, created_at, agent_profiles(agent_name, avatar_emoji)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const activities: ActivityItem[] = [];

      // Contribution events
      for (const evt of (contribRes.data || [])) {
        const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
        activities.push({
          id: evt.id,
          type: "contribution",
          label: CONTRIBUTION_TYPE_LABELS[evt.contribution_type] || evt.contribution_type,
          agent: agent?.agent_name || "System",
          emoji: agent?.avatar_emoji || "🤖",
          time: evt.created_at,
          detail: evt.validation_status !== "pending" ? evt.validation_status : undefined,
        });
      }

      // Ledger distributions
      for (const entry of (ledgerRes.data || [])) {
        const agent = entry.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
        activities.push({
          id: `ledger-${entry.id}`,
          type: "distribution",
          label: `+${entry.hearts_amount}♡ distributed`,
          agent: agent?.agent_name || "Unknown",
          emoji: agent?.avatar_emoji || "🤖",
          time: entry.created_at,
        });
      }

      // Sort by time, take 15
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(activities.slice(0, 15));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/30 border-border/20">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-3 h-3 animate-spin text-primary mr-1.5" />
          <span className="text-[10px] text-muted-foreground">Loading activity…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 border-border/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Recent System Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4">
            No recent activity yet.
          </p>
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 text-[10px] py-0.5">
                <span className="shrink-0">{item.emoji}</span>
                <span className="text-foreground/70 truncate">{item.agent}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className={`truncate ${item.type === "distribution" ? "text-primary" : "text-foreground/60"}`}>
                  {item.label}
                </span>
                {item.detail && (
                  <span className="text-[8px] text-muted-foreground/50 capitalize">{item.detail}</span>
                )}
                <span className="ml-auto text-muted-foreground/40 text-[9px] shrink-0">
                  {timeAgo(item.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
