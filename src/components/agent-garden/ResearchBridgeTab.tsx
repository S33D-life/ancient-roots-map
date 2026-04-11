/**
 * ResearchBridgeTab — Curator interface for the crawl → candidate → research tree → Ancient Friend pipeline.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreeDeciduous, Loader2, Play, CheckCircle2, XCircle, Eye, ChevronRight,
  Filter, MapPin, Sprout, ArrowRight, ClipboardCheck, AlertTriangle, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResearchBridge } from "@/hooks/use-research-bridge";
import { useHasRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database as DB } from "@/integrations/supabase/types";

type SourceCandidate = DB["public"]["Tables"]["source_tree_candidates"]["Row"];
type VerificationTask = DB["public"]["Tables"]["verification_tasks"]["Row"];

const STATUS_COLORS: Record<string, string> = {
  raw: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  normalized: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  promoted: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  duplicate: "bg-muted text-muted-foreground border-border",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  claimed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  expired: "bg-muted text-muted-foreground border-border",
};

const TASK_TYPE_ICONS: Record<string, string> = {
  confirm_location: "📍",
  confirm_species: "🌿",
  add_photo: "📷",
  visit_in_person: "🚶",
  general_review: "🔍",
};

export function ResearchBridgeTab() {
  const {
    candidates, crawlRuns, verificationTasks, stats, loading,
    promoteCandidate, rejectCandidate,
    createVerificationTasks, claimTask, completeTask,
  } = useResearchBridge();
  const { hasRole: isKeeper } = useHasRole("keeper");
  const [candidateFilter, setCandidateFilter] = useState<string>("raw");
  const [selectedCandidate, setSelectedCandidate] = useState<SourceCandidate | null>(null);

  const filteredCandidates = candidateFilter === "all"
    ? candidates
    : candidates.filter(c => c.normalization_status === candidateFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground font-serif">Loading Research Bridge…</span>
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
        <TreeDeciduous className="w-10 h-10 text-primary shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="font-serif text-xl text-foreground mb-1">Research Forest Bridge</h2>
          <p className="text-xs font-serif text-primary/60 tracking-[0.15em] uppercase mb-2">Source → Candidate → Research → Ancient Friend</p>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            The staged pipeline from AI-discovered tree data to verified Ancient Friends.
            Each tree must pass through human verification before joining the confirmed map.
          </p>
        </div>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Crawl Runs", value: stats.totalCrawlRuns, icon: <Database className="w-4 h-4" /> },
            { label: "Raw Candidates", value: stats.rawCandidates, icon: <Sprout className="w-4 h-4" /> },
            { label: "Promoted", value: stats.promotedCandidates, icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Open Tasks", value: stats.openVerificationTasks, icon: <ClipboardCheck className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.15)" }}>
              <div className="flex items-center justify-center gap-1 text-primary mb-1">{s.icon}</div>
              <p className="text-lg font-serif font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] font-serif text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Flow Visual */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-serif text-muted-foreground py-2">
        <span className="px-2 py-1 rounded bg-muted/30">Source</span>
        <ArrowRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600">Crawl</span>
        <ArrowRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500">Candidate</span>
        <ArrowRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-green-500/10 text-green-600">Research Tree</span>
        <ArrowRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-primary/10 text-primary">Ancient Friend 🌳</span>
      </div>

      {/* Recent Crawl Runs */}
      {crawlRuns.length > 0 && (
        <Card className="border-primary/10 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Recent Crawl Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {crawlRuns.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 rounded-lg" style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-serif text-foreground">
                    {(run as any).tree_data_sources?.name || "Source"}
                  </p>
                  <p className="text-[10px] font-serif text-muted-foreground">
                    {new Date(run.created_at).toLocaleString()} · {run.pages_scraped} pages · {run.candidates_found} candidates
                  </p>
                </div>
                <Badge variant="outline" className={`text-[9px] ${STATUS_COLORS[run.status] || ""}`}>
                  {run.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Candidate Review */}
      <Card className="border-primary/10 bg-card/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" /> Source Candidates
            </CardTitle>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground" />
              {["raw", "promoted", "rejected", "all"].map((f) => (
                <button key={f} onClick={() => setCandidateFilter(f)}
                  className={`text-[10px] font-serif px-2 py-0.5 rounded-full transition-colors ${candidateFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCandidates.length === 0 && (
            <p className="text-xs text-muted-foreground font-serif text-center py-4">
              {candidateFilter === "raw" ? "No raw candidates awaiting review." : "No candidates found."}
            </p>
          )}
          {filteredCandidates.slice(0, 20).map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              isKeeper={isKeeper}
              isSelected={selectedCandidate?.id === c.id}
              onSelect={() => setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)}
              onPromote={() => promoteCandidate(c.id, c.source_id)}
              onReject={() => rejectCandidate(c.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Verification Tasks */}
      <Card className="border-primary/10 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Verification Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {verificationTasks.length === 0 && (
            <p className="text-xs text-muted-foreground font-serif text-center py-4">
              No verification tasks yet. Promote candidates to research trees, then generate tasks.
            </p>
          )}
          {verificationTasks.slice(0, 15).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg" style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-serif text-foreground">
                  {TASK_TYPE_ICONS[task.task_type] || "🔍"} {task.title}
                </p>
                <p className="text-[10px] font-serif text-muted-foreground">
                  {task.task_type.replace(/_/g, " ")} · {task.hearts_reward} 💚
                  {task.claimed_by && " · Claimed"}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] ${TASK_STATUS_COLORS[task.status] || ""}`}>
                {task.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Candidate Row ────────────────────────────────── */
function CandidateRow({
  candidate, isKeeper, isSelected, onSelect, onPromote, onReject,
}: {
  candidate: SourceCandidate; isKeeper: boolean; isSelected: boolean;
  onSelect: () => void; onPromote: () => void; onReject: () => void;
}) {
  const raw = candidate.raw_data as Record<string, any> || {};

  return (
    <div className={`rounded-lg transition-colors ${isSelected ? "bg-accent/10 ring-1 ring-primary/20" : "hover:bg-accent/5"}`} style={{ border: "1px solid hsl(var(--border) / 0.1)" }}>
      <button onClick={onSelect} className="w-full flex items-center gap-3 p-3 text-left">
        <Sprout className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-serif text-foreground truncate">
            {candidate.raw_name || candidate.raw_species || "Unnamed candidate"}
          </p>
          <p className="text-[10px] font-serif text-muted-foreground">
            {candidate.raw_species && <span>{candidate.raw_species} · </span>}
            {candidate.raw_country && <span>{candidate.raw_country} · </span>}
            {candidate.raw_location_text && <span className="truncate">{candidate.raw_location_text.slice(0, 40)}</span>}
          </p>
        </div>
        <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[candidate.normalization_status] || ""}`}>
          {candidate.normalization_status}
        </Badge>
      </button>

      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/10">
              {/* Evidence grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-serif p-2 rounded-md bg-muted/30">
                {candidate.raw_name && (<><span className="text-muted-foreground">Name</span><span className="text-foreground">{candidate.raw_name}</span></>)}
                {candidate.raw_species && (<><span className="text-muted-foreground">Species</span><span className="text-foreground">{candidate.raw_species}</span></>)}
                {candidate.raw_latitude && (<><span className="text-muted-foreground">Coordinates</span><span className="text-foreground">{candidate.raw_latitude?.toFixed(4)}, {candidate.raw_longitude?.toFixed(4)}</span></>)}
                {candidate.raw_country && (<><span className="text-muted-foreground">Country</span><span className="text-foreground">{candidate.raw_country}</span></>)}
                {candidate.raw_location_text && (<><span className="text-muted-foreground">Location</span><span className="text-foreground truncate">{candidate.raw_location_text}</span></>)}
                <span className="text-muted-foreground">Confidence</span>
                <span className="text-foreground">{Number(candidate.confidence_score || 0).toFixed(0)}%</span>
              </div>

              {/* Raw data preview */}
              {Object.keys(raw).length > 0 && (
                <details className="text-[9px] font-mono">
                  <summary className="text-muted-foreground cursor-pointer">Raw data ({Object.keys(raw).length} fields)</summary>
                  <pre className="mt-1 p-1.5 rounded bg-muted/20 max-h-24 overflow-y-auto text-muted-foreground">
                    {JSON.stringify(raw, null, 2).slice(0, 500)}
                  </pre>
                </details>
              )}

              {candidate.reviewer_notes && (
                <p className="text-xs font-serif text-primary/80 italic">Notes: {candidate.reviewer_notes}</p>
              )}

              {/* Actions */}
              {isKeeper && candidate.normalization_status === "raw" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif" onClick={onPromote}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Promote to Research
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] font-serif text-muted-foreground" onClick={onReject}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              )}

              {candidate.promoted_research_tree_id && (
                <p className="text-[10px] font-serif text-green-600">✓ Promoted to Research Forest</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
