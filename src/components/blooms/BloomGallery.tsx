import { useMemo, useState } from "react";
import type { BloomOffering } from "@/lib/blooms/types";
import { SEASONS, SEASON_EMOJI, SEASON_LABEL, type Season } from "@/lib/blooms/season";
import { cn } from "@/lib/utils";

interface Props {
  blooms: BloomOffering[];
}

export default function BloomGallery({ blooms }: Props) {
  const [season, setSeason] = useState<Season | "all">("all");
  const [year, setYear] = useState<number | "all">("all");

  const years = useMemo(() => {
    const set = new Set(blooms.map((b) => b.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [blooms]);

  const filtered = useMemo(
    () =>
      blooms.filter(
        (b) => (season === "all" || b.season === season) && (year === "all" || b.year === year),
      ),
    [blooms, season, year],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeason("all")}
          className={cn(
            "px-3 py-1 rounded-full text-sm border transition",
            season === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All seasons
        </button>
        {SEASONS.map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={cn(
              "px-3 py-1 rounded-full text-sm border transition",
              season === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="mr-1">{SEASON_EMOJI[s]}</span>
            {SEASON_LABEL[s]}
          </button>
        ))}

        {years.length > 0 && (
          <select
            value={year}
            onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="ml-auto h-8 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm italic text-muted-foreground py-6 text-center">
          No blooms here yet for this season.
        </p>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
          {filtered.map((b) => (
            <BloomCard key={b.id} bloom={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BloomCard({ bloom }: { bloom: BloomOffering }) {
  const date = new Date(bloom.created_at);
  const monthYear = date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return (
    <figure className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition">
      <img
        src={bloom.image_url}
        alt={bloom.species_guess || "Bloom offering"}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      <figcaption className="p-3 space-y-1">
        {bloom.species_guess && (
          <p className="font-serif text-sm text-foreground">{bloom.species_guess}</p>
        )}
        {bloom.note && (
          <p className="text-xs italic text-muted-foreground line-clamp-2">"{bloom.note}"</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          {SEASON_EMOJI[bloom.season]} {monthYear}
        </p>
      </figcaption>
    </figure>
  );
}
