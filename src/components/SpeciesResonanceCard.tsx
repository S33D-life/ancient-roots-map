/**
 * SpeciesResonanceCard — calm Hearth card showing species affinity.
 * No gamification, just gentle awareness of where you return.
 */
import { TreeDeciduous } from "lucide-react";
import { formatSpeciesName, type SpeciesAffinity } from "@/hooks/use-species-resonance";

interface SpeciesResonanceCardProps {
  affinities: SpeciesAffinity[];
}

export default function SpeciesResonanceCard({ affinities }: SpeciesResonanceCardProps) {
  if (affinities.length === 0) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-2"
      style={{
        background: "hsl(var(--card) / 0.4)",
        border: "1px solid hsl(var(--border) / 0.15)",
      }}
    >
      <div className="flex items-center gap-2">
        <TreeDeciduous className="w-3.5 h-3.5 text-primary/60" />
        <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50">
          Your Trees
        </p>
      </div>

      <div className="space-y-1.5">
        {affinities.slice(0, 3).map((a, i) => {
          const opacity = 1 - i * 0.15;
          return (
            <div key={a.species} className="flex items-center gap-2.5">
              <span className="text-xs shrink-0" style={{ opacity }}>🌿</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground/80 truncate" style={{ opacity }}>
                  {formatSpeciesName(a.species)}
                </p>
              </div>
              <span className="text-[10px] font-serif text-muted-foreground/40 shrink-0">
                {a.visits} {a.visits === 1 ? "visit" : "visits"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
