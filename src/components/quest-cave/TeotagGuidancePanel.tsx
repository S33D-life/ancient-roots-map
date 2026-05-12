/**
 * TeotagGuidancePanel — soft, glowing conversational hint panel.
 *
 * Rotates through a small list of contextual cues (nearby quests, seasonal
 * opportunities, resonance suggestions, community activity). Not a chatbot.
 *
 * Pure presentation. The page passes contextual hints derived from real data.
 */
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export interface TeotagHint {
  /** Short label, e.g. "Nearby". */
  kind: string;
  /** Body line — poetic, single sentence. */
  line: string;
}

interface Props {
  hints: TeotagHint[];
  /** Rotation interval in ms. Default 6000. */
  intervalMs?: number;
}

export default function TeotagGuidancePanel({ hints, intervalMs = 6000 }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (hints.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % hints.length), intervalMs);
    return () => clearInterval(t);
  }, [hints.length, intervalMs]);

  if (hints.length === 0) return null;
  const hint = hints[i];

  return (
    <aside
      className="relative rounded-2xl border border-amber-700/25 bg-gradient-to-br from-amber-100/30 via-card/60 to-emerald-100/20 dark:from-amber-950/20 dark:to-emerald-950/15 p-3.5 sm:p-4 overflow-hidden"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="absolute -top-8 -left-6 w-24 h-24 rounded-full opacity-50 blur-2xl pointer-events-none"
        style={{ background: "hsl(38 90% 60% / 0.5)" }}
      />
      <div className="relative flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-700/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-700/85 dark:text-amber-300/85" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-amber-700/80 dark:text-amber-300/80">
            TEOTAG · {hint.kind}
          </p>
          <p
            key={i}
            className="font-serif text-[13px] italic text-foreground/90 leading-relaxed mt-0.5 animate-fade-in"
          >
            {hint.line}
          </p>
        </div>
      </div>
      {hints.length > 1 && (
        <div className="relative mt-2 flex gap-1 justify-end">
          {hints.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === i ? "bg-amber-600/80" : "bg-amber-700/20"
              }`}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
