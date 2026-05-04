import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { LunarLifeLedger } from "@/lib/moonroot/types";

interface Props {
  value: LunarLifeLedger;
  onChange: (next: LunarLifeLedger) => void;
}

const FIELDS: Array<{ key: keyof LunarLifeLedger; label: string; placeholder: string }> = [
  { key: "seeds", label: "Seeds saved / planted / shared", placeholder: "e.g. 12 tomato seeds saved, 3 hazelnut planted…" },
  { key: "books", label: "Books read / bought / offered", placeholder: "Titles, authors, a line that stayed with you…" },
  { key: "foraging", label: "Foraging", placeholder: "What was gathered, where, what was left for the land…" },
  { key: "preserving", label: "Preserving", placeholder: "Ferments, drying, jams, tinctures…" },
  { key: "herbs", label: "Herbs planted / harvested", placeholder: "Mint, yarrow, mugwort…" },
  { key: "garden", label: "Garden actions", placeholder: "Beds tended, compost turned, water carried…" },
  { key: "councilReflections", label: "Council reflections", placeholder: "What was offered to the circle…" },
];

export default function LunarLifeLedgerFields({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="font-serif text-sm text-foreground/80">{f.label}</Label>
          <Textarea
            value={value[f.key]}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            className="min-h-[72px] text-base md:text-sm bg-background/60"
          />
        </div>
      ))}
    </div>
  );
}
