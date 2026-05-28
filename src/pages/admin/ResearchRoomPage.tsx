/**
 * ResearchRoomPage — Admin interface for the research ingestion pipeline.
 *
 * Layout:
 *   Header with queue stats
 *   Tab bar: Queue | Sources | Families | Enrichment | Safety Rules
 *   Queue tab: filterable list of staging entries with ReviewPanel
 *
 * Safety contract:
 *   - Approve pushes entry to research_review_queue with action='approve'
 *   - A separate promotion job reads the queue and writes to tree_species_enrichment
 *   - This page NEVER writes directly to tree_species_enrichment or production trees
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  BookOpen,
  Trees,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Database,
  FileText,
} from "lucide-react";
import StagedEntryCard from "@/components/research/StagedEntryCard";
import ReviewPanel from "@/components/research/ReviewPanel";
import { SAFETY_RULES } from "@/lib/researchSafety";
import type {
  ResearchStagingEntry,
  ReviewAction,
  ReviewStatus,
  ResearchQueueStats,
  StagingEntryWithSources,
} from "@/types/research";

// ─── Placeholder data — replace with React Query once tables exist ────────────

const PLACEHOLDER_STATS: ResearchQueueStats = {
  draft: 0,
  needs_review: 0,
  approved: 0,
  rejected: 0,
  revision_requested: 0,
};

const PLACEHOLDER_ENTRIES: StagingEntryWithSources[] = [];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "queue" | "sources" | "families" | "enrichment" | "safety_rules";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "queue",        label: "Queue",        icon: <Clock className="w-3.5 h-3.5" /> },
  { id: "sources",      label: "Sources",      icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "families",     label: "Families",     icon: <Trees className="w-3.5 h-3.5" /> },
  { id: "enrichment",   label: "Enrichment",   icon: <Database className="w-3.5 h-3.5" /> },
  { id: "safety_rules", label: "Safety Rules", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
];

// ─── Status filter pills ──────────────────────────────────────────────────────

const STATUS_FILTERS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all",                label: "All" },
  { value: "needs_review",       label: "Needs review" },
  { value: "draft",              label: "Draft" },
  { value: "approved",           label: "Approved" },
  { value: "rejected",           label: "Rejected" },
  { value: "revision_requested", label: "Revision" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchRoomPage() {
  const [activeTab, setActiveTab]         = useState<Tab>("queue");
  const [statusFilter, setStatusFilter]   = useState<ReviewStatus | "all">("needs_review");
  const [reviewEntry, setReviewEntry]     = useState<ResearchStagingEntry | null>(null);

  const stats    = PLACEHOLDER_STATS;
  const entries  = PLACEHOLDER_ENTRIES;

  const filtered = statusFilter === "all"
    ? entries
    : entries.filter((e) => e.status === statusFilter);

  function handleDecide(action: ReviewAction, notes: string, rejectionReason?: string) {
    // TODO: wire to Supabase mutation
    // 1. Update research_staging_entries.status
    // 2. Insert into research_review_queue with action + notes
    // 3. If action === 'approve', trigger promotion edge function
    console.log("[ResearchRoom] decision", { entry: reviewEntry?.id, action, notes, rejectionReason });
    setReviewEntry(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-900/20 bg-amber-50/60 text-[10px] font-serif uppercase tracking-widest text-amber-900/70 dark:bg-amber-950/20 dark:text-amber-300/70">
            <FlaskConical className="w-3 h-3" />
            Research Room · Admin
          </div>

          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Research Ingestion
          </h1>
          <p className="font-serif text-sm text-muted-foreground/75 max-w-lg leading-relaxed">
            Review agent-researched species content before it reaches the Arborium,
            Atlas, or ID flow. Approve what is well-sourced; flag what needs scrutiny.
            Nothing lands in production without a human review.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <StatChip icon={<Clock className="w-3.5 h-3.5" />}    label="Needs review"  count={stats.needs_review}       accent="amber" />
            <StatChip icon={<BookOpen className="w-3.5 h-3.5" />} label="Draft"         count={stats.draft}              accent="zinc" />
            <StatChip icon={<CheckCircle className="w-3.5 h-3.5" />} label="Approved"   count={stats.approved}           accent="green" />
            <StatChip icon={<XCircle className="w-3.5 h-3.5" />}  label="Rejected"      count={stats.rejected}           accent="red" />
            <StatChip icon={<RotateCcw className="w-3.5 h-3.5" />} label="Revision"     count={stats.revision_requested} accent="blue" />
          </div>
        </motion.header>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 border-b border-border overflow-x-auto pb-0.5 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex items-center gap-1.5 px-3 py-2 text-[12px] font-serif whitespace-nowrap transition-colors border-b-2 -mb-0.5",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground/70 hover:text-foreground",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value as ReviewStatus | "all")}
                  className={[
                    "px-3 py-1 rounded-full text-[11px] font-serif border transition-colors",
                    statusFilter === f.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Entry list */}
            {filtered.length === 0 ? (
              <EmptyQueuePlaceholder status={statusFilter} />
            ) : (
              <div className="space-y-3">
                {filtered.map((entry) => (
                  <StagedEntryCard
                    key={entry.id}
                    entry={entry}
                    onReview={(id) => setReviewEntry(entries.find((e) => e.id === id) ?? null)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {activeTab === "sources" && (
          <ComingSoonTab
            title="Research Sources"
            description="Browse and manage the library of source documents, URLs, and agent citations."
            icon={<FileText className="w-8 h-8 text-muted-foreground/40" />}
          />
        )}

        {/* Families */}
        {activeTab === "families" && (
          <ComingSoonTab
            title="Tree Families"
            description="View and edit botanical family records. These power the Arborium Tree Families section."
            icon={<Trees className="w-8 h-8 text-muted-foreground/40" />}
          />
        )}

        {/* Enrichment table */}
        {activeTab === "enrichment" && (
          <ComingSoonTab
            title="Species Enrichment"
            description="View the production knowledge layer. Only approved entries appear here after human review."
            icon={<Database className="w-8 h-8 text-muted-foreground/40" />}
          />
        )}

        {/* Safety rules reference */}
        {activeTab === "safety_rules" && (
          <div className="space-y-3">
            <p className="text-sm font-serif text-muted-foreground/75 leading-relaxed">
              These rules are enforced at write time by <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">researchSafety.ts</code>.
              Entries with blocking violations cannot be approved.
            </p>
            {SAFETY_RULES.map((rule) => (
              <div
                key={rule.id}
                className={[
                  "rounded-2xl border p-4 space-y-1.5",
                  rule.blocks_promotion
                    ? "border-red-200 bg-red-50/40 dark:border-red-800/40 dark:bg-red-950/15"
                    : "border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/15",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${rule.blocks_promotion ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
                  <span className="font-serif text-sm text-foreground font-medium">{rule.title}</span>
                  {rule.blocks_promotion && (
                    <span className="text-[9px] font-serif uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
                      Blocks promotion
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-serif text-muted-foreground/80 leading-relaxed">{rule.description}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Review panel (bottom sheet) */}
      <ReviewPanel
        entry={reviewEntry}
        onDecide={handleDecide}
        onClose={() => setReviewEntry(null)}
      />
    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

type StatAccent = "amber" | "green" | "red" | "blue" | "zinc";

const STAT_STYLES: Record<StatAccent, string> = {
  amber: "border-amber-200 bg-amber-50/60  text-amber-800  dark:border-amber-800/40  dark:bg-amber-950/20  dark:text-amber-300",
  green: "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300",
  red:   "border-red-200   bg-red-50/60    text-red-800    dark:border-red-800/40    dark:bg-red-950/20    dark:text-red-300",
  blue:  "border-blue-200  bg-blue-50/60   text-blue-800   dark:border-blue-800/40   dark:bg-blue-950/20   dark:text-blue-300",
  zinc:  "border-zinc-200  bg-zinc-50/60   text-zinc-700   dark:border-zinc-700/40   dark:bg-zinc-900/20   dark:text-zinc-300",
};

function StatChip({
  icon, label, count, accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: StatAccent;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${STAT_STYLES[accent]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-serif">
        {icon}
        {label}
      </div>
      <span className="font-serif font-medium text-sm tabular-nums">{count}</span>
    </div>
  );
}

function ComingSoonTab({
  title, description, icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      <p className="text-sm font-serif text-muted-foreground/70 max-w-sm leading-relaxed">{description}</p>
      <span className="text-[10px] font-serif uppercase tracking-widest px-3 py-1 rounded-full border border-border text-muted-foreground/60">
        Coming soon
      </span>
    </div>
  );
}

function EmptyQueuePlaceholder({ status }: { status: ReviewStatus | "all" }) {
  const messages: Record<ReviewStatus | "all", string> = {
    all:                "No research entries yet. Agents will deposit here when research tasks run.",
    needs_review:       "Nothing waiting for review. The queue is clear.",
    draft:              "No draft entries.",
    approved:           "No approved entries yet.",
    rejected:           "No rejected entries.",
    revision_requested: "No entries awaiting revision.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <FlaskConical className="w-8 h-8 text-muted-foreground/30" />
      <p className="text-sm font-serif text-muted-foreground/60 max-w-sm">{messages[status]}</p>
    </div>
  );
}
