/**
 * SpeciesConfidenceBadge — a small, read-only, gentle indicator of how certain a
 * tree's species identity is ("Known" / "Likely" / "Broad group" / "Needs refinement").
 *
 * Display only: no writes, no data fetching, no resolver changes. Driven entirely by
 * signals already in hand (resolver confidence + species_key + the raw label). Tone is
 * non-judgmental — uncertainty is an invitation, never a failure.
 */
import { Badge } from "@/components/ui/badge";
import { Sparkles, Leaf, HelpCircle } from "lucide-react";
import {
  speciesCertainty,
  type SpeciesCertainty,
  type SpeciesCertaintyInput,
} from "@/lib/species/speciesConfidence";

interface Props extends SpeciesCertaintyInput {
  className?: string;
}

/** Gentle, mode-safe tones via semantic tokens. Exact = warm gold; broad = calm; unresolved = a dashed invitation. */
const TONE: Record<SpeciesCertainty, string> = {
  known: "border-primary/40 text-primary",
  likely: "border-primary/25 text-primary/70",
  broad: "border-border/60 text-muted-foreground",
  unresolved: "border-dashed border-muted-foreground/40 text-muted-foreground/80",
};

const ICON: Record<SpeciesCertainty, React.ReactNode> = {
  known: <Sparkles className="w-3 h-3" aria-hidden="true" />,
  likely: null,
  broad: <Leaf className="w-3 h-3" aria-hidden="true" />,
  unresolved: <HelpCircle className="w-3 h-3" aria-hidden="true" />,
};

export default function SpeciesConfidenceBadge({ className, ...input }: Props) {
  const { certainty, label, hint } = speciesCertainty(input);

  return (
    <Badge
      variant="outline"
      title={hint}
      aria-label={`Species certainty: ${label}. ${hint}`}
      className={`gap-1 text-[10px] font-serif tracking-wide bg-transparent ${TONE[certainty]} ${className ?? ""}`}
    >
      {ICON[certainty]}
      {label}
    </Badge>
  );
}
