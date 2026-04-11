/**
 * ResearchContributionsPanel — Research pipeline contribution feed in Agent Garden.
 * Filters, grouped view, reward-state visibility, heart-readiness signals.
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Heart, TreeDeciduous, CheckCircle, Clock, XCircle, Sparkles, Gift } from "lucide-react";
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

type FilterStatus = "all" | "pending" | "accepted" | "rejected" | "reward_ready";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "reward_ready", label: "Reward Ready" },
  { value: "rejected", label: "Rejected" },
];

export function ResearchContributionsPanel() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, rejected: 0, rewardReady: 0, distributed: 0, byType: {} as Record<string, number> });
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

  const pendingEvents = events.filter(e => e.validation_status === "pending");
  const readyEvents = events.filter(e => e.reward_status === "ready");
  const distributedEvents = events.filter(e => e.reward_status === "distributed");
  const rejectedEvents = events.filter(e => e.validation_status === "rejected");
  const otherAccepted = events.filter(e => e.validation_status === "accepted" && e.reward_status !== "ready" && e.reward_status !== "distributed");
  const showGrouped = filter === "all";

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {[
          { n: stats.total, label: "Total", color: "text-foreground/90" },
          { n: stats.pending, label: "Pending", color: "text-accent-foreground" },
          { n: stats.accepted, label: "Accepted", color: "text-primary" },
          { n: stats.rewardReady, label: "Reward Ready", color: "text-primary", icon: <Sparkles className="w-2.5 h-2.5 inline" /> },
          { n: stats.distributed, label: "Distributed", color: "text-muted-foreground", icon: <Gift className="w-2.5 h-2.5 inline" /> },
        ].map(s => (
          <Card key={s.label} className="bg-card/30 border-border/20">
            <CardContent className="p-2 text-center">
              <span className={`text-lg font-mono font-bold block ${s.color}`}>{s.n}</span>
              <span className="text-[8px] text-muted-foreground/60 flex items-center justify-center gap-0.5">
                {s.icon} {s.label}
              </span>
            </CardContent>
          </Card>
        ))}
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
            {f.value === "reward_ready" && stats.rewardReady > 0 && (
              <Badge variant="secondary" className="ml-1 text-[8px] h-3.5 px-1">{stats.rewardReady}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Categories */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <TreeDeciduous className="w-3.5 h-3.5 text-primary" />
            Task Categories
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

      {/* By type */}
      {Object.keys(stats.byType).length > 0 && (
        <Card className="bg-card/30 border-border/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              By Type
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
      ) : events.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-6">No contributions match this filter.</p>
      ) : showGrouped ? (
        <div className="space-y-3">
          {pendingEvents.length > 0 && <EventGroup title="Awaiting Steward Attention" icon={<Clock className="w-3 h-3 text-accent-foreground" />} events={pendingEvents} />}
          {readyEvents.length > 0 && <EventGroup title="Reward Ready" icon={<Sparkles className="w-3 h-3 text-primary" />} events={readyEvents} elevated />}
          {otherAccepted.length > 0 && <EventGroup title="Accepted" icon={<CheckCircle className="w-3 h-3 text-primary" />} events={otherAccepted} />}
          {distributedEvents.length > 0 && <EventGroup title="Hearts Distributed" icon={<Gift className="w-3 h-3 text-muted-foreground" />} events={distributedEvents} muted />}
          {rejectedEvents.length > 0 && <EventGroup title="Rejected" icon={<XCircle className="w-3 h-3 text-destructive" />} events={rejectedEvents} muted />}
        </div>
      ) : (
        <EventGroup title={FILTERS.find(f => f.value === filter)?.label || "Results"} events={events} elevated={filter === "reward_ready"} />
      )}
    </div>
  );
}

function EventGroup({ title, icon, events, elevated, muted }: { title: string; icon?: React.ReactNode; events: any[]; elevated?: boolean; muted?: boolean }) {
  if (!events.length) return null;
  return (
    <Card className={`border-border/20 ${elevated ? "bg-primary/5 border-primary/15" : muted ? "bg-card/20 opacity-80" : "bg-card/30"}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          {icon || <Heart className="w-3.5 h-3.5 text-primary" />}
          {title}
          <Badge variant="outline" className="text-[8px] ml-auto">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1">
        {events.map((evt: any) => <EventRow key={evt.id} evt={evt} />)}
      </CardContent>
    </Card>
  );
}

function EventRow({ evt }: { evt: any }) {
  const agent = evt.agent_profiles as { agent_name: string; avatar_emoji: string | null } | null;
  const payload = evt.payload_json as Record<string, any> | null;
  const isReady = evt.reward_status === "ready";
  const isDist = evt.reward_status === "distributed";
  const isRejected = evt.validation_status === "rejected";

  const valIcon = isRejected ? "❌" : isDist ? "✅" : isReady ? "💚" : evt.validation_status === "accepted" ? "✅" : "⏳";

  return (
    <div className={`flex items-center justify-between text-[11px] py-1 px-1 rounded ${isReady ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px]">{valIcon}</span>
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
            isReady ? "text-primary font-semibold" : isDist ? "text-muted-foreground line-through" : "text-muted-foreground/60"
          }`}>
            +{evt.hearts_awarded}♡
          </span>
        )}
        {isDist && <Gift className="w-2.5 h-2.5 text-muted-foreground/50" />}
      </div>
    </div>
  );
}
