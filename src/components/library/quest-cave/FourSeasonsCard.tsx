/**
 * FourSeasonsCard — featured "Four Seasons Ancient Friend" quest.
 * Progress is derived very lightly: each season the user has at least
 * one check-in counts as that season being touched.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEASON_META, SEASONAL_OFFERING_HINTS, type SeasonKey } from "./seasonalQuestsConfig";

interface Props {
  /** Current real-world season — used to highlight the "active" step */
  currentSeason: SeasonKey;
  /** Set of seasons the wanderer has visited a tree in. v0.2: derived from a single visits count. */
  touchedSeasons?: Set<SeasonKey>;
}

const ORDER: SeasonKey[] = ["spring", "summer", "autumn", "winter"];

export default function FourSeasonsCard({ currentSeason, touchedSeasons }: Props) {
  const touched = touchedSeasons ?? new Set<SeasonKey>();
  const completed = ORDER.filter(s => touched.has(s)).length;
  const pct = Math.round((completed / ORDER.length) * 100);

  return (
    <Card className="border border-amber-900/25 bg-gradient-to-br from-amber-100/40 via-card/70 to-emerald-100/30 dark:from-amber-950/15 dark:to-emerald-950/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm text-foreground">Four Seasons Ancient Friend</h3>
              <Badge variant="outline" className="text-[9px] font-serif border-primary/30 text-primary">Featured</Badge>
            </div>
            <p className="text-[11px] font-serif text-muted-foreground/80 mt-1 italic">
              Return through spring, summer, autumn, and winter — and let one tree become a living companion.
            </p>
          </div>
          <span className="text-[10px] font-serif text-muted-foreground tabular-nums shrink-0">
            {completed}/4
          </span>
        </div>

        <Progress value={pct} className="h-1.5 bg-muted/40" />

        <div className="grid grid-cols-4 gap-2">
          {ORDER.map((s) => {
            const meta = SEASON_META[s];
            const isCurrent = s === currentSeason;
            const isDone = touched.has(s);
            return (
              <div
                key={s}
                className={`rounded-lg border p-2 text-center transition-colors ${
                  isDone
                    ? "border-primary/40 bg-primary/10"
                    : isCurrent
                    ? "border-primary/30 bg-card/60"
                    : "border-border/30 bg-card/30"
                }`}
              >
                <div className="text-base leading-none" aria-hidden>{meta.glyph}</div>
                <div className="text-[10px] font-serif mt-1" style={{ color: meta.accent }}>
                  {meta.label}
                </div>
                <div className="text-[9px] font-serif text-muted-foreground/70 mt-0.5">
                  {isDone ? "Met" : isCurrent ? "Now" : "Wait"}
                </div>
              </div>
            );
          })}
        </div>

        <details className="text-[11px] font-serif text-muted-foreground/80">
          <summary className="cursor-pointer text-foreground/80 hover:text-primary transition-colors">
            Offering ideas for {SEASON_META[currentSeason].label.toLowerCase()}
          </summary>
          <ul className="mt-2 grid grid-cols-2 gap-1 list-disc pl-4">
            {SEASONAL_OFFERING_HINTS[currentSeason].map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}
