import { TREE_ARCHETYPES, type TreeArchetype } from "@/lib/life-groves/types";
import { cn } from "@/lib/utils";

interface Props {
  value: TreeArchetype;
  onChange: (v: TreeArchetype) => void;
}

export default function EtherealTreeArchetypePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {TREE_ARCHETYPES.map((a) => (
        <button
          key={a.value}
          type="button"
          onClick={() => onChange(a.value)}
          className={cn(
            "text-left p-3 rounded-xl border transition-all",
            "bg-card/40 hover:bg-card/70",
            value === a.value
              ? "border-primary/60 ring-1 ring-primary/30"
              : "border-border/40",
          )}
        >
          <p className="font-serif text-sm text-foreground">{a.label}</p>
          <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5 leading-snug">
            {a.description}
          </p>
        </button>
      ))}
    </div>
  );
}
