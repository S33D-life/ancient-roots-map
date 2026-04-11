/**
 * PulseSignal — Minimal live signal for roadmap nodes.
 * Shows primary count, optional secondary, and needs-attention glow.
 */
import { Link } from "react-router-dom";
import type { PulseConfig } from "@/hooks/use-roadmap-pulse";

export function PulseSignal({ config }: { config: PulseConfig | undefined }) {
  if (!config || (!config.primary && !config.invitation)) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {/* Invitation line — the dynamic "what's happening" */}
      {config.invitation && config.invitationRoute && (
        <Link
          to={config.invitationRoute}
          className="block text-[9px] font-serif text-primary/80 hover:text-primary transition-colors leading-tight truncate max-w-[120px]"
        >
          {config.invitation}
        </Link>
      )}
      {config.invitation && !config.invitationRoute && (
        <span className="block text-[9px] font-serif text-primary/60 leading-tight truncate max-w-[120px]">
          {config.invitation}
        </span>
      )}
    </div>
  );
}

/**
 * FlowStrip — Horizontal pipeline indicator: Source → Candidate → Research → Verify → Ancient Friend
 */
export function FlowStrip({
  rawCandidates,
  promotedCandidates,
  researchTreesTotal,
  openVerifications,
  convertedTrees,
}: {
  rawCandidates: number;
  promotedCandidates: number;
  researchTreesTotal: number;
  openVerifications: number;
  convertedTrees: number;
}) {
  const stages = [
    { label: "Candidates", count: rawCandidates + promotedCandidates, hot: rawCandidates >= 5 },
    { label: "Research", count: researchTreesTotal, hot: researchTreesTotal >= 10 },
    { label: "Verify", count: openVerifications, hot: openVerifications >= 3 },
    { label: "Ancient Friend", count: convertedTrees, hot: false },
  ];

  const hasAny = stages.some(s => s.count > 0);
  if (!hasAny) return null;

  return (
    <div className="flex items-center justify-center gap-1 text-[9px] font-serif text-muted-foreground py-2 flex-wrap">
      {stages.map((stage, i) => (
        <span key={stage.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-border/40">→</span>}
          <span
            className={`px-2 py-0.5 rounded-full transition-colors ${
              stage.hot
                ? "bg-primary/15 text-primary border border-primary/20"
                : stage.count > 0
                  ? "bg-muted/40 text-foreground/70"
                  : "text-muted-foreground/40"
            }`}
          >
            {stage.count > 0 && <strong className="font-mono mr-0.5">{stage.count}</strong>}
            {stage.label}
          </span>
        </span>
      ))}
    </div>
  );
}
