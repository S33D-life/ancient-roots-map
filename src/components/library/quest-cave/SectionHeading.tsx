/**
 * SectionHeading — gentle visual continuity between Quest Cave panels.
 * Carries cave/root motif: a thin amber rule and a small glyph.
 */
import type { ReactNode } from "react";

interface Props {
  glyph: ReactNode;
  title: string;
  whisper?: string;
  /** Tiny right-aligned hint, e.g. "1 of 4" */
  hint?: string;
}

export default function SectionHeading({ glyph, title, whisper, hint }: Props) {
  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className="w-6 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        <span className="text-primary/70 shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{glyph}</span>
        <h2 className="font-serif text-xs uppercase tracking-[0.18em] text-foreground/70">
          {title}
        </h2>
        <span aria-hidden className="flex-1 h-px bg-gradient-to-r from-amber-700/30 via-amber-700/15 to-transparent" />
        {hint && (
          <span className="text-[10px] font-serif text-muted-foreground/60 shrink-0">
            {hint}
          </span>
        )}
      </div>
      {whisper && (
        <p className="text-[11px] font-serif text-muted-foreground/70 italic pl-8 max-w-md">
          {whisper}
        </p>
      )}
    </div>
  );
}
