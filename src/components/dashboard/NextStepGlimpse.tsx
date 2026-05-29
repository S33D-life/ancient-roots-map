/**
 * NextStepGlimpse — a single, gentle glimpse of the next meaningful step.
 *
 * Replaces the full quest ledger inside the Hearth with one quiet card
 * pointing toward the Quest Cave. If no quest is active, shows a soft
 * invitation to begin.
 */
import { Link } from "react-router-dom";
import { Sprout, Mountain } from "lucide-react";
import { useSeasonalQuests } from "@/hooks/use-seasonal-quests";

interface Props {
  userId: string;
}

export default function NextStepGlimpse({ userId }: Props) {
  const { data: quests, season } = useSeasonalQuests(userId);

  const next = (quests || []).find((q) => !q.completed) || null;

  return (
    <Link
      to="/library/quest-cave"
      className="block rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-5 py-4 transition-all hover:border-primary/40 hover:bg-card/60 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Sprout className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-serif tracking-[0.18em] uppercase text-muted-foreground/60 mb-1">
            {next ? `This ${season}` : "When you are ready"}
          </p>
          {next ? (
            <>
              <h4 className="font-serif text-base text-foreground/90 leading-tight truncate">
                {next.quest_title}
              </h4>
              {next.quest_description && (
                <p className="text-xs font-serif text-muted-foreground/70 mt-0.5 line-clamp-1">
                  {next.quest_description}
                </p>
              )}
              <div className="mt-2.5 h-1 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full bg-primary/60 transition-all"
                  style={{
                    width: `${Math.min(100, (next.current_count / Math.max(1, next.target_count)) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h4 className="font-serif text-base text-foreground/90 leading-tight">
                Step into the Quest Cave
              </h4>
              <p className="text-xs font-serif italic text-muted-foreground/70 mt-0.5">
                A path is waiting to begin.
              </p>
            </>
          )}
        </div>
        <Mountain className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1 shrink-0" />
      </div>
    </Link>
  );
}
