/**
 * ResearchContributionsPanel — Shows research pipeline contribution activity in Agent Garden.
 * Displays task categories, recent events, acceptance counts, filters, and heart-readiness signals.
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Heart, TreeDeciduous, CheckCircle, Clock, XCircle, Sparkles } from "lucide-react";
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

const VALIDATION_ICON: Record<string, { icon: React.ReactNode; label: string }> = {
  pending: { icon: <span className="text-[10px]">⏳</span>, label: "Pending" },
  accepted: { icon: <span className="text-[10px]">✅</span>, label: "Accepted" },
  validated: { icon: <span className="text-[10px]">✅</span>, label: "Validated" },
  rejected: { icon: <span className="text-[10px]">❌</span>, label: "Rejected" },
};

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export function ResearchContributionsPanel() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, rejected: 0, rewardReady: 0, byType: {} as Record<string, number> });
  const [filter, setFilter] = useState<FilterStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [evts, st] = await Promise.all([
      fetchRecentResearchContributions(20, filter),
      fetchResearchContributionStats(),
    ]);
    setEvents(evts);
    setStats(st);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Group events
  const pendingEvents = events.filter(e => e.validation_status === "pending");
  const validatedEvents = events.filter(e => e.validation_status === "accepted" || e.validation_status === "validated");
  const rejectedEvents = events.filter(e => e.validation_status === "rejected");

  const showGrouped = filter === "all";

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/30 border-border/20">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-mono font-bold text-foreground/90 block">{stats.total}</span>
            <span className="text-[9px] text-muted-foreground/60">Total</span>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/20">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-mono font-bold text-accent-foreground block">{stats.pending}</span>
            <span className="text-[9px] text-muted-foreground/60">Pending</span>
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
            <span className="text-xl font-mono font-bold text-primary block">{stats.rewardReady}</span>
            <span className="text-[9px] text-muted-foreground/60 flex items-center justify-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Reward Ready
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            className="text-[10px] h-6 px-2.5"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === "pending" && stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1 text-[8px] h-3.5 px-1">{stats.pending}</Badge>
            )}
          </Button>
        ))}
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

      {/* Event feed */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {showGrouped && pendingEvents.length > 0 && (
            <EventGroup title="Awaiting Steward Attention" icon={<Clock className="w-3 h-3 text-accent-foreground" />} events={pendingEvents} />
          )}
          {showGrouped && validatedEvents.length > 0 && (
            <EventGroup title="Validated Contributions" icon={<CheckCircle className="w-3 h-3 text-primary" />} events={validatedEvents} />
          )}
          {showGrouped && rejectedEvents.length > 0 && (
            <EventGroup title="Rejected" icon={<XCircle className="w-3 h-3 text-destructive" />} events={rejectedEvents} />
          )}
          {!showGrouped && (
            <EventGroup title={FILTERS.find(f => f.value === filter)?.label || "Results"} events={events} />
          )}
          {events.length === 0 && (
            <p className="text-[11px] text-muted-foreground/60 text-center py-6">
              No contributions match this filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EventGroup({ title, icon, events }: { title: string; icon?: React.ReactNode; events: any[] }) {
  if (events.length === 0) return null;
  return (
    <Card className="bg-card/30 border-border/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          {icon || <Heart className="w-3.5 h-3.5 text-primary" />}
          {title}
          <Badge variant="outline" className="text-[8px] ml-auto">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1">
        {events.map((evt: any) => (
          <ContributionEventRow key={evt.id} evt={evt} />
        ))}
      </CardContent>
    </Card>
  );
}

function ContributionEventRow({ evt }: { evt: any }) {
  const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
  const payload = evt.payload_json as Record<string, any> | null;
  const valInfo = VALIDATION_ICON[evt.validation_status] || VALIDATION_ICON.pending;
  const isRewardReady = evt.reward_status === "ready";
  const isDistributed = evt.reward_status === "distributed";

  return (
    <div className={`flex items-center justify-between text-[11px] py-1 px-1 rounded transition-colors ${
      isRewardReady ? "bg-primary/5" : ""
    }`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {valInfo.icon}
        <span className="text-foreground/80 truncate">
          {agent ? `${agent.avatar_emoji || "🤖"} ${agent.agent_name}` : "System"}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-muted-foreground/80 truncate">{TYPE_LABELS[evt.contribution_type] || evt.contribution_type}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {payload?.reward_class && (
          <Badge variant="outline" className="text-[8px] capitalize">{String(payload.reward_class)}</Badge>
        )}
        {evt.hearts_awarded > 0 && (
          <span className={`font-mono text-[10px] ${
            isRewardReady
              ? "text-primary font-semibold"
              : isDistributed
                ? "text-muted-foreground line-through"
                : "text-muted-foreground/60"
          }`}>
            +{evt.hearts_awarded}♡
          </span>
        )}
      </div>
    </div>
  );
}
