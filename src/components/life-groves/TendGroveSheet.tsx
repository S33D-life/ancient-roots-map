/**
 * TendGroveSheet — a steward tends the grove's canonical identity.
 * Not an "edit form": each change is a deliberate act, and each is recorded.
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GROVE_CONTENT_FIELDS, type GroveFieldKey } from "@/lib/life-groves/stewardship";
import { GROVE_TYPES, TREE_ARCHETYPES, type LifeGrove } from "@/lib/life-groves/types";
import { tendGroveField } from "@/repositories/life-grove-stewardship";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  grove: LifeGrove;
}

export default function TendGroveSheet({ open, onOpenChange, grove }: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Partial<Record<GroveFieldKey, string>>>({});
  const [saving, setSaving] = useState(false);

  const current = useMemo(() => {
    const out: Partial<Record<GroveFieldKey, string>> = {};
    for (const f of GROVE_CONTENT_FIELDS) {
      const v = (grove as unknown as Record<string, unknown>)[f.key];
      out[f.key] = v == null ? "" : String(v);
    }
    return out;
  }, [grove]);

  const changed = GROVE_CONTENT_FIELDS.filter(
    (f) => draft[f.key] !== undefined && draft[f.key] !== current[f.key],
  );

  const save = async () => {
    if (changed.length === 0) return;
    setSaving(true);
    try {
      for (const f of changed) {
        await tendGroveField(grove.id, f.key, draft[f.key]?.trim() || null);
      }
      toast(`The grove has been tended — ${changed.length} change${changed.length === 1 ? "" : "s"} recorded.`);
      qc.invalidateQueries({ queryKey: ["life-grove", grove.id] });
      qc.invalidateQueries({ queryKey: ["grove-tending-history", grove.id] });
      setDraft({});
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "The grove could not be tended.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-xl">Tend this Grove</SheetTitle>
          <SheetDescription className="font-serif text-xs">
            Changes here shape how the grove is known. Each one is quietly recorded.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {GROVE_CONTENT_FIELDS.map((f) => {
            const value = draft[f.key] ?? current[f.key] ?? "";
            const set = (v: string) => setDraft((d) => ({ ...d, [f.key]: v }));
            return (
              <div key={f.key} className="space-y-1.5">
                <label className="font-serif text-xs text-muted-foreground/70">{f.label}</label>
                {f.input === "longtext" ? (
                  <Textarea value={value} onChange={(e) => set(e.target.value)} rows={5}
                    className="font-serif text-base resize-none" />
                ) : f.input === "archetype" ? (
                  <Select value={value} onValueChange={set}>
                    <SelectTrigger className="font-serif text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TREE_ARCHETYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.input === "grove_type" ? (
                  <Select value={value} onValueChange={set}>
                    <SelectTrigger className="font-serif text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GROVE_TYPES.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.input === "date" ? "date" : "text"}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={f.hint}
                    className="font-serif text-base"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-4">
          <Button onClick={save} disabled={changed.length === 0 || saving} className="w-full h-12 font-serif">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {changed.length === 0 ? "Nothing changed yet" : `Tend the grove (${changed.length})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
