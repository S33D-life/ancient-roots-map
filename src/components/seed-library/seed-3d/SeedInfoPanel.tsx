import type { Seed3DConfig } from "./seed-configs";
import { Badge } from "@/components/ui/badge";

interface SeedInfoPanelProps {
  seed: Seed3DConfig;
}

const USE_LABELS: Record<string, string> = {
  food: "Food",
  medicinal: "Medicinal",
  tree: "Tree",
  wild: "Wild",
};

export default function SeedInfoPanel({ seed }: SeedInfoPanelProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
          {USE_LABELS[seed.useCategory] || seed.useCategory}
        </Badge>
        <Badge variant="outline" className="border-border/60">
          {seed.speciesGroup}
        </Badge>
      </div>

      <div>
        <h3 className="font-serif text-lg text-foreground leading-tight">{seed.commonName}</h3>
        <p className="text-xs italic text-muted-foreground mt-0.5">{seed.latinName}</p>
      </div>

      <p className="text-muted-foreground leading-relaxed text-[13px]">{seed.description}</p>

      <div className="grid gap-2 text-xs text-muted-foreground">
        <div>
          <span className="text-foreground/70">Origin:</span> {seed.originLabel}
        </div>
        <div>
          <span className="text-foreground/70">Germination:</span> {seed.germinationNotes}
        </div>
        <div>
          <span className="text-foreground/70">Storage:</span> {seed.storageNotes}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60 italic">
        Tone: {seed.tone}
      </p>
    </div>
  );
}
