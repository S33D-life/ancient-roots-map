/**
 * PhenologyObservationButton — Lets users submit phenology observations.
 * Lightweight community data collection.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye } from "lucide-react";

const OBSERVATION_TYPES = [
  { value: "bud", label: "Budding", emoji: "🌱" },
  { value: "flower", label: "Flowering", emoji: "🌸" },
  { value: "fruit", label: "Fruiting", emoji: "🍎" },
  { value: "leaf_fall", label: "Leaf fall", emoji: "🍂" },
  { value: "first_frost", label: "First frost", emoji: "❄️" },
  { value: "bare", label: "Bare / Dormant", emoji: "🪵" },
] as const;

interface Props {
  treeId?: string;
  speciesKey?: string;
  userId: string | null;
}

const PhenologyObservationButton = ({ treeId, speciesKey, userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!userId) return null;

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);

    const { error } = await supabase.from("phenology_observations").insert({
      user_id: userId,
      tree_id: treeId || null,
      species_key: speciesKey || null,
      observation_type: selected,
      notes: notes.trim() || null,
      observed_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit observation");
    } else {
      toast.success("Observation recorded 🌿");
      setOpen(false);
      setSelected(null);
      setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-serif gap-1 text-muted-foreground">
          <Eye className="w-3 h-3" /> Report observation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">What do you see?</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground font-serif">
          Your observation helps refine local phenology data for this species.
        </p>
        <div className="grid grid-cols-3 gap-2 py-3">
          {OBSERVATION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelected(t.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-serif transition-all ${
                selected === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:bg-card/60"
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px]">{t.label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes..."
          maxLength={500}
          className="w-full text-xs font-serif p-2 rounded-lg border border-border/30 bg-card/40 resize-none h-16"
        />
        <Button
          onClick={submit}
          disabled={!selected || submitting}
          className="w-full font-serif text-xs"
          size="sm"
        >
          {submitting ? "Submitting..." : "Submit Observation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PhenologyObservationButton;
