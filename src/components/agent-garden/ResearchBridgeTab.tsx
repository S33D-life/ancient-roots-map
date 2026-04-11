/**
 * ResearchBridgeTab — Curator interface for the crawl → candidate → research tree → Ancient Friend pipeline.
 * Includes duplicate review, verification tasks, source dashboard.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreeDeciduous, Loader2, CheckCircle2, XCircle, ChevronDown,
  Filter, Sprout, ArrowRight, ClipboardCheck, Database, MapPin, Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResearchBridge } from "@/hooks/use-research-bridge";
import { useHasRole } from "@/hooks/use-role";
import { useDataCommons } from "@/hooks/use-data-commons";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateMatchList, DuplicateWarningBadge } from "@/components/research-bridge/DuplicateMatchList";
import { VerificationTaskCard } from "@/components/research-bridge/VerificationTaskCard";
import { SourceDashboard } from "@/components/research-bridge/SourceDashboard";
import type { Database as DB } from "@/integrations/supabase/types";

type SourceCandidate = DB["public"]["Tables"]["source_tree_candidates"]["Row"];

const STATUS_COLORS: Record<string, string> = {
  raw: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  normalized: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  promoted: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  duplicate: "bg-muted text-muted-foreground border-border",
};

export function ResearchBridgeTab() {
  const {
    candidates, crawlRuns, verificationTasks, stats, loading,
    promoteCandidate, rejectCandidate, markDuplicate,
    createVerificationTasks, claimTask, completeTask,
  } = useResearchBridge();
  const { sources } = useDataCommons();
  const { hasRole: isKeeper } = useHasRole("keeper");
  const [candidateFilter, setCandidateFilter] = useState<string>("raw");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [subTab, setSubTab] = useState("candidates");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUserId(session?.user?.id ?? null)
    );
  }, []);

  const filteredCandidates = candidateFilter === "all"
    ? candidates
    : candidates.filter(c => c.normalization_status === candidateFilter);

  const filteredTasks = taskFilter === "all"
    ? verificationTasks
    : verificationTasks.filter(t => t.status === taskFilter);

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

      {/* Flow Visual */}
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

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-card/50 border border-primary/20">
          <TabsTrigger value="candidates" className="text-xs font-serif">
            <Sprout className="w-3 h-3 mr-1" /> Candidates
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs font-serif">
            <ClipboardCheck className="w-3 h-3 mr-1" /> Verification
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs font-serif">
            <Database className="w-3 h-3 mr-1" /> Sources
          </TabsTrigger>
        </TabsList>

        {/* ═══ CANDIDATES ═══ */}
        <TabsContent value="candidates" className="mt-4">
          <Card className="border-primary/10 bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-primary" /> Source Candidates
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  {["raw", "promoted", "rejected", "duplicate", "all"].map((f) => (
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
                <p className="text-xs text-muted-foreground font-serif text-center py-4">No candidates found.</p>
              )}
              {filteredCandidates.slice(0, 20).map((c) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  isKeeper={isKeeper}
                  isSelected={selectedCandidate === c.id}
                  onSelect={() => setSelectedCandidate(selectedCandidate === c.id ? null : c.id)}
                  onPromote={() => promoteCandidate(c.id, c.source_id)}
                  onReject={() => rejectCandidate(c.id)}
                  onMarkDuplicate={(dupId) => markDuplicate(c.id, dupId)}
                  userId={userId}
                  onCreateTasks={createVerificationTasks}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ VERIFICATION TASKS ═══ */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" /> Verification Missions
            </h3>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground" />
              {["all", "open", "claimed", "completed"].map((f) => (
                <button key={f} onClick={() => setTaskFilter(f)}
                  className={`text-[10px] font-serif px-2 py-0.5 rounded-full transition-colors ${taskFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <Card className="border-primary/10 bg-card/60">
              <CardContent className="py-8 text-center">
                <ClipboardCheck className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-serif">
                  No verification tasks yet. Promote candidates to research trees, then generate tasks.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <VerificationTaskCard
                  key={task.id}
                  task={task as any}
                  userId={userId}
                  onClaim={claimTask}
                  onComplete={completeTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ SOURCE DASHBOARD ═══ */}
        <TabsContent value="sources" className="mt-4">
          <SourceDashboard sources={sources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Candidate Row with Duplicate Detection ── */
function CandidateRow({
  candidate, isKeeper, isSelected, onSelect, onPromote, onReject, onMarkDuplicate, userId, onCreateTasks,
}: {
  candidate: SourceCandidate; isKeeper: boolean; isSelected: boolean;
  onSelect: () => void; onPromote: () => void; onReject: () => void;
  onMarkDuplicate: (dupId: string) => void;
  userId: string | null;
  onCreateTasks: (researchTreeId: string, userId: string) => Promise<number>;
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
        {candidate.normalization_status === "raw" && (
          <DuplicateWarningBadge candidate={candidate} />
        )}
        <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[candidate.normalization_status] || ""}`}>
          {candidate.normalization_status}
        </Badge>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isSelected ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/10">
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

              {/* Duplicate detection */}
              <DuplicateMatchList
                candidate={candidate}
                onMarkDuplicate={candidate.normalization_status === "raw" && isKeeper ? onMarkDuplicate : undefined}
              />

              {/* Raw data */}
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
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-[10px] font-serif text-green-600">✓ Promoted to Research Forest</p>
                  <Link
                    to={`/tree/research/${candidate.promoted_research_tree_id}`}
                    className="text-[10px] font-serif text-primary hover:underline"
                  >
                    View Research Tree →
                  </Link>
                  {isKeeper && userId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 text-[9px] font-serif ml-auto"
                      onClick={() => onCreateTasks(candidate.promoted_research_tree_id!, userId)}
                    >
                      <ClipboardCheck className="w-2.5 h-2.5 mr-1" /> Generate Tasks
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
