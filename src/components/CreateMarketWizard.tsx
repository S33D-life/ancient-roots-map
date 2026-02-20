import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import type { MarketType, MarketScope } from "@/hooks/use-markets";

interface CreateMarketWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  prefillHive?: string;
  prefillTreeId?: string;
}

const STEPS = ["Template", "Scope", "Resolution", "Funding", "Review"];

const TEMPLATES: { type: MarketType; label: string; desc: string; emoji: string; defaultOutcomes: string[] }[] = [
  {
    type: "binary",
    label: "Yes / No",
    desc: "A clear outcome resolves as Yes or No. Best for event predictions.",
    emoji: "⚖️",
    defaultOutcomes: ["Yes", "No"],
  },
  {
    type: "date_range",
    label: "First Event Date",
    desc: "Predict when something first happens — first blossom, first frost, first sighting.",
    emoji: "🗓️",
    defaultOutcomes: ["Before Mar 1", "Mar 1–7", "Mar 8–14", "Mar 15–21", "Mar 22–31", "April or later"],
  },
  {
    type: "numeric",
    label: "Over / Under",
    desc: "Will a measured value exceed a threshold? Rainfall, river level, temperature.",
    emoji: "📊",
    defaultOutcomes: ["Above threshold", "Below threshold"],
  },
];

const CreateMarketWizard = ({ open, onOpenChange, onCreated, prefillHive, prefillTreeId }: CreateMarketWizardProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [marketType, setMarketType] = useState<MarketType>("binary");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<MarketScope>("grove");
  const [hiveId, setHiveId] = useState(prefillHive || "");
  const [treeIdStr, setTreeIdStr] = useState(prefillTreeId || "");
  const [resolutionSource, setResolutionSource] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [evidencePolicy, setEvidencePolicy] = useState("photographic evidence with GPS and timestamp");
  const [closeTime, setCloseTime] = useState("");
  const [resolveTime, setResolveTime] = useState("");
  const [outcomes, setOutcomes] = useState<string[]>(["Yes", "No"]);
  const [winnerPct, setWinnerPct] = useState(85);
  const [grovePct, setGrovePct] = useState(10);
  const [researchPct, setResearchPct] = useState(5);

  const selectedTemplate = TEMPLATES.find(t => t.type === marketType);

  const selectTemplate = (type: MarketType) => {
    setMarketType(type);
    const tpl = TEMPLATES.find(t => t.type === type)!;
    setOutcomes([...tpl.defaultOutcomes]);
  };

  const isStepValid = () => {
    if (step === 0) return !!marketType;
    if (step === 1) return title.trim().length >= 10 && !!scope;
    if (step === 2) return !!closeTime && (!!resolutionSource || !!evidencePolicy);
    if (step === 3) return winnerPct + grovePct + researchPct === 100;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const treeIds = treeIdStr.trim() ? [treeIdStr.trim()] : [];

      const { data: market, error: mErr } = await supabase
        .from("markets")
        .insert({
          creator_user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          rules_text: rulesText.trim() || null,
          evidence_policy: evidencePolicy.trim() || null,
          resolution_source: resolutionSource.trim() || null,
          market_type: marketType,
          scope,
          linked_hive_id: hiveId.trim() || null,
          linked_tree_ids: treeIds,
          status: "open",
          close_time: new Date(closeTime).toISOString(),
          resolve_time: resolveTime ? new Date(resolveTime).toISOString() : null,
          winner_pool_percent: winnerPct,
          grove_fund_percent: grovePct,
          research_pot_percent: researchPct,
        })
        .select("id")
        .single();

      if (mErr || !market) throw mErr;

      // Insert outcomes
      await supabase.from("market_outcomes").insert(
        outcomes.filter(o => o.trim()).map((label, i) => ({
          market_id: market.id,
          label: label.trim(),
          sort_order: i,
        }))
      );

      toast({ title: "Market created!", description: "Your Cycle Market is now open." });
      onOpenChange(false);
      onCreated?.();
      resetForm();
    } catch (e: unknown) {
      toast({ title: "Failed to create market", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(0); setTitle(""); setDescription(""); setScope("grove");
    setResolutionSource(""); setRulesText(""); setCloseTime(""); setResolveTime("");
    setOutcomes(["Yes", "No"]); setWinnerPct(85); setGrovePct(10); setResearchPct(5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary flex items-center gap-2">
            🌀 Create Cycle Market
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full text-[10px] font-serif flex items-center justify-center transition-colors ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 transition-colors ${i < step ? "bg-primary/50" : "bg-border/30"}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs font-serif text-muted-foreground">{STEPS[step]}</span>
        </div>

        {/* Step 0: Template */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-serif">Choose a market template to get started.</p>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.type}
                onClick={() => selectTemplate(tpl.type)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  marketType === tpl.type
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/40 hover:border-border/80 bg-card/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{tpl.emoji}</span>
                  <span className="font-serif text-sm text-foreground">{tpl.label}</span>
                  {marketType === tpl.type && <Badge className="text-[10px] ml-auto">Selected</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground font-serif">{tpl.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Scope & Title */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="font-serif text-xs">Market Question *</Label>
              <Textarea
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Will ash leaf before oak this spring in Norfolk?"
                className="mt-1 font-serif text-sm resize-none"
                rows={2}
              />
              {title.trim().length > 0 && title.trim().length < 10 && (
                <p className="text-[11px] text-destructive mt-1 font-serif">Question must be at least 10 characters.</p>
              )}
            </div>
            <div>
              <Label className="font-serif text-xs">Context / Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any background ecology, local tradition, or why this matters..."
                className="mt-1 font-serif text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="font-serif text-xs">Scope *</Label>
              <Select value={scope} onValueChange={v => setScope(v as MarketScope)}>
                <SelectTrigger className="mt-1 font-serif text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tree">🌳 Specific Tree</SelectItem>
                  <SelectItem value="grove">🌿 Grove / Local Area</SelectItem>
                  <SelectItem value="species">🔥 Species-wide</SelectItem>
                  <SelectItem value="region">🌍 Regional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(scope === "tree" || scope === "grove") && (
              <div>
                <Label className="font-serif text-xs">Linked Tree ID (optional)</Label>
                <Input
                  value={treeIdStr}
                  onChange={e => setTreeIdStr(e.target.value)}
                  placeholder="Tree UUID"
                  className="mt-1 font-serif text-sm"
                />
              </div>
            )}
            {(scope === "species" || scope === "grove") && (
              <div>
                <Label className="font-serif text-xs">Hive / Species Family (optional)</Label>
                <Input
                  value={hiveId}
                  onChange={e => setHiveId(e.target.value)}
                  placeholder="e.g. Oak, Ash, Hawthorn"
                  className="mt-1 font-serif text-sm"
                />
              </div>
            )}

            {/* Outcomes editor */}
            <div>
              <Label className="font-serif text-xs">Outcomes (edit if needed)</Label>
              <div className="mt-1 space-y-1.5">
                {outcomes.map((o, i) => (
                  <Input
                    key={i}
                    value={o}
                    onChange={e => {
                      const next = [...outcomes]; next[i] = e.target.value; setOutcomes(next);
                    }}
                    className="font-serif text-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Resolution */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="font-serif text-xs">Close Date & Time *</Label>
              <Input
                type="datetime-local"
                value={closeTime}
                onChange={e => setCloseTime(e.target.value)}
                className="mt-1 font-serif text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-serif">Market closes to new stakes at this time.</p>
            </div>
            <div>
              <Label className="font-serif text-xs">Resolve Date & Time (optional)</Label>
              <Input
                type="datetime-local"
                value={resolveTime}
                onChange={e => setResolveTime(e.target.value)}
                className="mt-1 font-serif text-sm"
              />
            </div>
            <div>
              <Label className="font-serif text-xs">Resolution Source *</Label>
              <Input
                value={resolutionSource}
                onChange={e => setResolutionSource(e.target.value)}
                placeholder="Met Office station X, River gauge Y, photographic evidence..."
                className="mt-1 font-serif text-sm"
              />
              {!resolutionSource && !evidencePolicy && (
                <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-serif">
                  <AlertCircle className="w-3 h-3" /> Provide at least one resolution method.
                </p>
              )}
            </div>
            <div>
              <Label className="font-serif text-xs">Evidence Policy</Label>
              <Textarea
                value={evidencePolicy}
                onChange={e => setEvidencePolicy(e.target.value)}
                className="mt-1 font-serif text-sm resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label className="font-serif text-xs">Plain-Language Rules</Label>
              <Textarea
                value={rulesText}
                onChange={e => setRulesText(e.target.value)}
                placeholder="Any local definition of the event, tie-breaking rules, etc."
                className="mt-1 font-serif text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Funding */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-xs font-serif text-muted-foreground">
              Allocate how resolved Hearts are distributed. Must total 100%.
              <span className="block mt-1 text-primary/70">In-app Hearts only — not real money.</span>
            </p>

            {[
              { label: "Winner Pool", key: "winner", value: winnerPct, set: setWinnerPct, cls: "text-primary" },
              { label: "Grove Fund", key: "grove", value: grovePct, set: setGrovePct, cls: "text-accent" },
              { label: "Research Pot", key: "research", value: researchPct, set: setResearchPct, cls: "text-muted-foreground" },
            ].map(({ label, key, value, set, cls }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="font-serif text-xs">{label}</Label>
                  <span className={`text-sm font-serif tabular-nums ${cls}`}>{value}%</span>
                </div>
                <Slider
                  min={0} max={100} step={5}
                  value={[value]}
                  onValueChange={([v]) => set(v)}
                  className="[&_[role=slider]]:border-2"
                />
              </div>
            ))}

            {winnerPct + grovePct + researchPct !== 100 && (
              <p className="text-[11px] text-destructive flex items-center gap-1 font-serif">
                <AlertCircle className="w-3 h-3" /> Total must equal 100% (currently {winnerPct + grovePct + researchPct}%)
              </p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 space-y-2 text-sm font-serif">
              <p><span className="text-muted-foreground">Type:</span> {TEMPLATES.find(t => t.type === marketType)?.label}</p>
              <p><span className="text-muted-foreground">Question:</span> {title}</p>
              <p><span className="text-muted-foreground">Scope:</span> {scope}</p>
              <p><span className="text-muted-foreground">Outcomes:</span> {outcomes.filter(Boolean).join(" · ")}</p>
              <p><span className="text-muted-foreground">Closes:</span> {closeTime ? new Date(closeTime).toLocaleString() : "–"}</p>
              <p><span className="text-muted-foreground">Resolution:</span> {resolutionSource || evidencePolicy}</p>
              <div className="pt-2 border-t border-border/30">
                <p className="text-muted-foreground text-[11px] mb-1">Fund allocation:</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="text-primary">{winnerPct}% winners</span>
                  <span className="text-emerald-500">{grovePct}% grove</span>
                  <span className="text-sky-500">{researchPct}% research</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-serif">
              ⚠️ In-app S33D Hearts only. Not real money. Content must relate to nature cycles and local ecology.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-4 pt-4 border-t border-border/30">
          {step > 0 ? (
            <Button variant="outline" size="sm" className="font-serif text-xs gap-1" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              className="font-serif text-xs gap-1"
              onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid()}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="font-serif text-xs gap-1 bg-primary"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✦ Publish Market"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarketWizard;
