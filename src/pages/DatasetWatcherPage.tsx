/**
 * Dataset Watcher / Refresh Agent — calm stewardship monitoring for approved tree datasets.
 * Extends the Tree Data Commons lifecycle: discover → approve → seed → watch → refresh.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useDatasetWatcher,
  type WatchedSource,
} from "@/hooks/use-dataset-watcher";
import {
  Eye, EyeOff, RefreshCw, Check, Clock, AlertTriangle, Pause, Play,
  ExternalLink, ChevronRight, BookOpen, Telescope, Globe, Database,
  TreeDeciduous, Layers, Shield, Sparkles, Activity,
} from "lucide-react";

/* ── Status visual helpers ── */
const STATUS_STYLES: Record<string, { color: string; icon: typeof Eye }> = {
  watching: { color: "bg-primary/15 text-primary border-primary/30", icon: Eye },
  stable: { color: "bg-primary/20 text-primary border-primary/40", icon: Check },
  possible_change: { color: "bg-accent/20 text-accent-foreground border-accent/40", icon: AlertTriangle },
  confirmed_change: { color: "bg-destructive/20 text-destructive border-destructive/40", icon: AlertTriangle },
  check_failed: { color: "bg-destructive/15 text-destructive/70 border-destructive/30", icon: AlertTriangle },
  paused: { color: "bg-muted text-muted-foreground border-border", icon: Pause },
};

const REC_STYLES: Record<string, string> = {
  no_action: "bg-primary/10 text-primary/70",
  review_only: "bg-accent/15 text-accent-foreground",
  reseed_subset: "bg-accent/20 text-accent-foreground",
  delta_import: "bg-primary/20 text-primary",
  full_reimport: "bg-destructive/15 text-destructive",
  manual_follow_up: "bg-muted text-muted-foreground",
};

const REC_LABELS: Record<string, string> = {
  no_action: "No Action",
  review_only: "Review Only",
  reseed_subset: "Reseed Subset",
  delta_import: "Delta Import",
  full_reimport: "Full Reimport",
  manual_follow_up: "Manual Follow-up",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={`text-xs capitalize ${style?.color ?? ""}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  return (
    <Badge variant="outline" className={`text-xs ${REC_STYLES[rec] ?? ""}`}>
      {REC_LABELS[rec] ?? rec.replace(/_/g, " ")}
    </Badge>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Overview Stats ── */
function WatcherOverview({ stats }: { stats: ReturnType<typeof useDatasetWatcher>["stats"] }) {
  const metrics = [
    { label: "Total Sources", value: stats.total, icon: Database },
    { label: "Watching", value: stats.watching, icon: Eye },
    { label: "Needs Review", value: stats.needsReview, icon: AlertTriangle },
    { label: "Stable", value: stats.stable, icon: Check },
    { label: "Changes", value: stats.withChanges, icon: Activity },
    { label: "Paused", value: stats.paused, icon: Pause },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-3 text-center">
              <m.icon className="w-4 h-4 mx-auto mb-1 text-primary/60" />
              <p className="text-lg font-serif font-bold text-primary">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Refresh Pack Card ── */
function RefreshPack({ ws }: { ws: WatchedSource }) {
  const pack = {
    dataset: ws.source.name,
    country: ws.source.country,
    region: ws.source.region,
    source_url: ws.source.url,
    what_changed: ws.watch?.change_explanation ?? "Unknown",
    change_confidence: ws.watch?.change_confidence ?? "low",
    recommended_strategy: REC_LABELS[ws.watch?.refresh_recommendation ?? "review_only"],
    existing_seeds_valid: ws.watch?.change_confidence === "low" ? "Likely still valid" : "Review recommended",
    subset_update_possible: ws.watch?.refresh_recommendation === "reseed_subset",
    notes: ws.watch?.watch_notes ?? "No notes",
    current_record_count: ws.source.record_count,
    last_known_count: ws.watch?.last_known_record_count,
  };

  return (
    <Card className="border-primary/20 bg-card/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Refresh Pack
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto text-foreground whitespace-pre-wrap font-mono">
{JSON.stringify(pack, null, 2)}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Review this pack before taking any reseed action. Human approval required.
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Watched Source Card ── */
function WatchedSourceCard({
  ws,
  onCheck,
  onToggle,
  onMarkStable,
}: {
  ws: WatchedSource;
  onCheck: (sourceId: string, source: WatchedSource["source"]) => void;
  onToggle: (sourceId: string, enabled: boolean) => void;
  onMarkStable: (watchId: string) => void;
}) {
  const [showPack, setShowPack] = useState(false);
  const watch = ws.watch;
  const isPaused = watch?.watch_status === "paused";
  const hasChange = watch?.change_detected;

  return (
    <Card className={`border-primary/15 bg-card/60 transition-all ${hasChange ? "border-accent/40" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-serif flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="block">{ws.source.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-sans">
              {ws.source.country && <><Globe className="w-3 h-3" /> {ws.source.country}</>}
              {ws.source.region && <span>· {ws.source.region}</span>}
            </div>
          </div>
          {ws.source.url && (
            <a href={ws.source.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {watch && <StatusBadge status={watch.watch_status} />}
          {watch && <RecommendationBadge rec={watch.refresh_recommendation} />}
          <Badge variant="outline" className="text-xs capitalize">{ws.source.source_type}</Badge>
          <Badge variant="outline" className="text-xs capitalize">{ws.source.data_format}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Checked: {timeAgo(watch?.last_checked_at ?? null)}
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3" />
            Success: {timeAgo(watch?.last_successful_check_at ?? null)}
          </div>
          {ws.source.record_count != null && (
            <div className="flex items-center gap-1.5">
              <TreeDeciduous className="w-3 h-3" />
              Records: {ws.source.record_count.toLocaleString()}
            </div>
          )}
          {watch && (
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Checks: {watch.check_count}
            </div>
          )}
        </div>

        {/* Change explanation */}
        {watch?.change_explanation && (
          <div className={`p-3 rounded-lg text-sm ${hasChange ? "bg-accent/10 border border-accent/30" : "bg-muted/20 border border-border/30"}`}>
            <div className="flex items-start gap-2">
              {hasChange ? (
                <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              ) : (
                <Shield className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-foreground">{watch.change_explanation}</p>
                {hasChange && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Confidence: <span className="capitalize font-medium">{watch.change_confidence}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Watch notes */}
        {watch?.watch_notes && (
          <p className="text-xs text-muted-foreground italic">{watch.watch_notes}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
          <Button size="sm" variant="outline" onClick={() => onCheck(ws.source.id, ws.source)}>
            <RefreshCw className="w-3 h-3 mr-1" /> Check Now
          </Button>
          {isPaused ? (
            <Button size="sm" variant="outline" onClick={() => onToggle(ws.source.id, true)}>
              <Play className="w-3 h-3 mr-1" /> Resume
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onToggle(ws.source.id, false)}>
              <Pause className="w-3 h-3 mr-1" /> Pause
            </Button>
          )}
          {hasChange && watch && (
            <Button size="sm" variant="ghost" onClick={() => onMarkStable(watch.id)}>
              <Check className="w-3 h-3 mr-1" /> Mark Stable
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowPack(!showPack)}>
            <Sparkles className="w-3 h-3 mr-1" /> {showPack ? "Hide" : "Refresh Pack"}
          </Button>
        </div>

        {showPack && <RefreshPack ws={ws} />}
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */
const DatasetWatcherPage = () => {
  const {
    watchedSources, loading, filter, setFilter, stats,
    toggleWatch, runManualCheck, markStable,
  } = useDatasetWatcher();

  const needsReview = watchedSources.filter(ws => ws.watch?.change_detected);
  const stable = watchedSources.filter(ws => ws.watch?.watch_status === "stable");
  const paused = watchedSources.filter(ws => ws.watch?.watch_status === "paused");
  const active = watchedSources.filter(ws =>
    !ws.watch || (ws.watch.watch_enabled && !ws.watch.change_detected && ws.watch.watch_status !== "stable")
  );

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
                <Eye className="w-6 h-6" /> Dataset Watcher
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                A quiet observer that notices when approved datasets may have changed
                and gently invites the steward to review.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link to="/discovery-agent">
                  <Telescope className="w-3.5 h-3.5 mr-1" /> Discovery
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/tree-data-commons">
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> Commons
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <WatcherOverview stats={stats} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter.status ?? "all"} onValueChange={v => setFilter(f => ({ ...f, status: v === "all" ? undefined : v }))}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="watching">Watching</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="possible_change">Possible Change</SelectItem>
              <SelectItem value="confirmed_change">Confirmed Change</SelectItem>
              <SelectItem value="check_failed">Check Failed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.recommendation ?? "all"} onValueChange={v => setFilter(f => ({ ...f, recommendation: v === "all" ? undefined : v }))}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Recommendation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recommendations</SelectItem>
              <SelectItem value="no_action">No Action</SelectItem>
              <SelectItem value="review_only">Review Only</SelectItem>
              <SelectItem value="reseed_subset">Reseed Subset</SelectItem>
              <SelectItem value="delta_import">Delta Import</SelectItem>
              <SelectItem value="full_reimport">Full Reimport</SelectItem>
              <SelectItem value="manual_follow_up">Manual Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 overflow-x-auto">
            <TabsTrigger value="all" className="text-xs">All Sources ({watchedSources.length})</TabsTrigger>
            <TabsTrigger value="review" className="text-xs">Needs Review ({needsReview.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="stable" className="text-xs">Stable ({stable.length})</TabsTrigger>
            <TabsTrigger value="paused" className="text-xs">Paused ({paused.length})</TabsTrigger>
          </TabsList>

          {(["all", "review", "active", "stable", "paused"] as const).map(tab => {
            const list = tab === "all" ? watchedSources
              : tab === "review" ? needsReview
              : tab === "active" ? active
              : tab === "stable" ? stable
              : paused;

            return (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading watched datasets…</p>
                ) : list.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      {tab === "review" ? "No datasets flagged for review." :
                       tab === "paused" ? "No paused watches." :
                       "No sources in this view."}
                    </p>
                    {tab === "all" && watchedSources.length === 0 && (
                      <p className="text-xs mt-1">
                        Sources will appear here once they're registered in the{" "}
                        <Link to="/tree-data-commons" className="text-primary underline">Tree Data Commons</Link>.
                      </p>
                    )}
                  </div>
                ) : (
                  list.map(ws => (
                    <WatchedSourceCard
                      key={ws.source.id}
                      ws={ws}
                      onCheck={runManualCheck}
                      onToggle={toggleWatch}
                      onMarkStable={markStable}
                    />
                  ))
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Connected Systems */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-sm font-serif text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Connected Systems
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
              { label: "Discovery Agent", to: "/discovery-agent", icon: "🔭" },
              { label: "Expansion Map", to: "/atlas-expansion", icon: "🌍" },
              { label: "Seed-Plan Generator", to: "/seed-plan-generator", icon: "🌱" },
              { label: "Canopy Projection", to: "/canopy-projection", icon: "🔮" },
              { label: "Atlas Map", to: "/map", icon: "🗺" },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/40 transition-all group text-sm">
                <span>{link.icon}</span>
                <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default DatasetWatcherPage;
