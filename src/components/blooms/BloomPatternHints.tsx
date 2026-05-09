import { useMemo } from "react";
import type { BloomOffering } from "@/lib/blooms/types";
import { SEASON_LABEL } from "@/lib/blooms/season";

/** Emergent poetic lines: same species, same season, ≥2 distinct years. */
export default function BloomPatternHints({ blooms }: { blooms: BloomOffering[] }) {
  const hints = useMemo(() => {
    const map = new Map<string, Set<number>>(); // key: species|season → set of years
    for (const b of blooms) {
      const sp = b.species_guess?.trim().toLowerCase();
      if (!sp) continue;
      const key = `${sp}|${b.season}`;
      let years = map.get(key);
      if (!years) { years = new Set(); map.set(key, years); }
      years.add(b.year);
    }
    const out: string[] = [];
    for (const [key, years] of map.entries()) {
      if (years.size >= 2) {
        const [sp, season] = key.split("|");
        const seasonName = SEASON_LABEL[season as keyof typeof SEASON_LABEL].toLowerCase();
        const plural = seasonName + "s";
        out.push(`${capitalize(sp)} have been noticed here for ${years.size} ${plural}.`);
      }
    }
    return out.slice(0, 2);
  }, [blooms]);

  if (hints.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/15 bg-muted/30 p-4 space-y-1">
      {hints.map((h, i) => (
        <p key={i} className="text-sm font-serif italic text-foreground/80">{h}</p>
      ))}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
