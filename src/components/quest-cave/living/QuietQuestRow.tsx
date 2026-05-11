/**
 * QuietQuestRow — a single quest entry inside a Living Paths section.
 * Soft, ceremonial, no XP / loot tone.
 */
import { Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  title: string;
  description: string;
  current?: number;
  target?: number;
  group?: string;
  /** Mark as complete regardless of numeric target. */
  complete?: boolean;
}

export default function QuietQuestRow({
  title,
  description,
  current,
  target,
  group,
  complete,
}: Props) {
  const pct =
    target && target > 0 ? Math.min(100, Math.round(((current ?? 0) / target) * 100)) : null;
  const isDone = complete || (target ? (current ?? 0) >= target : false);

  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-3">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full border ${
            isDone
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border/50 text-muted-foreground/70"
          }`}
          aria-hidden
        >
          {isDone ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-2.5 h-2.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-serif text-sm text-foreground leading-snug">{title}</p>
            {group && (
              <span className="font-serif text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 shrink-0">
                {group}
              </span>
            )}
          </div>
          <p className="font-serif text-[11px] italic text-muted-foreground/80 mt-0.5">
            {description}
          </p>
          {pct !== null && (
            <div className="mt-2 space-y-1">
              <Progress value={pct} className="h-1 bg-muted/40" />
              <p className="font-serif text-[10px] text-muted-foreground/70">
                {current ?? 0} / {target}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
