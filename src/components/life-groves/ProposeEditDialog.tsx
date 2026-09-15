/**
 * ProposeEditDialog — a contributor gently proposes a correction.
 * Proposals never overwrite the grove; a steward decides.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GROVE_CONTENT_FIELDS, type GroveFieldKey } from "@/lib/life-groves/stewardship";
import type { LifeGrove } from "@/lib/life-groves/types";
import { proposeGroveEdit } from "@/repositories/life-grove-stewardship";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  grove: LifeGrove;
  userId: string;
}

export default function ProposeEditDialog({ open, onOpenChange, grove, userId }: Props) {
  const qc = useQueryClient();
  const [field, setField] = useState<GroveFieldKey>("grove_title");
  const [value, setValue] = useState("");
  const [why, setWhy] = useState("");
  const [saving, setSaving] = useState(false);

  const currentValue = (() => {
    const v = (grove as unknown as Record<string, unknown>)[field];
    return v == null ? "" : String(v);
  })();

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await proposeGroveEdit({
        groveId: grove.id,
        proposedBy: userId,
        field,
        currentValue: currentValue || null,
        proposedValue: value.trim(),
        explanation: why.trim() || undefined,
      });
      toast("Your proposal has been passed to the grove's stewards.");
      qc.invalidateQueries({ queryKey: ["grove-proposals", grove.id] });
      setValue("");
      setWhy("");
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "The proposal could not be sent.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-lg">Propose an edit</DialogTitle>
          <DialogDescription className="font-serif text-xs">
            Suggest a gentle correction. A steward will read it before anything changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={field} onValueChange={(v) => setField(v as GroveFieldKey)}>
            <SelectTrigger className="font-serif text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROVE_CONTENT_FIELDS.map((f) => (
                <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
            <p className="font-serif text-[11px] text-muted-foreground/60">Currently</p>
            <p className="font-serif text-sm text-foreground/90 break-words">
              {currentValue || <span className="italic text-muted-foreground/50">empty</span>}
            </p>
          </div>

          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your suggestion"
            className="font-serif text-base"
          />
          <Textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="Why does this feel right? (optional)"
            rows={3}
            className="font-serif text-base resize-none"
          />

          <Button onClick={submit} disabled={!value.trim() || saving} className="w-full h-12 font-serif">
            Send to the stewards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
