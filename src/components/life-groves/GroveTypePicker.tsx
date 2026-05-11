import { GROVE_TYPES, type GroveType } from "@/lib/life-groves/types";
import { cn } from "@/lib/utils";

interface Props {
  value: GroveType;
  onChange: (v: GroveType) => void;
}

export default function GroveTypePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {GROVE_TYPES.map((g) => (
        <button
          key={g.value}
          type="button"
          onClick={() => onChange(g.value)}
          className={cn(
            "text-left p-3 rounded-xl border transition-all bg-card/40 hover:bg-card/70",
            value === g.value
              ? "border-primary/60 ring-1 ring-primary/30"
              : "border-border/40",
          )}
        >
          <p className="font-serif text-sm text-foreground">{g.label}</p>
          <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">
            {g.hint}
          </p>
        </button>
      ))}
    </div>
  );
}
