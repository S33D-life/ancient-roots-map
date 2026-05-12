/**
 * CurrentPathChamber — large hero card showing the wanderer's active path,
 * progress, streak, resonance bonuses, and next milestone.
 *
 * Pure presentation. The page derives the data from real hooks.
 */
import { Link } from "react-router-dom";
import { Compass, ArrowRight, Flame } from "lucide-react";

export interface CurrentPathChamberProps {
  pathName: string;
  /** Short level/tier label, e.g. "Level 3 Resonance". */
  level?: string;
  /** Progress percent 0-100. */
  percent: number;
  /** Streak label, e.g. "9 Moon Cycle Streak". */
  streak?: string;
  /** Next milestone description. */
  nextMilestone?: string;
  /** Resonance bonus lines. */
  resonanceBonuses?: string[];
  ctaLabel?: string;
  ctaTo?: string;
}

export default function CurrentPathChamber({
  pathName,
  level,
  percent,
  streak,
  nextMilestone,
  resonanceBonuses = [],
  ctaLabel = "Continue your path",
  ctaTo = "/map",
}: CurrentPathChamberProps) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section
      className="relative rounded-2xl border border-amber-700/30 overflow-hidden bg-gradient-to-br from-amber-100/40 via-card/65 to-emerald-100/30 dark:from-amber-950/25 dark:to-emerald-950/15 p-4 sm:p-5"
      aria-label="Current path"
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-10 w-40 h-40 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "hsl(38 90% 60% / 0.6)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
              Current path
            </p>
            <h2 className="font-serif text-lg sm:text-xl text-foreground leading-tight truncate">
              {pathName}
            </h2>
          </div>
          {level && (
            <span className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-700/85 dark:text-amber-300/85 shrink-0">
              {level}
            </span>
          )}
        </div>

        {/* Progress arc */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted) / 0.4)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="hsl(38 85% 55%)"
                strokeWidth="2.5"
                strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-base text-foreground">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {streak && (
              <p className="font-serif text-[12px] text-foreground/85 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600/80" /> {streak}
              </p>
            )}
            {nextMilestone && (
              <p className="font-serif text-[12px] italic text-muted-foreground/85 leading-snug">
                Next: {nextMilestone}
              </p>
            )}
          </div>
        </div>

        {resonanceBonuses.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-700/20 bg-amber-50/30 dark:bg-amber-950/15 p-2.5">
            <p className="font-serif text-[9px] uppercase tracking-[0.22em] text-amber-700/85 dark:text-amber-300/85">
              Resonance bonuses
            </p>
            <ul className="mt-1 space-y-0.5">
              {resonanceBonuses.map((b, i) => (
                <li key={i} className="font-serif text-[11px] italic text-foreground/85 leading-snug">
                  · {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          to={ctaTo}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary font-serif text-sm transition-colors min-h-[44px]"
        >
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
