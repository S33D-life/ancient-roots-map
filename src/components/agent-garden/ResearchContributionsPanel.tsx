/**
 * ResearchContributionsPanel — Shows research pipeline contribution activity in Agent Garden.
 * Displays task categories, recent events, acceptance counts, and heart-readiness signals.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Heart, TreeDeciduous, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  RESEARCH_TASK_CATEGORIES,
  fetchRecentResearchContributions,
  fetchResearchContributionStats,
} from "@/services/research-contributions";

const CATEGORY_LABELS: Record<string, string> = {
  discover_sources: "🔍 Discover Sources",
  review_candidates: "📋 Review Candidates",
  check_duplicates: "🔗 Check Duplicates",
  enrich_tree_metadata: "📝 Enrich Metadata",
  generate_verification_invites: "📨 Generate Verifications",
  review_verification_results: "✅ Review Verifications",
  suggest_af_promotion: "🌳 Suggest AF Promotion",
};

const TYPE_LABELS: Record<string, string> = {
  candidate_promoted: "Candidate promoted",
  candidate_rejected: "Candidate rejected",
  duplicate_marked: "Duplicate marked",
  verification_tasks_generated: "Verification generated",
  verification_completed: "Verification completed",
  research_tree_promoted_to_af: "Promoted to Ancient Friend",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3 text-muted-foreground" />,
  accepted: <CheckCircle className="w-3 h-3 text-primary" />,
  validated: <CheckCircle className="w-3 h-3 text-primary" />,
  rejected: <XCircle className="w-3 h-3 text-destructive" />,
};

export function ResearchContributionsPanel() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, byType: {} as Record<string, number> });

  useEffect(() => {
    const load = async () => {
      const [evts, st] = await Promise.all([
        fetchRecentResearchContributions(10),
        fetchResearchContributionStats(),
      ]);
      setEvents(evts);
      setStats(st);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
        <span className="text-xs text-muted-foreground">Loading research contributions…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/30 border-border/20">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-mono font-bold text-foreground/90 block">{stats.total}</span>
            <span className="text-[9px] text-muted-foreground/60">Total Contributions</span>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/20">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-mono font-bold text-primary block">{stats.accepted}</span>
            <span className="text-[9px] text-muted-foreground/60">Accepted</span>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/20">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-mono font-bold text-accent-foreground block">{stats.pending}</span>
            <span className="text-[9px] text-muted-foreground/60">Pending Review</span>
          </CardContent>
        </Card>
      </div>

      {/* Task categories */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <TreeDeciduous className="w-3.5 h-3.5 text-primary" />
            Research Task Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {RESEARCH_TASK_CATEGORIES.map(cat => (
              <Badge key={cat} variant="outline" className="text-[9px] bg-card/40 border-border/30">
                {CATEGORY_LABELS[cat] || cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contribution by type */}
      {Object.keys(stats.byType).length > 0 && (
        <Card className="bg-card/30 border-border/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Contributions by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{TYPE_LABELS[type] || type}</span>
                <span className="font-mono text-foreground/90">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent events */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            Recent Research Contributions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {events.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/60 text-center py-4">
              No research contributions yet. Pipeline activity will appear here.
            </p>
          ) : (
            events.map((evt: any) => {
              const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
              const payload = evt.payload_json as Record<string, any> | null;
              return (
                <div key={evt.id} className="flex items-center justify-between text-[11px] py-0.5">
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICON[evt.validation_status] || STATUS_ICON.pending}
                    <span className="text-foreground/80">
                      {agent ? `${agent.avatar_emoji || "🤖"} ${agent.agent_name}` : "System"}
                    </span>
                    <span className="text-muted-foreground/60">—</span>
                    <span className="text-muted-foreground/80">{TYPE_LABELS[evt.contribution_type] || evt.contribution_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {payload?.reward_class && (
                      <Badge variant="outline" className="text-[8px] capitalize">{String(payload.reward_class)}</Badge>
                    )}
                    <span className="text-primary font-mono text-[10px]">
                      {evt.hearts_awarded > 0 ? `+${evt.hearts_awarded}♡` : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
