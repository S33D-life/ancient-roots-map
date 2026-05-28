/**
 * StagedEntryCard — Expandable card for reviewing a single staging entry.
 *
 * Shows all content layers with clear visual separation between:
 *   - ecological fact (green)
 *   - mythic/lore (amber)
 *   - medical/edible (red caution)
 *   - identification clues (blue)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, Leaf, BookOpen, FlaskConical, Eye, Globe, Trees } from "lucide-react";
import SafetyBadges from "@/components/research/SafetyBadges";
import { MEDICAL_DISCLAIMER, LORE_DISCLAIMER } from "@/lib/researchSafety";
import type { StagingEntryWithSources } from "@/types/research";

const STATUS_COLORS: Record<string, string> = {
  draft:              "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  needs_review:       "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  approved:           "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected:           "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  revision_requested: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

interface Props {
  entry: StagingEntryWithSources;
  onReview?: (entryId: string) => void;
}

export default function StagedEntryCard({ entry, onReview }: Props) {
  const [expanded, setExpanded] = useState(false);

  const targets = [
    entry.target_arborium        && "Arborium",
    entry.target_atlas           && "Atlas",
    entry.target_id_flow         && "ID Flow",
    entry.target_ancient_friends && "Ancient Friends",
  ].filter(Boolean);

  return (
    <motion.article
      layout
      className="rounded-2xl border border-amber-900/12 bg-card overflow-hidden"
      style={{ boxShadow: "0 2px 12px -6px hsl(40 30% 20% / 0.10)" }}
    >
      {/* ── Header ── */}
      <button
        type="button"
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base text-foreground leading-tight">
              {entry.common_name ?? entry.slug ?? "Unnamed entry"}
              {entry.latin_name && (
                <span className="ml-1.5 text-[12px] font-serif italic text-muted-foreground/70">
                  {entry.latin_name}
                </span>
              )}
            </h3>
            <span className={`text-[10px] font-serif uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status]}`}>
              {entry.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-serif text-muted-foreground/70 flex-wrap">
            {entry.family_slug && (
              <span className="flex items-center gap-1">
                <Trees className="w-3 h-3" />
                {entry.family_slug}
              </span>
            )}
            {entry.agent_model && (
              <span>via {entry.agent_model}</span>
            )}
            <span>{new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>

          <SafetyBadges entry={entry} />

          {targets.length > 0 && (
            <div className="flex gap-1 flex-wrap pt-0.5">
              {targets.map((t) => (
                <span key={t as string} className="text-[10px] font-serif px-2 py-0.5 rounded-full border border-emerald-700/25 bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  → {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 mt-1 text-muted-foreground/50">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">

              {/* Identification clues */}
              {entry.identification_clues && (
                <ContentBlock
                  icon={<Eye className="w-3.5 h-3.5" />}
                  title="Identification clues"
                  accent="blue"
                >
                  <p className="text-sm font-serif text-foreground/88 leading-relaxed">
                    {entry.identification_clues.primary}
                  </p>
                  {entry.identification_clues.secondary?.map((s, i) => (
                    <p key={i} className="text-[12px] font-serif text-muted-foreground/80 leading-relaxed">• {s}</p>
                  ))}
                </ContentBlock>
              )}

              {/* Ecology */}
              {entry.ecology_notes && (
                <ContentBlock icon={<Leaf className="w-3.5 h-3.5" />} title="Ecology" accent="green">
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.ecology_notes}</p>
                </ContentBlock>
              )}

              {/* Habitat */}
              {entry.habitat_notes && (
                <ContentBlock icon={<Globe className="w-3.5 h-3.5" />} title="Habitat" accent="green">
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.habitat_notes}</p>
                </ContentBlock>
              )}

              {/* Seasonal */}
              {entry.seasonal_notes && (
                <ContentBlock icon={<Leaf className="w-3.5 h-3.5" />} title="Seasonal notes" accent="green">
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.seasonal_notes}</p>
                </ContentBlock>
              )}

              {/* Ancient tree relevance */}
              {entry.ancient_tree_relevance && (
                <ContentBlock icon={<Trees className="w-3.5 h-3.5" />} title="Ancient tree relevance" accent="green">
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.ancient_tree_relevance}</p>
                </ContentBlock>
              )}

              {/* Folklore — visually separated, amber */}
              {entry.folklore_mythic_notes && (
                <ContentBlock icon={<BookOpen className="w-3.5 h-3.5" />} title="Folklore & mythic notes" accent="amber">
                  <p className="text-[11px] font-serif italic text-amber-800/70 dark:text-amber-300/70 mb-2">
                    {LORE_DISCLAIMER}
                  </p>
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.folklore_mythic_notes}</p>
                </ContentBlock>
              )}

              {/* Medicinal — red caution */}
              {entry.medicinal_edible_notes && (
                <ContentBlock icon={<FlaskConical className="w-3.5 h-3.5" />} title="Medicinal & edible notes" accent="red">
                  <p className="text-[11px] font-serif italic text-red-800/70 dark:text-red-300/70 mb-2">
                    ⚠ {MEDICAL_DISCLAIMER}
                  </p>
                  <p className="text-[13px] font-serif text-foreground/85 leading-relaxed whitespace-pre-line">{entry.medicinal_edible_notes}</p>
                </ContentBlock>
              )}

              {/* Sources */}
              {(entry.source_urls?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">Sources</p>
                  {entry.source_urls?.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] font-serif text-primary/75 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Reviewer notes */}
              {entry.reviewer_notes && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 p-3">
                  <p className="text-[10px] font-serif uppercase tracking-widest text-blue-700/70 dark:text-blue-300/60 mb-1">Reviewer notes</p>
                  <p className="text-[13px] font-serif text-foreground/85">{entry.reviewer_notes}</p>
                </div>
              )}

              {/* Review CTA */}
              {entry.status === "needs_review" && onReview && (
                <button
                  type="button"
                  onClick={() => onReview(entry.id)}
                  className="w-full rounded-xl border border-amber-600/30 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-2.5 text-sm font-serif text-amber-900 dark:text-amber-200 hover:bg-amber-100/80 transition-colors"
                >
                  Open in review panel →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ─── Content block helper ─────────────────────────────────────────────────────

type Accent = "green" | "amber" | "red" | "blue";

const ACCENT_STYLES: Record<Accent, string> = {
  green: "border-emerald-700/20 bg-emerald-50/60 dark:bg-emerald-950/15",
  amber: "border-amber-600/25  bg-amber-50/60  dark:bg-amber-950/15",
  red:   "border-red-600/25    bg-red-50/60    dark:bg-red-950/15",
  blue:  "border-blue-600/25   bg-blue-50/60   dark:bg-blue-950/15",
};

const ACCENT_ICON: Record<Accent, string> = {
  green: "text-emerald-700/60 dark:text-emerald-400/60",
  amber: "text-amber-700/60  dark:text-amber-400/60",
  red:   "text-red-700/60    dark:text-red-400/60",
  blue:  "text-blue-700/60   dark:text-blue-400/60",
};

function ContentBlock({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3.5 space-y-1.5 ${ACCENT_STYLES[accent]}`}>
      <div className={`flex items-center gap-1.5 ${ACCENT_ICON[accent]}`}>
        {icon}
        <span className="text-[10px] font-serif uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}
