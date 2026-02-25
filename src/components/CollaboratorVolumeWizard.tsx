import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, BookOpen, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WizardData) => Promise<void>;
}

export interface WizardData {
  collaborator_name: string;
  collaborator_project: string;
  document_title: string;
  document_version: string;
  themes: string[];
  essence_summary: string;
  resonance_map: string;
  divergence_map: string;
  integration_intent: string;
}

const STEPS = [
  "Metadata",
  "Essence",
  "Resonance",
  "Divergence",
  "Intent",
  "Confirm",
];

const INTENT_OPTIONS = [
  { value: "exploring", label: "Exploring", desc: "Early curiosity, no commitment" },
  { value: "resonance", label: "Resonance", desc: "Deep alignment worth amplifying" },
  { value: "prototype", label: "Prototype", desc: "Actionable ideas to test" },
  { value: "experiment", label: "Experiment", desc: "Active real-world testing" },
  { value: "archival", label: "Archival", desc: "Historical reference, preserved" },
];

const CollaboratorVolumeWizard = ({ open, onClose, onSubmit }: WizardProps) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [themeInput, setThemeInput] = useState("");
  const [data, setData] = useState<WizardData>({
    collaborator_name: "",
    collaborator_project: "",
    document_title: "",
    document_version: "1.0",
    themes: [],
    essence_summary: "",
    resonance_map: "",
    divergence_map: "",
    integration_intent: "exploring",
  });

  const update = (field: keyof WizardData, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const addTheme = () => {
    const t = themeInput.trim();
    if (t && !data.themes.includes(t)) {
      update("themes", [...data.themes, t]);
      setThemeInput("");
    }
  };

  const removeTheme = (t: string) =>
    update("themes", data.themes.filter((x) => x !== t));

  const canNext = () => {
    if (step === 0) return data.collaborator_name.trim() && data.document_title.trim();
    if (step === 1) return data.essence_summary.trim().length > 10;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Volume placed on your shelf", {
        description: "Visibility: Root (Private)",
      });
      setData({
        collaborator_name: "", collaborator_project: "", document_title: "",
        document_version: "1.0", themes: [], essence_summary: "",
        resonance_map: "", divergence_map: "", integration_intent: "exploring",
      });
      setStep(0);
      onClose();
    } catch {
      toast.error("Could not create volume");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            New Collaborator Volume
          </DialogTitle>
          <div className="flex items-center gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-serif mt-1">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-2"
          >
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label className="font-serif text-xs">Collaborator Name *</Label>
                  <Input
                    value={data.collaborator_name}
                    onChange={(e) => update("collaborator_name", e.target.value)}
                    placeholder="e.g. Robin Wall Kimmerer"
                    className="font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-serif text-xs">Project / Work</Label>
                  <Input
                    value={data.collaborator_project}
                    onChange={(e) => update("collaborator_project", e.target.value)}
                    placeholder="e.g. Braiding Sweetgrass"
                    className="font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-serif text-xs">Document Title *</Label>
                  <Input
                    value={data.document_title}
                    onChange={(e) => update("document_title", e.target.value)}
                    placeholder="e.g. Reciprocity & Botanical Kinship"
                    className="font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-serif text-xs">Version</Label>
                  <Input
                    value={data.document_version}
                    onChange={(e) => update("document_version", e.target.value)}
                    className="font-serif w-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-serif text-xs">Themes</Label>
                  <div className="flex gap-2">
                    <Input
                      value={themeInput}
                      onChange={(e) => setThemeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
                      placeholder="Add theme…"
                      className="font-serif flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addTheme}>+</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.themes.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="cursor-pointer font-serif text-xs"
                        onClick={() => removeTheme(t)}
                      >
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-2">
                <Label className="font-serif text-xs">Essence Summary *</Label>
                <p className="text-[10px] text-muted-foreground font-serif">
                  In your own words, what is the core insight or offering of this collaboration?
                </p>
                <Textarea
                  value={data.essence_summary}
                  onChange={(e) => update("essence_summary", e.target.value)}
                  placeholder="The heart of this volume…"
                  className="font-serif min-h-[160px]"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label className="font-serif text-xs">Resonance Map</Label>
                <p className="text-[10px] text-muted-foreground font-serif">
                  Where does this resonate with your existing practice, trees, or community?
                </p>
                <Textarea
                  value={data.resonance_map}
                  onChange={(e) => update("resonance_map", e.target.value)}
                  placeholder="Points of alignment and connection…"
                  className="font-serif min-h-[140px]"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label className="font-serif text-xs">Divergence Map</Label>
                <p className="text-[10px] text-muted-foreground font-serif">
                  Where does this challenge or diverge from your current understanding?
                </p>
                <Textarea
                  value={data.divergence_map}
                  onChange={(e) => update("divergence_map", e.target.value)}
                  placeholder="Tensions, questions, productive disagreements…"
                  className="font-serif min-h-[140px]"
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <Label className="font-serif text-xs">Integration Intent</Label>
                <p className="text-[10px] text-muted-foreground font-serif">
                  How do you intend to engage with this material?
                </p>
                <Select
                  value={data.integration_intent}
                  onValueChange={(v) => update("integration_intent", v)}
                >
                  <SelectTrigger className="font-serif">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="font-serif">
                        <div>
                          <span className="font-medium">{o.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">— {o.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 p-4 space-y-2" style={{
                  background: "linear-gradient(135deg, hsl(28 25% 12% / 0.6), hsl(22 20% 10% / 0.6))"
                }}>
                  <p className="font-serif text-sm text-primary">
                    {data.document_title}
                  </p>
                  <p className="text-xs text-muted-foreground font-serif">
                    by {data.collaborator_name}
                    {data.collaborator_project && ` · ${data.collaborator_project}`}
                  </p>
                  {data.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {data.themes.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] font-serif">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-2 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span className="font-serif">Visibility: Root (Private)</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-serif text-center">
                  This volume begins in your private shelf. You can share it later.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="font-serif text-xs gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step > 0 ? "Back" : "Cancel"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="font-serif text-xs gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="font-serif text-xs gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {submitting ? "Placing…" : "Place on Shelf"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorVolumeWizard;
