/**
 * QuestChamberCard — collapsible quest card with progress ring, value-tree
 * roots, and an expanded lore/CTA state.
 *
 * Pure presentation. Wires real data via props.
 */
import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";

export interface QuestChamberCardProps {
  title: string;
  /** One-line poetic description visible in collapsed state. */
  poeticLine: string;
  /** Reward preview text, e.g. "+11 hearts · oak resonance". */
  rewardPreview?: string;
  /** Current progress value. */
  current?: number;
  /** Target progress value. */
  target?: number;
  /** Roots of the S33D Value Tree this quest nourishes. */
  roots?: string[];
  /** Branches of the commons this quest grows. */
  branches?: string[];
  /** Expanded lore (mythic / longer body). */
  lore?: string;
  /** CTA destination. */
  ctaTo?: string;
  /** CTA label, defaults to "Walk this path". */
  ctaLabel?: string;
  /** Optional icon shown in the artwork well. */
  icon?: ReactNode;
  /** Glow accent (HSL string). */
  accent?: string;
  defaultOpen?: boolean;
}

export default function QuestChamberCard({
  title,
  poeticLine,
  rewardPreview,
  current,
  target,
  roots,
  branches,
  lore,
  ctaTo,
  ctaLabel = "Walk this path",
  icon,
  accent = "hsl(38 80% 55%)",
  defaultOpen = false,
}: QuestChamberCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reactId = useId();
  const headerId = `quest-h-${reactId}`;
  const bodyId = `quest-b-${reactId}`;
  const hasProgress = typeof current === "number" && typeof target === "number";
  const pct = hasProgress
    ? Math.max(0, Math.min(100, Math.round((current! / target!) * 100)))
    : 0;
  const progressLabel = hasProgress ? `${pct} percent complete` : undefined;

  return (
    <article
      className="relative rounded-xl border border-amber-900/20 bg-card/55 overflow-hidden focus-within:border-primary/40"
      style={{ boxShadow: `inset 0 0 40px -28px ${accent}` }}
      aria-labelledby={headerId}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        id={headerId}
        className="w-full text-left p-3 sm:p-4 flex items-center gap-3 min-h-[72px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
      >
        {/* Artwork well + progress ring */}
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="hsl(var(--muted) / 0.4)"
              strokeWidth="2"
            />
            {hasProgress && (
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={accent}
                strokeWidth="2"
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div
            className="absolute inset-1.5 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${accent}, transparent 75%)`,
            }}
          >
            {icon ?? (
              <span className="font-serif text-[10px] text-foreground/70">
                {hasProgress ? `${pct}%` : "·"}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-sm text-foreground leading-tight">{title}</h4>
          <p className="font-serif text-[11px] italic text-muted-foreground/85 leading-snug mt-0.5">
            {poeticLine}
          </p>
          {rewardPreview && (
            <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80 mt-1">
              {rewardPreview}
            </p>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/70 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {/* CSS-grid expand: animates grid-template-rows 0fr → 1fr (GPU/composited,
          no per-frame layout measurement, motion-safe). */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden [contain:layout_paint] [will-change:grid-template-rows]">
          <div className="px-3 sm:px-4 pb-4 pt-1 space-y-3 border-t border-border/30">
            {lore && (
              <p className="font-serif text-[12px] italic text-foreground/85 leading-relaxed mt-2">
                {lore}
              </p>
            )}

            {(roots?.length || branches?.length) && (
              <div className="rounded-lg border border-emerald-900/15 bg-emerald-50/20 dark:bg-emerald-950/10 p-2.5 space-y-1.5">
                {roots && roots.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-serif text-[9px] uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 shrink-0">
                      Roots
                    </span>
                    <p className="font-serif text-[11px] text-foreground/80 leading-snug">
                      {roots.join(" · ")}
                    </p>
                  </div>
                )}
                {branches && branches.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-serif text-[9px] uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-300/80 mt-0.5 shrink-0">
                      Branches
                    </span>
                    <p className="font-serif text-[11px] text-foreground/80 leading-snug">
                      {branches.join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {hasProgress && (
              <p className="font-serif text-[10px] text-muted-foreground">
                {current} of {target} · {pct}%
              </p>
            )}

            {ctaTo && (
              <Link
                to={ctaTo}
                tabIndex={open ? 0 : -1}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-serif text-xs transition-colors min-h-[40px]"
              >
                {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
