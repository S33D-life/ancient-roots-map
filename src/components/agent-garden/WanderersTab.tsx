/**
 * WanderersTab — "First Wanderer" tab for the Agent Garden.
 * Shows journeys with health/trends, runs, findings with evidence, recurring patterns, and curator controls.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Footprints, Play, CheckCircle2, XCircle, AlertTriangle, Clock,
  Eye, Bug, Sparkles, ChevronRight, Loader2, Filter, Leaf,
  Globe, Terminal, Wifi, Zap, Copy, Check, TrendingUp, TrendingDown, Minus, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWanderer } from "@/hooks/use-wanderer";
import { useHasRole } from "@/hooks/use-role";
import { savePatternStatus, type PatternStatus, type RecurringPattern } from "@/lib/wanderer-patterns";
import type { AgentRun, AgentFinding } from "@/lib/wanderer-types";
import type { TrendDirection } from "@/lib/wanderer-patterns";
import { toast } from "sonner";

/* ── Status helpers ───────────────────────────────── */
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  passed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Passed", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  needs_review: { icon: <Eye className="w-3.5 h-3.5" />, label: "Needs tending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  running: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: "Running", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  queued: { icon: <Clock className="w-3.5 h-3.5" />, label: "Queued", className: "bg-muted text-muted-foreground border-border" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-serif border ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === "improving") return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (trend === "worsening") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground/50" />;
}

const SEVERITY_COLORS: Record<string, string> = { high: "text-red-500", medium: "text-amber-500", low: "text-muted-foreground" };

const CATEGORY_LABELS: Record<string, string> = {
  "route-mismatch": "🗺️ Route mismatch", "auth-redirect": "🔐 Auth redirect",
  "stale-selector": "🔧 Stale selector", "missing-element": "❌ Missing element",
  "hidden-element": "👻 Hidden element", "wrong-content": "📝 Wrong content",
  "slow-response": "🐢 Slow response", "load-timeout": "⏳ Load timeout",
  "console-errors": "🖥️ Console errors", "network-errors": "📡 Network errors",
};

const PATTERN_STATUS_LABELS: Record<PatternStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  known: { label: "Known", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  watching: { label: "Watching", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  resolved_candidate: { label: "May be resolved", className: "bg-green-500/10 text-green-600 border-green-500/20" },
};

function buildReproSummary(finding: AgentFinding): string {
  const trace = finding.trace_json as Record<string, any> | null;
  const parts = [
    `**${finding.title}**`,
    `Type: ${finding.type} · Severity: ${finding.severity}`,
    finding.route ? `Route: ${finding.route}` : null,
    trace?.category ? `Category: ${CATEGORY_LABELS[trace.category] || trace.category}` : null,
    trace?.action ? `Action: ${trace.action} on "${trace.target}"` : null,
    trace?.error ? `Error: ${trace.error}` : null,
    trace?.snapshot?.headingText ? `Page heading: "${trace.snapshot.headingText}"` : null,
    trace?.urlBefore && trace?.urlAfter !== trace?.urlBefore ? `Navigation: ${trace.urlBefore} → ${trace.urlAfter}` : null,
    `\n${finding.description}`,
  ].filter(Boolean);
  return parts.join("\n");
}

/* ── Main Tab ─────────────────────────────────────── */
export function WanderersTab() {
  const {
    journeys, runs, findings, loading, running,
    smokeRunning, smokeProgress, journeyHealth, recurringPatterns,
    startRun, runSmokeSuite, reviewFinding, convertToBugReport,
  } = useWanderer();
  const { hasRole: isKeeper } = useHasRole("keeper");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<AgentFinding | null>(null);

  const filteredRuns = statusFilter === "all" ? runs : runs.filter(r => r.status === statusFilter);
  const runFindings = selectedRun ? findings.filter(f => f.run_id === selectedRun.id) : [];
  const pendingFindings = findings.filter(f => f.review_status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground font-serif">Loading wanderer data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 flex items-start gap-4"
        style={{ background: "linear-gradient(135deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.25))", border: "1px solid hsl(var(--primary) / 0.15)" }}
      >
        <Footprints className="w-10 h-10 text-primary shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="font-serif text-xl text-foreground mb-1">The First Wanderer</h2>
          <p className="text-xs font-serif text-primary/60 tracking-[0.15em] uppercase mb-2">Guided UI Testing Agent</p>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            A careful wandering steward that walks the app's paths, capturing real console errors, network failures,
            and DOM evidence. Findings are saved for curator review — never auto-published.
          </p>
          {isKeeper && (
            <Button size="sm" variant="outline" className="mt-3 text-xs font-serif gap-1.5" disabled={smokeRunning || running} onClick={() => runSmokeSuite()}>
              {smokeRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Run Smoke Suite
            </Button>
          )}
        </div>
      </div>

      {/* Smoke progress */}
      {smokeProgress && smokeRunning && (
        <div className="rounded-xl p-3 text-xs font-serif space-y-1.5" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.15)" }}>
          <p className="text-muted-foreground">Smoke suite: {smokeProgress.current}/{smokeProgress.total}</p>
          <div className="flex flex-wrap gap-1.5">
            {smokeProgress.results.map(r => (
              <span key={r.slug} className="inline-flex items-center gap-1">
                <StatusPill status={r.status} />
                <span className="text-[9px] text-muted-foreground">{r.slug}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Journeys", value: journeys.length, icon: <Footprints className="w-4 h-4" /> },
          { label: "Total Runs", value: runs.length, icon: <Play className="w-4 h-4" /> },
          { label: "Pending", value: pendingFindings.length, icon: <Eye className="w-4 h-4" /> },
          { label: "Recurring", value: recurringPatterns.length, icon: <RotateCcw className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.15)" }}>
            <div className="flex items-center justify-center gap-1 text-primary mb-1">{s.icon}</div>
            <p className="text-lg font-serif font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-serif text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recurring Patterns */}
      {recurringPatterns.length > 0 && (
        <Card className="border-primary/10 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" /> Recurring Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recurringPatterns.slice(0, 8).map((p) => (
              <PatternRow key={p.key} pattern={p} isKeeper={isKeeper} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Journeys with health signals + trends */}
      <Card className="border-primary/10 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Footprints className="w-4 h-4 text-primary" /> Journeys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {journeys.map((j) => {
            const health = journeyHealth.get(j.id);
            return (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-accent/5" style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-serif font-medium text-foreground">{j.title}</p>
                  <p className="text-[10px] font-serif text-muted-foreground truncate">
                    {j.entry_path} · {(j.steps_json as any[])?.length || 0} steps
                  </p>
                  {health?.lastStatus && (
                    <div className="flex items-center gap-2 mt-1">
                      <StatusPill status={health.lastStatus} />
                      <TrendIcon trend={health.trend} />
                      <span className="text-[9px] font-serif text-muted-foreground">{health.passRate}% pass</span>
                      {health.lastFindingCount > 0 && (
                        <span className="text-[9px] font-serif text-amber-500">{health.lastFindingCount} finding{health.lastFindingCount > 1 ? "s" : ""}</span>
                      )}
                      {health.lastRunMs != null && (
                        <span className="text-[9px] font-serif text-muted-foreground/60">{(health.lastRunMs / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isKeeper && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-serif" disabled={running || smokeRunning} onClick={() => startRun(j)}>
                      {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      <span className="ml-1">Run</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {journeys.length === 0 && <p className="text-xs text-muted-foreground font-serif text-center py-4">No journeys defined yet.</p>}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card className="border-primary/10 bg-card/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> Recent Runs
            </CardTitle>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground" />
              {["all", "passed", "failed", "needs_review"].map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`text-[10px] font-serif px-2 py-0.5 rounded-full transition-colors ${statusFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {f === "all" ? "All" : f === "needs_review" ? "Needs tending" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredRuns.map((run) => (
            <button key={run.id} onClick={() => { setSelectedRun(run); setSelectedFinding(null); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:bg-accent/5 ${selectedRun?.id === run.id ? "bg-accent/10 ring-1 ring-primary/20" : ""}`}
              style={{ border: "1px solid hsl(var(--border) / 0.1)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-serif text-foreground">{(run.agent_journeys as any)?.title || "Journey"}</p>
                <p className="text-[10px] font-serif text-muted-foreground">{new Date(run.created_at).toLocaleString()} · Score: {run.score ?? "—"}/100</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <StatusPill status={run.status} />
                <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              </div>
            </button>
          ))}
          {filteredRuns.length === 0 && <p className="text-xs text-muted-foreground font-serif text-center py-4">No runs yet.</p>}
        </CardContent>
      </Card>

      {/* Run Detail / Findings */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <Card className="border-primary/10 bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Run Detail <StatusPill status={selectedRun.status} />
                </CardTitle>
                {selectedRun.summary && <p className="text-xs font-serif text-muted-foreground mt-1">{selectedRun.summary}</p>}
                {selectedRun.environment && <p className="text-[9px] font-serif text-muted-foreground/60 mt-0.5 truncate">{selectedRun.environment}</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider mb-2">Findings ({runFindings.length})</p>
                {runFindings.map((f) => (
                  <FindingRow key={f.id} finding={f} isKeeper={isKeeper} isSelected={selectedFinding?.id === f.id}
                    onSelect={() => setSelectedFinding(selectedFinding?.id === f.id ? null : f)}
                    onReview={reviewFinding} onConvert={convertToBugReport}
                  />
                ))}
                {runFindings.length === 0 && <p className="text-xs text-muted-foreground font-serif text-center py-3">No findings — journey passed cleanly 🌿</p>}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pattern Row ──────────────────────────────────── */
function PatternRow({ pattern, isKeeper }: { pattern: RecurringPattern; isKeeper: boolean }) {
  const [status, setStatus] = useState<PatternStatus>(pattern.status);
  const statusCfg = PATTERN_STATUS_LABELS[status];

  const handleStatus = (newStatus: PatternStatus) => {
    setStatus(newStatus);
    savePatternStatus(pattern.key, newStatus);
    toast.success(`Pattern marked as "${newStatus.replace("_", " ")}"`);
  };

  return (
    <div className="p-3 rounded-lg" style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-serif font-medium text-foreground truncate">{pattern.title}</p>
            {pattern.isFlaky && (
              <span className="text-[9px] font-serif px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">⚡ Flaky</span>
            )}
            <span className={`text-[9px] font-serif px-1.5 py-0.5 rounded-full border ${statusCfg.className}`}>{statusCfg.label}</span>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground mt-0.5">
            {CATEGORY_LABELS[pattern.category] || pattern.category}
            {pattern.route && <span> · {pattern.route}</span>}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[9px] font-serif text-muted-foreground">
            <span>Seen <strong className="text-foreground">{pattern.count}×</strong></span>
            <span className={SEVERITY_COLORS[pattern.latestSeverity]}>{pattern.latestSeverity}</span>
            <span>{pattern.journeySlugs.length} journey{pattern.journeySlugs.length > 1 ? "s" : ""}</span>
            <span>{new Date(pattern.latestSeen).toLocaleDateString()}</span>
          </div>
        </div>
        {isKeeper && (
          <div className="flex gap-1 shrink-0">
            {(["known", "watching", "resolved_candidate"] as PatternStatus[]).filter(s => s !== status).map(s => (
              <button key={s} onClick={() => handleStatus(s)}
                className="text-[9px] font-serif px-1.5 py-0.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                {s === "known" ? "Known" : s === "watching" ? "Watch" : "Resolved?"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Finding Row with rich evidence + copy repro ──── */
function FindingRow({
  finding, isKeeper, isSelected, onSelect, onReview, onConvert,
}: {
  finding: AgentFinding; isKeeper: boolean; isSelected: boolean;
  onSelect: () => void;
  onReview: (id: string, status: string, notes?: string) => Promise<void>;
  onConvert: (f: AgentFinding) => Promise<string | undefined>;
}) {
  const [copied, setCopied] = useState(false);
  const typeIcon = {
    bug: <Bug className="w-3.5 h-3.5 text-red-500" />,
    ux_friction: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    insight: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
    spark: <Sparkles className="w-3.5 h-3.5 text-primary" />,
  }[finding.type] || <Eye className="w-3.5 h-3.5" />;

  const trace = finding.trace_json as Record<string, any> | null;
  const category = trace?.category as string | undefined;

  const handleCopyRepro = useCallback(async () => {
    const text = buildReproSummary(finding);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Repro summary copied");
    setTimeout(() => setCopied(false), 2000);
  }, [finding]);

  return (
    <div className={`rounded-lg transition-colors ${isSelected ? "bg-accent/10 ring-1 ring-primary/20" : "hover:bg-accent/5"}`} style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
      <button onClick={onSelect} className="w-full flex items-center gap-3 p-3 text-left">
        {typeIcon}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-serif text-foreground truncate">{finding.title}</p>
          <p className="text-[10px] font-serif text-muted-foreground">
            {category && <span className="mr-1">{CATEGORY_LABELS[category] || category}</span>}
            {finding.route && <span>· {finding.route} </span>}
            <span className={SEVERITY_COLORS[finding.severity]}>· {finding.severity}</span>
            {finding.review_status !== "pending" && <span className="ml-1">· {finding.review_status.replace(/_/g, " ")}</span>}
          </p>
        </div>
        <Badge variant="outline" className="text-[9px] font-serif shrink-0">{finding.type.replace("_", " ")}</Badge>
      </button>

      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/10">
              <p className="text-xs font-serif text-muted-foreground whitespace-pre-line">{finding.description}</p>

              {trace && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-serif mt-2 p-2 rounded-md bg-muted/30">
                  {category && (<><span className="text-muted-foreground">Category</span><span className="text-foreground font-medium">{CATEGORY_LABELS[category] || category}</span></>)}
                  {trace.action && (<><span className="text-muted-foreground">Action</span><span className="text-foreground font-medium">{trace.action}</span></>)}
                  {trace.target && (<><span className="text-muted-foreground">Target</span><span className="text-foreground truncate">{String(trace.target).slice(0, 60)}</span></>)}
                  {trace.urlBefore && (<><span className="text-muted-foreground flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Route</span><span className="text-foreground">{trace.urlBefore}{trace.urlAfter !== trace.urlBefore ? ` → ${trace.urlAfter}` : ""}</span></>)}
                  {trace.snapshot?.headingText && (<><span className="text-muted-foreground">Page heading</span><span className="text-foreground truncate">"{trace.snapshot.headingText}"</span></>)}
                  {trace.snapshot?.resolvedSelector && (<><span className="text-muted-foreground">Resolved to</span><span className="text-foreground truncate">{trace.snapshot.resolvedSelector}</span></>)}
                  {trace.durationMs != null && (<><span className="text-muted-foreground">Duration</span><span className="text-foreground">{Math.round(trace.durationMs)}ms</span></>)}
                  {trace.consoleErrors?.length > 0 && (<><span className="text-muted-foreground flex items-center gap-1"><Terminal className="w-2.5 h-2.5" /> Console</span><span className="text-red-500">{trace.consoleErrors.length} error(s)</span></>)}
                  {trace.networkErrors?.length > 0 && (<><span className="text-muted-foreground flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> Network</span><span className="text-red-500">{trace.networkErrors.length} failure(s)</span></>)}
                </div>
              )}

              {trace?.consoleErrors?.length > 0 && (
                <div className="text-[9px] font-mono text-red-400/80 bg-muted/20 rounded p-1.5 max-h-24 overflow-y-auto space-y-0.5">
                  {(trace.consoleErrors as string[]).slice(0, 5).map((e: string, i: number) => (
                    <p key={i} className="truncate">• {e.slice(0, 120)}</p>
                  ))}
                </div>
              )}

              {finding.curator_notes && <p className="text-xs font-serif text-primary/80 italic">Curator: {finding.curator_notes}</p>}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif" onClick={handleCopyRepro}>
                  {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied" : "Copy repro"}
                </Button>
                {isKeeper && finding.review_status === "pending" && (
                  <>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif" onClick={() => onConvert(finding)}>
                      <Bug className="w-3 h-3 mr-1" /> File as Bug
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif" onClick={() => onReview(finding.id, "approved_as_spark")}>
                      <Sparkles className="w-3 h-3 mr-1" /> Approve as Spark
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif text-muted-foreground" onClick={() => onReview(finding.id, "dismissed")}>
                      Dismiss
                    </Button>
                  </>
                )}
              </div>

              {finding.suggested_bug_garden_post_id && <p className="text-[10px] font-serif text-green-600">✓ Filed in Bug Garden</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
