/**
 * SeasonalQuestCard — displays seasonal quest progress.
 */
import type { SeasonalQuest } from "@/hooks/use-seasonal-quests";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

const SEASON_META: Record<string, { emoji: string; color: string }> = {
  spring: { emoji: "🌸", color: "hsl(330, 60%, 60%)" },
  summer: { emoji: "☀️", color: "hsl(45, 80%, 50%)" },
  autumn: { emoji: "🍂", color: "hsl(25, 70%, 50%)" },
  winter: { emoji: "❄️", color: "hsl(200, 50%, 60%)" },
};

interface Props {
  quests: SeasonalQuest[];
  season: string;
  onInit?: () => void;
}

const SeasonalQuestCard = ({ quests, season, onInit }: Props) => {
  const meta = SEASON_META[season] || SEASON_META.spring;

  if (quests.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <p className="font-serif text-sm capitalize" style={{ color: meta.color }}>
            {season} Quests
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-serif">
          Begin your seasonal journey — discover what this season has to offer.
        </p>
        {onInit && (
          <button
            onClick={onInit}
            className="text-xs font-serif text-primary hover:underline"
          >
            Start {season} quests →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.emoji}</span>
        <p className="font-serif text-sm capitalize" style={{ color: meta.color }}>
          {season} Quests
        </p>
        <Badge variant="secondary" className="text-[9px] ml-auto">
          {quests.filter(q => q.completed).length}/{quests.length}
        </Badge>
      </div>
      <div className="space-y-2.5">
        {quests.map(q => {
          const pct = Math.min(100, Math.round((q.current_count / q.target_count) * 100));
          return (
            <div key={q.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {q.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-border/60 shrink-0" />
                )}
                <p className={`text-xs font-serif flex-1 ${q.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {q.quest_title}
                </p>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {q.current_count}/{q.target_count}
                </span>
              </div>
              {!q.completed && (
                <Progress value={pct} className="h-1" />
              )}
              {q.quest_description && !q.completed && (
                <p className="text-[10px] text-muted-foreground/70 font-serif pl-5.5">
                  {q.quest_description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonalQuestCard;
