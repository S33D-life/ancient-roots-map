/**
 * RewardReadyQueue — Keeper-only section in Steward Console.
 * Lists accepted contributions with reward_status = 'ready' and allows manual distribution.
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Gift, Heart, CheckCircle, Sparkles } from "lucide-react";
import { timeAgo } from "@/lib/lifecycle-labels";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchRecentResearchContributions,
  distributeContributionReward,
  fetchRewardReadyCount,
} from "@/services/research-contributions";
import { useHasRole } from "@/hooks/use-role";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  candidate_promoted: "Candidate promoted",
  candidate_rejected: "Candidate rejected",
  duplicate_marked: "Duplicate marked",
  verification_tasks_generated: "Verification generated",
  verification_completed: "Verification completed",
  research_tree_promoted_to_af: "Promoted to AF",
};

export function RewardReadyQueue() {
  const { hasRole: isKeeper, loading: roleLoading } = useHasRole("keeper");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [evts, count] = await Promise.all([
      fetchRecentResearchContributions(20, "reward_ready"),
      fetchRewardReadyCount(),
    ]);
    setEvents(evts);
    setReadyCount(count);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDistribute = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActioningId(eventId);
    const result = await distributeContributionReward(eventId, user.id);
    if (result.ok) {
      toast.success("Hearts distributed");
      await load();
    } else {
      toast.error(result.reason || "Distribution failed");
    }
    setActioningId(null);
  };

  if (roleLoading) return null;
  if (!isKeeper) return null;

  return (
    <Card className="bg-card/30 border-primary/10">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Reward Ready
          {readyCount > 0 && (
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 ml-auto">
              {readyCount} ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-3 h-3 animate-spin text-primary mr-1.5" />
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          </div>
        ) : events.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4">
            No rewards ready for distribution. 🌿
          </p>
        ) : (
          <div className="space-y-1">
            {events.map((evt: any) => {
              const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
              const payload = evt.payload_json as Record<string, any> | null;
              const isActioning = actioningId === evt.id;
              const validatedAt = evt.validated_at ? timeAgo(evt.validated_at) : "";

              return (
                <div key={evt.id} className="flex items-center gap-2 text-[11px] py-1.5 px-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors">
                  <span className="shrink-0">{agent?.avatar_emoji || "🤖"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground/80 font-medium truncate block">
                      {agent?.agent_name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground/70 text-[10px]">
                      {TYPE_LABELS[evt.contribution_type] || evt.contribution_type}
                      {validatedAt && ` · validated ${validatedAt}`}
                    </span>
                  </div>
                  {payload?.reward_class && (
                    <Badge variant="outline" className="text-[8px] capitalize shrink-0">{String(payload.reward_class)}</Badge>
                  )}
                  <span className="text-primary font-mono text-[10px] font-semibold shrink-0">
                    +{evt.hearts_awarded}♡
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/15 shrink-0"
                    disabled={isActioning}
                    onClick={() => handleDistribute(evt.id)}
                  >
                    {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                    Distribute
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


