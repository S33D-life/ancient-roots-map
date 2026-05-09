import { useMemo } from "react";
import type { BloomOffering } from "@/lib/blooms/types";
import { SEASON_EMOJI, SEASON_LABEL, type Season } from "@/lib/blooms/season";

interface Props {
  blooms: BloomOffering[];
}

const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

export default function SeasonalTimeline({ blooms }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, { season: Season; year: number; species: Map<string, number> }>();
    for (const b of blooms) {
      const key = `${b.year}-${b.season}`;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { season: b.season, year: b.year, species: new Map() };
        map.set(key, bucket);
      }
      const name = (b.species_guess?.trim() || "unnamed bloom").toLowerCase();
      bucket.species.set(name, (bucket.species.get(name) || 0) + 1);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season);
    });
  }, [blooms]);

  if (grouped.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg text-foreground">A seasonal diary</h3>
      <ol className="space-y-3 border-l border-primary/20 pl-4">
        {grouped.map((g) => (
          <li key={`${g.year}-${g.season}`} className="relative">
            <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary/70" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {SEASON_EMOJI[g.season]} {SEASON_LABEL[g.season]} {g.year}
            </p>
            <p className="text-sm font-serif text-foreground capitalize">
              {Array.from(g.species.keys()).slice(0, 6).join(", ")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
