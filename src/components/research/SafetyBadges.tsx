/**
 * SafetyBadges — Visual indicators for the safety flags on a staging entry.
 * Rendered inside StagedEntryCard so reviewers see issues at a glance.
 */
import { AlertTriangle, CheckCircle, FlaskConical, BookOpen, HelpCircle } from "lucide-react";
import type { ResearchStagingEntry } from "@/types/research";

interface Props {
  entry: Pick<
    ResearchStagingEntry,
    | "contains_medical_claims"
    | "medical_caution_added"
    | "uncertainty_flagged"
    | "lore_separated_from_fact"
    | "unsourced_lore_present"
    | "confidence_score"
  >;
}

interface Badge {
  icon: React.ReactNode;
  label: string;
  variant: "ok" | "warn" | "error";
}

export default function SafetyBadges({ entry }: Props) {
  const badges: Badge[] = [];

  // Confidence
  if (entry.confidence_score >= 0.8) {
    badges.push({ icon: <CheckCircle className="w-3 h-3" />, label: `Confidence ${(entry.confidence_score * 100).toFixed(0)}%`, variant: "ok" });
  } else if (entry.confidence_score >= 0.5) {
    badges.push({ icon: <HelpCircle className="w-3 h-3" />, label: `Confidence ${(entry.confidence_score * 100).toFixed(0)}%`, variant: "warn" });
  } else {
    badges.push({ icon: <AlertTriangle className="w-3 h-3" />, label: `Low confidence ${(entry.confidence_score * 100).toFixed(0)}%`, variant: "error" });
  }

  // Uncertainty flag
  if (entry.uncertainty_flagged) {
    badges.push({ icon: <HelpCircle className="w-3 h-3" />, label: "Uncertainty flagged", variant: "warn" });
  }

  // Medical claims
  if (entry.contains_medical_claims) {
    const ok = entry.medical_caution_added;
    badges.push({
      icon: <FlaskConical className="w-3 h-3" />,
      label: ok ? "Medical — caution added" : "Medical — MISSING CAUTION",
      variant: ok ? "warn" : "error",
    });
  }

  // Lore separation
  if (entry.lore_separated_from_fact) {
    badges.push({ icon: <BookOpen className="w-3 h-3" />, label: "Lore separated", variant: "ok" });
  }

  // Unsourced lore
  if (entry.unsourced_lore_present) {
    badges.push({ icon: <AlertTriangle className="w-3 h-3" />, label: "Unsourced lore present", variant: "error" });
  }

  const color: Record<Badge["variant"], string> = {
    ok:    "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    warn:  "bg-amber-50  border-amber-200  text-amber-800  dark:bg-amber-950/30  dark:text-amber-300",
    error: "bg-red-50    border-red-200    text-red-800    dark:bg-red-950/30    dark:text-red-300",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-[10px] font-serif px-2 py-0.5 rounded-full border ${color[b.variant]}`}
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  );
}
