/**
 * ContributionReviewQueue — Steward Console section for reviewing pending contributions.
 * Keeper-only: validate or reject contribution events.
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Heart, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchRecentResearchContributions,
  validateContribution,
  rejectContribution,
  fetchResearchContributionStats,
} from "@/services/research-contributions";
import { useHasRole } from "@/hooks/use-role";

const TYPE_LABELS: Record<string, string> = {
  candidate_promoted: "Candidate promoted",
  candidate_rejected: "Candidate rejected",
  duplicate_marked: "Duplicate marked",
  verification_tasks_generated: "Verification generated",
  verification_completed: "Verification completed",
  research_tree_promoted_to_af: "Promoted to AF",
};

export function ContributionReviewQueue() {
  const { hasRole: isKeeper, loading: roleLoading } = useHasRole("keeper");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, rejected: 0, rewardReady: 0, byType: {} as Record<string, number> });
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [evts, st] = await Promise.all([
      fetchRecentResearchContributions(20, "pending"),
      fetchResearchContributionStats(),
    ]);
    setEvents(evts);
    setStats(st);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleValidate = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActioningId(eventId);
    const ok = await validateContribution(eventId, user.id);
    if (ok) await load();
    setActioningId(null);
  };

  const handleReject = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActioningId(eventId);
    const ok = await rejectContribution(eventId, user.id);
    if (ok) await load();
    setActioningId(null);
  };

  if (roleLoading) return null;
  if (!isKeeper) return null;

  return (
    <Card className="bg-card/30 border-border/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Contribution Review Queue
          {stats.pending > 0 && (
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 ml-auto">
              {stats.pending} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Breakdown by type */}
        {stats.pending > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[8px] bg-card/40 border-border/30">
                {TYPE_LABELS[type] || type}: {count}
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-3 h-3 animate-spin text-primary mr-1.5" />
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          </div>
        ) : events.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4">
            All contributions reviewed. 🌿
          </p>
        ) : (
          <div className="space-y-1">
            {events.map((evt: any) => {
              const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
              const payload = evt.payload_json as Record<string, any> | null;
              const isActioning = actioningId === evt.id;
              const ts = new Date(evt.created_at);
              const timeAgo = getTimeAgo(ts);

              return (
                <div key={evt.id} className="flex items-center gap-2 text-[11px] py-1.5 px-1.5 rounded hover:bg-card/30 transition-colors">
                  <span className="shrink-0">
                    {agent?.avatar_emoji || "🤖"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground/80 font-medium truncate block">
                      {agent?.agent_name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground/70 text-[10px]">
                      {TYPE_LABELS[evt.contribution_type] || evt.contribution_type} · {timeAgo}
                    </span>
                  </div>
                  <span className="text-primary font-mono text-[10px] shrink-0">
                    +{evt.hearts_awarded}♡
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                      disabled={isActioning}
                      onClick={() => handleValidate(evt.id)}
                      title="Accept"
                    >
                      {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      disabled={isActioning}
                      onClick={() => handleReject(evt.id)}
                      title="Reject"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
