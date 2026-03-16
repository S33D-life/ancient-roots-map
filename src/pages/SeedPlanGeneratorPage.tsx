/**
 * Seed-Plan Generator — Planning chamber for curated starter planting plans.
 *
 * Bridges dataset discovery/configuration → seed pack → research_trees.
 * Reads from datasetIntegration.ts configs and candidate datasets.
 */
import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sprout, TreeDeciduous, Download, ChevronRight, Target,
  Shuffle, Check, Circle, Layers, FileJson, BookOpen, Leaf,
  ArrowLeft, Map, BarChart3, Sparkles, Eye
} from "lucide-react";
import { DATASET_CONFIGS, type DatasetConfig, type CircleConfig, type SeedTree } from "@/config/datasetIntegration";

/* ── Types ── */

interface SeedCandidate {
  id: string;
  tree_name: string;
  species_scientific: string;
  species_common: string;
  province: string;
  locality_text: string;
  designation_type: string;
  latitude: number;
  longitude: number;
  height_m?: number;
  age_estimate?: string;
  description: string;
  source_row_ref: string;
  suggested_circle: string;
  seed_priority_score: number;
  included: boolean;
  scores: {
    cultural_significance: number;
    geographic_spread: number;
    species_rarity: number;
    story_value: number;
    data_completeness: number;
    official_status: number;
  };
}

interface SeedPlan {
  dataset_key: string;
  dataset_name: string;
  country_name: string;
  seed_size: number;
  circles: CircleConfig[];
  candidates: SeedCandidate[];
  strategy_explanation: string;
  readiness_mode: string;
  generated_at: string;
}

/* ── Scoring helpers ── */

const SEED_SIZES = [12, 18, 24, 33, 48];

function generateCandidatesForConfig(config: DatasetConfig, targetSize: number): SeedCandidate[] {
  const candidates: SeedCandidate[] = [];
  const perCircle = Math.ceil(targetSize / config.circles.length);

  for (const circle of config.circles) {
    for (let i = 0; i < perCircle; i++) {
      const idx = i + 1;
      const ref = `${circle.refPrefix}-${String(idx).padStart(3, "0")}`;
      const lat = config.center.lat + (Math.random() - 0.5) * (config.bbox[2] - config.bbox[0]) * 0.4;
      const lng = config.center.lng + (Math.random() - 0.5) * (config.bbox[3] - config.bbox[1]) * 0.4;

      const scores = {
        cultural_significance: 40 + Math.floor(Math.random() * 60),
        geographic_spread: 30 + Math.floor(Math.random() * 70),
        species_rarity: 20 + Math.floor(Math.random() * 80),
        story_value: 50 + Math.floor(Math.random() * 50),
        data_completeness: 30 + Math.floor(Math.random() * 70),
        official_status: 60 + Math.floor(Math.random() * 40),
      };
      const seed_priority_score = Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
      );

      candidates.push({
        id: ref,
        tree_name: `${circle.label} #${idx}`,
        species_scientific: "Species pending",
        species_common: "Awaiting discovery",
        province: config.countryName,
        locality_text: `${circle.label} area`,
        designation_type: config.descriptor,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        description: `Placeholder candidate for ${circle.label} circle. Actual tree data will be sourced during discovery phase.`,
        source_row_ref: ref,
        suggested_circle: circle.key,
        seed_priority_score,
        included: candidates.length < targetSize,
        scores,
      });
    }
  }

  return candidates
    .sort((a, b) => b.seed_priority_score - a.seed_priority_score)
    .map((c, i) => ({ ...c, included: i < targetSize }));
}

function generateStrategyExplanation(config: DatasetConfig, size: number, mode: string): string {
  const circleNames = config.circles.map(c => c.label).join(", ");
  const modeLabel = mode === "ready_to_seed" ? "ready to seed"
    : mode === "needs_manual_curation" ? "manual curation"
    : mode === "partial_seed_possible" ? "partial seed"
    : "source review";

  return `This seed plan proposes ${size} starter trees for ${config.countryName} (${config.name}), ` +
    `distributed across ${config.circles.length} circles: ${circleNames}. ` +
    `The plan is in ${modeLabel} mode. ` +
    `Trees are scored by cultural significance, geographic spread, species rarity, story value, data completeness, and official status. ` +
    `The top ${size} candidates are included in the initial planting set. ` +
    `Remaining candidates can be added in subsequent seeding phases. ` +
    `This plan does not auto-insert records — export the seed pack and run the seed script manually.`;
}

function getReadinessMode(config: DatasetConfig): string {
  if (config.dataFormat === "csv" || config.dataFormat === "rest_api" || config.dataFormat === "geojson") {
    return "ready_to_seed";
  }
  if (config.dataFormat === "manual_curation") {
    return "needs_manual_curation";
  }
  if (config.dataFormat === "pdf_register") {
    return "partial_seed_possible";
  }
  return "source_review_needed";
}

const READINESS_LABELS: Record<string, { label: string; color: string }> = {
  ready_to_seed: { label: "Ready to Seed", color: "bg-primary/20 text-primary border-primary/40" },
  needs_manual_curation: { label: "Manual Curation", color: "bg-accent/20 text-accent-foreground border-accent/40" },
  partial_seed_possible: { label: "Partial Seed", color: "bg-secondary text-secondary-foreground border-border" },
  source_review_needed: { label: "Source Review", color: "bg-muted text-muted-foreground border-border" },
};

/* ── Components ── */

function DatasetSelector({
  selectedKey,
  onSelect,
}: {
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const allConfigs = Object.values(DATASET_CONFIGS);

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Select Dataset Region
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedKey || ""} onValueChange={onSelect}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Choose a dataset…" />
          </SelectTrigger>
          <SelectContent>
            {allConfigs.map(c => (
              <SelectItem key={c.key} value={c.key}>
                {c.flag} {c.countryName} — {c.descriptor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedKey && DATASET_CONFIGS[selectedKey] && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
            <p className="text-sm text-foreground font-serif">{DATASET_CONFIGS[selectedKey].portalTitle}</p>
            <p className="text-xs text-muted-foreground">{DATASET_CONFIGS[selectedKey].portalSubtitle}</p>
            {DATASET_CONFIGS[selectedKey].provenanceText && (
              <p className="text-xs text-muted-foreground italic mt-1">{DATASET_CONFIGS[selectedKey].provenanceText}</p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function SeedStrategyPanel({
  seedSize,
  onSeedSizeChange,
  readinessMode,
  storyPriority,
  onStoryPriorityChange,
  diversityPriority,
  onDiversityPriorityChange,
}: {
  seedSize: number;
  onSeedSizeChange: (v: number) => void;
  readinessMode: string;
  storyPriority: number;
  onStoryPriorityChange: (v: number) => void;
  diversityPriority: number;
  onDiversityPriorityChange: (v: number) => void;
}) {
  const rm = READINESS_LABELS[readinessMode] || READINESS_LABELS.source_review_needed;

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> Seed Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Readiness Mode</Label>
          <Badge variant="outline" className={`text-xs ${rm.color}`}>{rm.label}</Badge>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Seed Size: {seedSize} trees</Label>
          <div className="flex gap-2 flex-wrap">
            {SEED_SIZES.map(s => (
              <Button
                key={s}
                size="sm"
                variant={seedSize === s ? "default" : "outline"}
                onClick={() => onSeedSizeChange(s)}
                className="text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Story Value Priority</Label>
          <Slider value={[storyPriority]} onValueChange={([v]) => onStoryPriorityChange(v)} min={0} max={100} step={5} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Species Diversity Priority</Label>
          <Slider value={[diversityPriority]} onValueChange={([v]) => onDiversityPriorityChange(v)} min={0} max={100} step={5} />
        </div>
      </CardContent>
    </Card>
  );
}

function CirclePlannerPanel({ circles }: { circles: CircleConfig[] }) {
  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <Circle className="w-4 h-4 text-primary" /> Circle Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {circles.map(c => (
            <div key={c.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.refPrefix}-###</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateList({
  candidates,
  circles,
  onToggle,
}: {
  candidates: SeedCandidate[];
  circles: CircleConfig[];
  onToggle: (id: string) => void;
}) {
  const circleMap = Object.fromEntries(circles.map(c => [c.key, c]));
  const included = candidates.filter(c => c.included);
  const excluded = candidates.filter(c => !c.included);

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <TreeDeciduous className="w-4 h-4 text-primary" /> Candidate Trees
          <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/30">
            {included.length} included
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {candidates.map(c => {
            const circle = circleMap[c.suggested_circle];
            return (
              <motion.div
                key={c.id}
                layout
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  c.included
                    ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                    : "bg-muted/10 border-border/20 hover:border-border/40 opacity-60"
                }`}
                onClick={() => onToggle(c.id)}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  c.included ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {c.included ? <Check className="w-3 h-3" /> : null}
                </div>
                <span className="text-sm shrink-0">{circle?.icon || "🌳"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.tree_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.locality_text}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-primary">{c.seed_priority_score}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanSummary({ plan }: { plan: SeedPlan }) {
  const circleGroups = plan.circles.map(c => {
    const count = plan.candidates.filter(t => t.included && t.suggested_circle === c.key).length;
    return { ...c, count };
  });

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Seed Plan Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-2xl font-serif text-primary">{plan.candidates.filter(c => c.included).length}</p>
            <p className="text-xs text-muted-foreground">Trees in plan</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-2xl font-serif text-primary">{plan.circles.length}</p>
            <p className="text-xs text-muted-foreground">Circles</p>
          </div>
        </div>

        <div className="space-y-1">
          {circleGroups.map(c => (
            <div key={c.key} className="flex items-center gap-2 text-xs">
              <span>{c.icon}</span>
              <span className="text-foreground">{c.label}</span>
              <span className="ml-auto text-muted-foreground">{c.count} trees</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-muted/10 border border-border/20">
          <p className="text-xs text-muted-foreground leading-relaxed">{plan.strategy_explanation}</p>
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Ready-to-run command:</p>
          <code className="text-xs font-mono text-primary break-all">
            node scripts/seed-dataset.mjs --dataset={plan.dataset_key} --dryRun=true
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportPanel({ plan, config }: { plan: SeedPlan; config: DatasetConfig }) {
  const seedJson = useMemo(() => {
    const trees: Partial<SeedTree>[] = plan.candidates
      .filter(c => c.included)
      .map(c => ({
        tree_name: c.tree_name,
        species_scientific: c.species_scientific,
        species_common: c.species_common,
        designation_type: c.designation_type,
        province: c.province,
        city: config.countryName,
        locality_text: c.locality_text,
        latitude: c.latitude,
        longitude: c.longitude,
        description: c.description,
        source_row_ref: c.source_row_ref,
      }));
    return JSON.stringify(trees, null, 2);
  }, [plan, config]);

  const configJson = useMemo(() => {
    return JSON.stringify({
      name: config.name,
      key: config.key,
      countryName: config.countryName,
      sourceUrl: config.sourceUrl,
      sourceYear: new Date().getFullYear(),
    }, null, 2);
  }, [config]);

  const downloadFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, []);

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif flex items-center gap-2">
          <FileJson className="w-4 h-4 text-primary" /> Export Seed Pack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Download seed files compatible with <code className="text-primary">scripts/seed-dataset.mjs</code>.
          Review and edit before running.
        </p>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => downloadFile(seedJson, `${config.key}.json`)}
        >
          <Download className="w-4 h-4" />
          <span className="text-xs">seeds/{config.key}.json</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {plan.candidates.filter(c => c.included).length} trees
          </Badge>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => downloadFile(configJson, `${config.key}.config.json`)}
        >
          <Download className="w-4 h-4" />
          <span className="text-xs">seeds/{config.key}.config.json</span>
        </Button>

        <div className="mt-4 p-3 rounded-lg bg-muted/10 border border-border/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Seed JSON Preview</p>
          <pre className="text-[10px] font-mono text-foreground/80 max-h-40 overflow-auto whitespace-pre-wrap">
            {seedJson.slice(0, 800)}{seedJson.length > 800 ? "\n…" : ""}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */

const SeedPlanGeneratorPage = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [seedSize, setSeedSize] = useState(24);
  const [storyPriority, setStoryPriority] = useState(60);
  const [diversityPriority, setDiversityPriority] = useState(50);
  const [candidates, setCandidates] = useState<SeedCandidate[]>([]);
  const [plan, setPlan] = useState<SeedPlan | null>(null);
  const [activeTab, setActiveTab] = useState("strategy");

  const config = selectedKey ? DATASET_CONFIGS[selectedKey] : null;
  const readinessMode = config ? getReadinessMode(config) : "source_review_needed";

  const handleSelectDataset = useCallback((key: string) => {
    setSelectedKey(key);
    setPlan(null);
    const cfg = DATASET_CONFIGS[key];
    if (cfg) {
      setCandidates(generateCandidatesForConfig(cfg, seedSize));
    }
  }, [seedSize]);

  const handleSeedSizeChange = useCallback((size: number) => {
    setSeedSize(size);
    if (config) {
      const newCandidates = generateCandidatesForConfig(config, size);
      setCandidates(newCandidates);
      setPlan(null);
    }
  }, [config]);

  const handleToggleCandidate = useCallback((id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, included: !c.included } : c));
    setPlan(null);
  }, []);

  const handleGeneratePlan = useCallback(() => {
    if (!config) return;
    const newPlan: SeedPlan = {
      dataset_key: config.key,
      dataset_name: config.name,
      country_name: config.countryName,
      seed_size: seedSize,
      circles: config.circles,
      candidates,
      strategy_explanation: generateStrategyExplanation(config, candidates.filter(c => c.included).length, readinessMode),
      readiness_mode: readinessMode,
      generated_at: new Date().toISOString(),
    };
    setPlan(newPlan);
    setActiveTab("summary");
    toast.success("Seed plan generated");
  }, [config, seedSize, candidates, readinessMode]);

  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/tree-data-commons" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3 h-3" /> Tree Data Commons
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-foreground">Seed-Plan Generator</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Prepare curated starter planting plans for the Ancient Friends research canopy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dataset Selector */}
        <div className="mb-6">
          <DatasetSelector selectedKey={selectedKey} onSelect={handleSelectDataset} />
        </div>

        {config && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-card/60 border border-border/30 mb-6 flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="strategy" className="text-xs gap-1"><Layers className="w-3 h-3" /> Strategy</TabsTrigger>
                <TabsTrigger value="circles" className="text-xs gap-1"><Circle className="w-3 h-3" /> Circles</TabsTrigger>
                <TabsTrigger value="candidates" className="text-xs gap-1"><TreeDeciduous className="w-3 h-3" /> Candidates</TabsTrigger>
                <TabsTrigger value="summary" className="text-xs gap-1"><BarChart3 className="w-3 h-3" /> Summary</TabsTrigger>
                <TabsTrigger value="export" className="text-xs gap-1"><Download className="w-3 h-3" /> Export</TabsTrigger>
              </TabsList>

              <TabsContent value="strategy">
                <SeedStrategyPanel
                  seedSize={seedSize}
                  onSeedSizeChange={handleSeedSizeChange}
                  readinessMode={readinessMode}
                  storyPriority={storyPriority}
                  onStoryPriorityChange={setStoryPriority}
                  diversityPriority={diversityPriority}
                  onDiversityPriorityChange={setDiversityPriority}
                />
                <div className="mt-4">
                  <Button onClick={handleGeneratePlan} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Seed Plan
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="circles">
                <CirclePlannerPanel circles={config.circles} />
              </TabsContent>

              <TabsContent value="candidates">
                <CandidateList candidates={candidates} circles={config.circles} onToggle={handleToggleCandidate} />
                <div className="mt-4">
                  <Button onClick={handleGeneratePlan} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Seed Plan
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="summary">
                {plan ? (
                  <PlanSummary plan={plan} />
                ) : (
                  <Card className="border-border/20 bg-card/40">
                    <CardContent className="py-12 text-center">
                      <Sprout className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Generate a plan first to see the summary.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="export">
                {plan ? (
                  <ExportPanel plan={plan} config={config} />
                ) : (
                  <Card className="border-border/20 bg-card/40">
                    <CardContent className="py-12 text-center">
                      <FileJson className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Generate a plan first to export the seed pack.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Empty state */}
        {!config && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-serif">Choose a dataset region above</p>
            <p className="text-xs text-muted-foreground">to begin preparing a curated starter planting plan.</p>
          </motion.div>
        )}

        {/* Connected Systems */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10">
          <h2 className="text-sm font-serif text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Connected Systems
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
              { label: "Discovery Agent", to: "/discovery-agent", icon: "🔭" },
              { label: "Expansion Map", to: "/atlas-expansion", icon: "🌍" },
              { label: "Canopy Projection", to: "/canopy-projection", icon: "🔮" },
              { label: "Dataset Watcher", to: "/dataset-watcher", icon: "👁️" },
              { label: "Atlas Map", to: "/map", icon: "🗺" },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/40 transition-all group text-sm">
                <span>{link.icon}</span>
                <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default SeedPlanGeneratorPage;
