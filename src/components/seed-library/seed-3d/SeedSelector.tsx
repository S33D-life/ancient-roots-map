import { cn } from "@/lib/utils";
import { SEED_CONFIGS, type Seed3DConfig } from "./seed-configs";

interface SeedSelectorProps {
  selected: string;
  onSelect: (slug: string) => void;
}

export default function SeedSelector({ selected, onSelect }: SeedSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select a seed to view in 3D">
      {SEED_CONFIGS.map((seed) => (
        <button
          key={seed.slug}
          role="radio"
          aria-checked={selected === seed.slug}
          onClick={() => onSelect(seed.slug)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-serif transition-all border",
            selected === seed.slug
              ? "bg-primary/20 border-primary/50 text-primary shadow-sm"
              : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground",
          )}
        >
          {seed.commonName}
        </button>
      ))}
    </div>
  );
}
