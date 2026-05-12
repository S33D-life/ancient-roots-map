/**
 * OpportunitiesBoard — living parchment notice board.
 *
 * Surfaces local quests, nearby wanderers, seasonal events, council
 * gatherings, species DAO opportunities. Pure presentation.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export interface OpportunityNote {
  id: string;
  /** Short tag, e.g. "Local", "Seasonal", "Council". */
  kind: string;
  title: string;
  /** One-line context. */
  line: string;
  to?: string;
  /** Optional accent color for the tag. */
  accent?: string;
}

interface Props {
  notes: OpportunityNote[];
  emptyLine?: string;
}

export default function OpportunitiesBoard({
  notes,
  emptyLine = "The board is quiet. New whispers will pin themselves here.",
}: Props) {
  return (
    <section
      className="relative rounded-2xl border border-amber-900/25 bg-gradient-to-br from-amber-50/50 via-card/55 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 p-4"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, hsl(38 60% 70% / 0.04) 0 2px, transparent 2px 8px)",
      }}
      aria-label="Opportunities"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-serif text-base text-foreground">Living Notice Board</h3>
        <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          What stirs nearby
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="font-serif text-[12px] italic text-muted-foreground/80 leading-relaxed">
          {emptyLine}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const accent = n.accent ?? "hsl(38 80% 55%)";
            const Inner = (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-900/15 bg-card/60 hover:border-primary/30 transition-colors min-h-[56px]">
                <span
                  className="font-serif text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{
                    color: accent,
                    background: `${accent.replace(")", " / 0.12)")}`,
                    border: `1px solid ${accent.replace(")", " / 0.35)")}`,
                  }}
                >
                  {n.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[12px] text-foreground/90 leading-snug">{n.title}</p>
                  <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-snug">
                    {n.line}
                  </p>
                </div>
                {n.to && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70 mt-1 shrink-0" />}
              </div>
            );
            return (
              <li key={n.id}>
                {n.to ? (
                  <Link
                    to={n.to}
                    aria-label={`${n.kind}: ${n.title}. ${n.line}`}
                    className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {Inner}
                  </Link>
                ) : (
                  Inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
