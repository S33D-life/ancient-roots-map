/**
 * Global Canopy Projection Engine
 *
 * Planning and vision tool that projects future growth of the
 * Ancient Friends ecosystem across datasets, regions, trees,
 * verification, and Heart economy.
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, TreeDeciduous, Globe, TrendingUp, Layers, Heart,
  Server, BarChart3, Leaf, Sparkles, Eye, Users, Database, BookOpen, ChevronRight
} from "lucide-react";

/* ── Types ── */

interface ScenarioInputs {
  datasets_per_year: number;
  avg_seed_size: number;
  avg_full_dataset_size: number;
  approval_rate: number;
  seed_to_verified_rate: number;
  community_growth_rate: number;
  visits_per_tree: number;
  offerings_per_tree: number;
  whispers_per_tree: number;
}

interface YearSnapshot {
  year: number;
  cumulative_datasets: number;
  research_trees: number;
  verified_friends: number;
  countries: number;
  atlas_pages: number;
  visits: number;
  offerings: number;
  whispers: number;
  heart_events: number;
}

/* ── Presets ── */

const PRESETS: Record<string, { label: string; desc: string; confidence: string; inputs: ScenarioInputs }> = {
  conservative: {
    label: "Conservative",
    desc: "Slow, steady expansion with careful curation",
    confidence: "grounded",
    inputs: {
      datasets_per_year: 5,
      avg_seed_size: 24,
      avg_full_dataset_size: 200,
      approval_rate: 0.6,
      seed_to_verified_rate: 0.15,
      community_growth_rate: 1.2,
      visits_per_tree: 3,
      offerings_per_tree: 1,
      whispers_per_tree: 0.5,
    },
  },
  steady: {
    label: "Steady Growth",
    desc: "Consistent integration with moderate community",
    confidence: "grounded",
    inputs: {
      datasets_per_year: 12,
      avg_seed_size: 28,
      avg_full_dataset_size: 500,
      approval_rate: 0.7,
      seed_to_verified_rate: 0.2,
      community_growth_rate: 1.5,
      visits_per_tree: 5,
      offerings_per_tree: 2,
      whispers_per_tree: 1,
    },
  },
  accelerated: {
    label: "Accelerated Canopy",
    desc: "Strong dataset discovery with active community",
    confidence: "optimistic",
    inputs: {
      datasets_per_year: 25,
      avg_seed_size: 33,
      avg_full_dataset_size: 1000,
      approval_rate: 0.75,
      seed_to_verified_rate: 0.25,
      community_growth_rate: 2.0,
      visits_per_tree: 8,
      offerings_per_tree: 3,
      whispers_per_tree: 2,
    },
  },
  bloom: {
    label: "Global Bloom",
    desc: "Broad planetary participation and discovery",
    confidence: "speculative",
    inputs: {
      datasets_per_year: 50,
      avg_seed_size: 48,
      avg_full_dataset_size: 2000,
      approval_rate: 0.8,
      seed_to_verified_rate: 0.3,
      community_growth_rate: 3.0,
      visits_per_tree: 12,
      offerings_per_tree: 5,
      whispers_per_tree: 4,
    },
  },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  grounded: "bg-primary/20 text-primary border-primary/40",
  optimistic: "bg-accent/20 text-accent-foreground border-accent/40",
  speculative: "bg-secondary text-secondary-foreground border-border",
};

/* ── Existing actuals (placeholder baseline) ── */
const ACTUALS = {
  datasets: 4,
  research_trees: 120,
  verified_friends: 12,
  countries: 4,
  atlas_pages: 10,
};

/* ── Projection math ── */

function project(inputs: ScenarioInputs, years: number): YearSnapshot[] {
  const snapshots: YearSnapshot[] = [];
  let cumDatasets = ACTUALS.datasets;
  let cumResearch = ACTUALS.research_trees;
  let cumVerified = ACTUALS.verified_friends;
  let communityMultiplier = 1;

  for (let y = 1; y <= years; y++) {
    const newDatasets = Math.round(inputs.datasets_per_year * inputs.approval_rate * communityMultiplier);
    cumDatasets += newDatasets;

    const newSeeded = newDatasets * inputs.avg_seed_size;
    const fullImports = Math.round(newDatasets * 0.3) * inputs.avg_full_dataset_size;
    cumResearch += newSeeded + fullImports;

    const newVerified = Math.round(cumResearch * inputs.seed_to_verified_rate * 0.1 * communityMultiplier);
    cumVerified += newVerified;

    const countries = Math.min(195, ACTUALS.countries + Math.round(cumDatasets * 0.6));
    const atlasPages = ACTUALS.atlas_pages + cumDatasets;

    const visits = Math.round(cumVerified * inputs.visits_per_tree * communityMultiplier);
    const offerings = Math.round(cumVerified * inputs.offerings_per_tree * communityMultiplier);
    const whispers = Math.round(cumVerified * inputs.whispers_per_tree * communityMultiplier);
    const heartEvents = visits * 2 + offerings * 5 + whispers * 3;

    snapshots.push({
      year: y,
      cumulative_datasets: cumDatasets,
      research_trees: cumResearch,
      verified_friends: cumVerified,
      countries,
      atlas_pages: atlasPages,
      visits,
      offerings,
      whispers,
      heart_events: heartEvents,
    });

    communityMultiplier *= (1 + (inputs.community_growth_rate - 1) * 0.3);
  }

  return snapshots;
}

/* ── Infrastructure thresholds ── */

const THRESHOLDS = [
  { level: "10K", trees: 10_000, notes: "Standard database queries remain fast. Single-region map tiles sufficient. Basic search indexing." },
  { level: "100K", trees: 100_000, notes: "Consider clustered map rendering. Pagination and filtering become essential. Image CDN for tree photos. Moderation workflows needed." },
  { level: "1M", trees: 1_000_000, notes: "Database sharding or read replicas. Tile-based map rendering. Full-text search infrastructure. Automated verification pipelines. Dedicated storage." },
  { level: "10M", trees: 10_000_000, notes: "Distributed architecture. Regional edge caching. ML-assisted verification. Federated community governance. Significant infrastructure investment." },
];

/* ── Formatting helpers ── */

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ── Bar visualisation (pure CSS) ── */

function MiniBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Components ── */

function OverviewPanel({ snapshots, confidence }: { snapshots: YearSnapshot[]; confidence: string }) {
  const horizons = [0, 2, 4, 9].map(i => snapshots[i]).filter(Boolean);
  const labels = ["Year 1", "Year 3", "Year 5", "Year 10"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {horizons.map((s, i) => (
          <Card key={s.year} className="border-primary/15 bg-card/60">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{labels[i]}</p>
              <p className="text-xl font-serif text-primary">{fmt(s.research_trees)}</p>
              <p className="text-[10px] text-muted-foreground">research trees</p>
              <p className="text-sm font-serif text-foreground mt-2">{fmt(s.verified_friends)}</p>
              <p className="text-[10px] text-muted-foreground">Ancient Friends</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Growth Curves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Research Trees", key: "research_trees" as const, color: "bg-primary" },
              { label: "Verified Ancient Friends", key: "verified_friends" as const, color: "bg-primary/70" },
              { label: "Datasets", key: "cumulative_datasets" as const, color: "bg-accent" },
              { label: "Countries", key: "countries" as const, color: "bg-secondary-foreground/50" },
            ].map(metric => {
              const maxVal = Math.max(...snapshots.map(s => s[metric.key]));
              return (
                <div key={metric.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground">{metric.label}</span>
                    <span className="text-xs font-mono text-primary">{fmt(snapshots[snapshots.length - 1][metric.key])}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {snapshots.map(s => (
                      <div key={s.year} className="flex-1">
                        <MiniBar value={s[metric.key]} max={maxVal} color={metric.color} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-muted-foreground">Y1</span>
                    <span className="text-[9px] text-muted-foreground">Y10</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${CONFIDENCE_STYLES[confidence]}`}>
              {confidence}
            </Badge>
            <span className="text-[10px] text-muted-foreground">confidence level for these projections</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioPanel({
  inputs,
  onChange,
  activePreset,
  onPreset,
}: {
  inputs: ScenarioInputs;
  onChange: (partial: Partial<ScenarioInputs>) => void;
  activePreset: string;
  onPreset: (key: string) => void;
}) {
  const sliders: { key: keyof ScenarioInputs; label: string; min: number; max: number; step: number; suffix: string }[] = [
    { key: "datasets_per_year", label: "Datasets integrated / year", min: 1, max: 100, step: 1, suffix: "" },
    { key: "avg_seed_size", label: "Avg seed size", min: 6, max: 96, step: 6, suffix: " trees" },
    { key: "avg_full_dataset_size", label: "Avg full dataset size", min: 50, max: 5000, step: 50, suffix: " trees" },
    { key: "approval_rate", label: "Approval rate", min: 0.1, max: 1, step: 0.05, suffix: "" },
    { key: "seed_to_verified_rate", label: "Seed → verified rate", min: 0.05, max: 0.5, step: 0.05, suffix: "" },
    { key: "community_growth_rate", label: "Community growth rate", min: 1, max: 5, step: 0.1, suffix: "×" },
    { key: "visits_per_tree", label: "Visits / verified tree / yr", min: 1, max: 30, step: 1, suffix: "" },
    { key: "offerings_per_tree", label: "Offerings / verified tree / yr", min: 0, max: 20, step: 1, suffix: "" },
    { key: "whispers_per_tree", label: "Whispers / verified tree / yr", min: 0, max: 15, step: 0.5, suffix: "" },
  ];

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Scenario Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => onPreset(key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activePreset === key
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/30 bg-muted/10 hover:border-border/50"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                <Badge variant="outline" className={`text-[9px] mt-1 ${CONFIDENCE_STYLES[p.confidence]}`}>
                  {p.confidence}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sliders */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Adjust Assumptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {sliders.map(s => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">{s.label}</Label>
                <span className="text-xs font-mono text-primary">
                  {s.key === "approval_rate" || s.key === "seed_to_verified_rate"
                    ? `${Math.round(inputs[s.key] * 100)}%`
                    : `${inputs[s.key]}${s.suffix}`}
                </span>
              </div>
              <Slider
                value={[inputs[s.key]]}
                onValueChange={([v]) => onChange({ [s.key]: v })}
                min={s.min}
                max={s.max}
                step={s.step}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function HeartEconomyPanel({ snapshots }: { snapshots: YearSnapshot[] }) {
  const last = snapshots[snapshots.length - 1];
  const maxHeart = Math.max(...snapshots.map(s => s.heart_events));

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" /> Heart Economy Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Visits / yr", value: last.visits },
            { label: "Offerings / yr", value: last.offerings },
            { label: "Whispers / yr", value: last.whispers },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <p className="text-lg font-serif text-primary">{fmt(m.value)}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-foreground">Heart events over time</span>
            <span className="text-xs font-mono text-primary">{fmt(last.heart_events)} / yr at Y{last.year}</span>
          </div>
          <div className="flex gap-0.5 items-end h-16">
            {snapshots.map(s => (
              <motion.div
                key={s.year}
                className="flex-1 bg-primary/60 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${(s.heart_events / maxHeart) * 100}%` }}
                transition={{ duration: 0.5, delay: s.year * 0.03 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-muted-foreground">Y1</span>
            <span className="text-[9px] text-muted-foreground">Y10</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Heart events include first-visit rewards, photo verification, species observations, offerings, and whispers.
          These are planning estimates, not finalized tokenomics.
        </p>
      </CardContent>
    </Card>
  );
}

function InfraPanel({ snapshots }: { snapshots: YearSnapshot[] }) {
  const maxTrees = snapshots[snapshots.length - 1]?.research_trees || 0;

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> Infrastructure Thresholds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {THRESHOLDS.map(t => {
          const reached = maxTrees >= t.trees;
          const approaching = maxTrees >= t.trees * 0.5;
          return (
            <div
              key={t.level}
              className={`p-3 rounded-lg border transition-colors ${
                reached
                  ? "bg-primary/5 border-primary/30"
                  : approaching
                  ? "bg-accent/5 border-accent/20"
                  : "bg-muted/10 border-border/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono font-bold text-foreground">{t.level}</span>
                <span className="text-xs text-muted-foreground">research trees</span>
                {reached && <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 ml-auto">reached</Badge>}
                {!reached && approaching && <Badge variant="outline" className="text-[9px] bg-accent/10 text-accent-foreground border-accent/30 ml-auto">approaching</Badge>}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.notes}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function VerificationPanel({ snapshots }: { snapshots: YearSnapshot[] }) {
  const last = snapshots[snapshots.length - 1];
  const maxR = last.research_trees;

  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Canopy Layers at Year {last.year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { label: "Research Canopy (seeded)", value: last.research_trees, color: "bg-primary/30" },
          { label: "Verified Ancient Friends", value: last.verified_friends, color: "bg-primary" },
        ].map(layer => (
          <div key={layer.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-foreground">{layer.label}</span>
              <span className="text-xs font-mono text-primary">{fmt(layer.value)}</span>
            </div>
            <MiniBar value={layer.value} max={maxR} color={layer.color} />
          </div>
        ))}

        <div className="p-3 mt-2 rounded-lg bg-muted/10 border border-border/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Not all research trees become verified Ancient Friends. Verification requires community visits,
            photo confirmation, and stewardship activity. The gap between research and verified canopy
            represents the curation and care journey.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
            <p className="text-lg font-serif text-primary">{last.countries}</p>
            <p className="text-[10px] text-muted-foreground">Countries</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
            <p className="text-lg font-serif text-primary">{last.atlas_pages}</p>
            <p className="text-[10px] text-muted-foreground">Atlas Pages</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */

const CanopyProjectionPage = () => {
  const [activePreset, setActivePreset] = useState("steady");
  const [inputs, setInputs] = useState<ScenarioInputs>(PRESETS.steady.inputs);
  const [horizon, setHorizon] = useState(10);
  const [activeTab, setActiveTab] = useState("overview");

  const confidence = PRESETS[activePreset]?.confidence || "optimistic";

  const snapshots = useMemo(() => project(inputs, horizon), [inputs, horizon]);

  const handlePreset = (key: string) => {
    setActivePreset(key);
    setInputs(PRESETS[key].inputs);
  };

  const handleChange = (partial: Partial<ScenarioInputs>) => {
    setInputs(prev => ({ ...prev, ...partial }));
    setActivePreset("custom");
  };

  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/tree-data-commons" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3 h-3" /> Tree Data Commons
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-foreground">Global Canopy Projection Engine</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore how the Ancient Friends canopy could grow across datasets, regions, and community participation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Horizon selector */}
        <div className="flex items-center gap-3 mb-6">
          <Label className="text-xs text-muted-foreground">Horizon:</Label>
          {[5, 10].map(h => (
            <Button key={h} size="sm" variant={horizon === h ? "default" : "outline"} onClick={() => setHorizon(h)} className="text-xs">
              {h} years
            </Button>
          ))}
          <Badge variant="outline" className={`text-[10px] ml-auto ${CONFIDENCE_STYLES[confidence]}`}>
            {confidence}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/60 border border-border/30 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="text-xs gap-1"><TrendingUp className="w-3 h-3" /> Overview</TabsTrigger>
            <TabsTrigger value="scenario" className="text-xs gap-1"><Sparkles className="w-3 h-3" /> Scenarios</TabsTrigger>
            <TabsTrigger value="verification" className="text-xs gap-1"><Eye className="w-3 h-3" /> Verification</TabsTrigger>
            <TabsTrigger value="hearts" className="text-xs gap-1"><Heart className="w-3 h-3" /> Hearts</TabsTrigger>
            <TabsTrigger value="infra" className="text-xs gap-1"><Server className="w-3 h-3" /> Infrastructure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewPanel snapshots={snapshots} confidence={confidence} />
          </TabsContent>

          <TabsContent value="scenario">
            <ScenarioPanel inputs={inputs} onChange={handleChange} activePreset={activePreset} onPreset={handlePreset} />
          </TabsContent>

          <TabsContent value="verification">
            <VerificationPanel snapshots={snapshots} />
          </TabsContent>

          <TabsContent value="hearts">
            <HeartEconomyPanel snapshots={snapshots} />
          </TabsContent>

          <TabsContent value="infra">
            <InfraPanel snapshots={snapshots} />
          </TabsContent>
        </Tabs>

        {/* Connected Systems */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10">
          <h2 className="text-sm font-serif text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Connected Systems
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
              { label: "Expansion Map", to: "/atlas-expansion", icon: "🌍" },
              { label: "Seed-Plan Generator", to: "/seed-plan-generator", icon: "🌱" },
              { label: "Discovery Agent", to: "/discovery-agent", icon: "🔭" },
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

export default CanopyProjectionPage;
