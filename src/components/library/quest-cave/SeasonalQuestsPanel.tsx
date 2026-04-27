/**
 * SeasonalQuestsPanel — featured Spring (or current season) quests.
 * Pure presentational; receives derived activity counts.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles } from "lucide-react";
import { SEASON_META, SEASONAL_QUESTS, type SeasonKey, type SeasonalQuestSeed } from "./seasonalQuestsConfig";

interface DerivedActivity {
  trees: number;
  offerings: number;
  whispers: number;
  visits: number;
  globalTrees: number;
  globalOfferings: number;
}

function progressFor(seed: SeasonalQuestSeed, a: DerivedActivity): number {
  if (!seed.derivedFrom) return 0;
  return Math.min(seed.goal, a[seed.derivedFrom] ?? 0);
}

const SCOPE_LABEL: Record<SeasonalQuestSeed["scope"], string> = {
  individual: "Individual",
  hearth: "Hearth",
  circle: "Circle",
  collective: "Collective",
};

export default function SeasonalQuestsPanel({
  season,
  activity,
}: {
  season: SeasonKey;
  activity: DerivedActivity;
}) {
  const meta = SEASON_META[season];
  const quests = SEASONAL_QUESTS[season] ?? [];

  if (quests.length === 0) {
    return (
      <Card className="border border-amber-900/20 bg-card/50">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.glyph}</span>
            <h3 className="font-serif text-sm" style={{ color: meta.accent }}>{meta.label} Quests</h3>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/80 italic">
            The {meta.label.toLowerCase()} cycle is preparing. Return as the season turns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{meta.glyph}</span>
            <h3 className="font-serif text-sm" style={{ color: meta.accent }}>
              {meta.label} Quests
            </h3>
            <Badge variant="outline" className="text-[9px] font-serif border-primary/30 text-primary">
              In season
            </Badge>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground/80 italic mt-1 max-w-md">
            {meta.whisper}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {quests.map((q) => {
          const cur = progressFor(q, activity);
          const pct = Math.min(100, Math.round((cur / q.goal) * 100));
          const done = cur >= q.goal;
          return (
            <div
              key={q.id}
              className="rounded-xl border border-border/40 bg-gradient-to-br from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-sm text-foreground leading-snug">{q.title}</p>
                  <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">{q.hint}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[9px] font-serif" style={{ backgroundColor: `${meta.accent}22`, color: meta.accent }}>
                    {meta.label}
                  </Badge>
                  <span className="text-[9px] font-serif text-muted-foreground/70">{SCOPE_LABEL[q.scope]}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-serif text-muted-foreground">
                <span>{cur} / {q.goal}</span>
                {done && (
                  <span className="flex items-center gap-1 text-primary">
                    <Sparkles className="w-3 h-3" /> Bloomed
                  </span>
                )}
              </div>
              <Progress value={pct} className="h-1.5 bg-muted/40" />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Link
          to="/map"
          className="inline-flex items-center gap-1 text-[11px] font-serif text-primary hover:underline"
        >
          Walk the season on the map <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}
