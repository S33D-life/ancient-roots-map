/**
 * PoemOfferingInput — shared poem capability.
 * Write your own, or name a known poem and its poet, or paste a link.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface PoemOfferingData {
  poemTitle: string;
  poet: string;
  text: string;
  sourceUrl: string;
}

interface Props {
  value: PoemOfferingData;
  onChange: (v: PoemOfferingData) => void;
}

type Mode = "write" | "known";

export default function PoemOfferingInput({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("write");
  const set = (patch: Partial<PoemOfferingData>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-card/40 border border-border/30">
        {(["write", "known"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 rounded-lg font-serif text-xs transition-colors",
              mode === m ? "bg-primary/10 text-foreground" : "text-muted-foreground/70",
            )}
          >
            {m === "write" ? "Write or paste a poem" : "A poem someone else wrote"}
          </button>
        ))}
      </div>

      {mode === "known" && (
        <div className="grid gap-2">
          <Input
            value={value.poemTitle}
            onChange={(e) => set({ poemTitle: e.target.value })}
            placeholder="Poem title"
            className="font-serif text-base"
          />
          <Input
            value={value.poet}
            onChange={(e) => set({ poet: e.target.value })}
            placeholder="Poet"
            className="font-serif text-base"
          />
          <Input
            value={value.sourceUrl}
            onChange={(e) => set({ sourceUrl: e.target.value })}
            placeholder="Link to the poem (optional)"
            inputMode="url"
            className="font-serif text-base"
          />
        </div>
      )}

      <Textarea
        value={value.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder={mode === "write" ? "Let the poem begin…" : "Paste the lines that belong here (optional)"}
        rows={mode === "write" ? 12 : 6}
        className="font-serif text-base leading-relaxed resize-none"
      />
    </div>
  );
}
