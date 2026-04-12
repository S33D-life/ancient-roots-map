import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CouncilSession } from "@/data/council/councilCycles";
import { saveCuratorOverride, resetCuratorOverride } from "@/data/council/curatorOverrides";

interface CuratorEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  council: CouncilSession;
  onSaved: () => void;
}

const CuratorEditor = ({ open, onOpenChange, council, onSaved }: CuratorEditorProps) => {
  const [title, setTitle] = useState(council.title);
  const [time, setTime] = useState(council.time);
  const [curator, setCurator] = useState(council.curator);
  const [invocation, setInvocation] = useState(council.agenda.invocation);
  const [thisMoon, setThisMoon] = useState(council.agenda.thisMoon);
  const [timeTreeQuestion, setTimeTreeQuestion] = useState(council.agenda.timeTreeQuestion);
  const [focusAreas, setFocusAreas] = useState<string[]>([...council.agenda.focusAreas]);
  const [plant, setPlant] = useState(council.highlights?.plant ?? "");
  const [tree, setTree] = useState(council.highlights?.tree ?? "");
  const [project, setProject] = useState(council.highlights?.project ?? "");

  const handleSave = useCallback(() => {
    saveCuratorOverride(council.id, {
      title,
      time,
      curator,
      agenda: {
        invocation,
        thisMoon,
        timeTreeQuestion,
        focusAreas: focusAreas.filter(Boolean),
      },
      highlights: {
        plant: plant || undefined,
        tree: tree || undefined,
        project: project || undefined,
      },
    });
    onSaved();
    onOpenChange(false);
    toast.success("Council updated 🌱");
  }, [title, time, curator, invocation, thisMoon, timeTreeQuestion, focusAreas, plant, tree, project, council.id, onSaved, onOpenChange]);

  const handleReset = useCallback(() => {
    resetCuratorOverride(council.id);
    onSaved();
    onOpenChange(false);
    toast("Reset to base content", { description: "Curator draft removed" });
  }, [council.id, onSaved, onOpenChange]);

  const addFocusArea = () => setFocusAreas([...focusAreas, ""]);
  const removeFocusArea = (idx: number) => setFocusAreas(focusAreas.filter((_, i) => i !== idx));
  const updateFocusArea = (idx: number, val: string) => {
    const next = [...focusAreas];
    next[idx] = val;
    setFocusAreas(next);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="font-serif text-lg tracking-wide">Edit Current Council</SheetTitle>
          <SheetDescription className="font-serif text-xs text-muted-foreground/60">
            {council.id} · {council.moonPhase === "new" ? "🌑 New Moon" : "🌕 Full Moon"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5">
          <div className="space-y-5 pb-28">
            {/* ── Basic ── */}
            <section className="space-y-3">
              <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/50">Basic</h4>
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Time" value={time} onChange={setTime} />
              <Field label="Curator" value={curator} onChange={setCurator} />
            </section>

            <Separator className="bg-border/20" />

            {/* ── Agenda ── */}
            <section className="space-y-3">
              <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/50">Agenda</h4>
              <FieldArea label="Opening Invocation" value={invocation} onChange={setInvocation} rows={4} />
              <FieldArea label="This Moon" value={thisMoon} onChange={setThisMoon} rows={3} />
              <FieldArea label="Time Tree Question" value={timeTreeQuestion} onChange={setTimeTreeQuestion} rows={3} />
            </section>

            <Separator className="bg-border/20" />

            {/* ── Focus Areas ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/50">Focus Areas</h4>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addFocusArea}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {focusAreas.map((area, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    value={area}
                    onChange={(e) => updateFocusArea(i, e.target.value)}
                    className="text-sm font-serif"
                    placeholder="Focus area…"
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFocusArea(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </section>

            <Separator className="bg-border/20" />

            {/* ── Highlights ── */}
            <section className="space-y-3">
              <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/50">In Focus This Cycle</h4>
              <Field label="🌱 Plant" value={plant} onChange={setPlant} placeholder="Optional" />
              <Field label="🌳 Tree" value={tree} onChange={setTree} placeholder="Optional" />
              <Field label="🛠 Project" value={project} onChange={setProject} placeholder="Optional" />
            </section>
          </div>
        </ScrollArea>

        {/* Sticky footer */}
        <div className="border-t border-border/30 bg-background p-4 flex gap-2">
          <Button onClick={handleSave} className="flex-1 font-serif tracking-wide">
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} className="font-serif tracking-wide text-xs">
            Reset to Base
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-serif tracking-wide text-xs">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Tiny field helpers ──

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-serif text-muted-foreground/70">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm font-serif" placeholder={placeholder} />
    </div>
  );
}

function FieldArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-serif text-muted-foreground/70">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="text-sm font-serif resize-y" />
    </div>
  );
}

export default CuratorEditor;
