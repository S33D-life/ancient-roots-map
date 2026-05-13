import type { AncientFriendsSummary } from "@/lib/moonroot/types";

export default function CycleThemes({ summary }: { summary: AncientFriendsSummary }) {
  if (!summary.cycleThemes.length) return null;
  return (
    <div className="text-center space-y-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-serif">
        Themes of this cycle
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {summary.cycleThemes.map((t) => (
          <span
            key={t}
            className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary font-serif text-sm tracking-wide"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
