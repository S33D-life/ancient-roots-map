/**
 * Dataset Discovery Agent — a quiet research companion inside the Tree Data Commons.
 * Helps S33D discover, evaluate, and prepare new tree datasets for integration.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  useDiscoveryAgent,
  type DiscoveryCandidate,
  type DiscoveryStatus,
} from "@/hooks/use-discovery-agent";
import { DATASET_CONFIGS, type DatasetConfig } from "@/config/datasetIntegration";
import {
  Search, Globe, Database, Telescope, ExternalLink, Plus, ChevronRight,
  Star, Check, X, Clock, ArrowUpRight, Layers, TreeDeciduous,
  MapPin, BookOpen, Sparkles, Filter, RefreshCw,
} from "lucide-react";

/* ── Status helpers ── */
const STATUS_COLORS: Record<string, string> = {
  discovered: "bg-muted text-muted-foreground border-border",
  review_needed: "bg-accent/20 text-accent-foreground border-accent/40",
  approved: "bg-primary/20 text-primary border-primary/40",
  rejected: "bg-destructive/20 text-destructive border-destructive/40",
  seed_ready: "bg-primary/30 text-primary border-primary/50",
  integrated: "bg-primary/10 text-primary/70 border-primary/30",
};

const TIER_COLORS: Record<string, string> = {
  high_priority: "bg-primary/25 text-primary border-primary/50",
  promising: "bg-accent/20 text-accent-foreground border-accent/40",
  research_only: "bg-muted text-muted-foreground border-border",
  not_suitable_yet: "bg-destructive/10 text-destructive/60 border-destructive/20",
};

const TIER_LABELS: Record<string, string> = {
  high_priority: "High Priority",
  promising: "Promising",
  research_only: "Research Only",
  not_suitable_yet: "Not Suitable Yet",
};

const DATASET_TYPES = [
  "heritage_trees", "champion_trees", "sacred_trees", "urban_canopy",
  "research_dataset", "ancient_trees", "monumental_trees", "notable_trees",
];

const DATA_FORMATS = ["csv", "geojson", "rest_api", "open_data_portal", "manual_curation", "pdf_register"];

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[status] || ""}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/* ── Overview Stats ── */
function AgentOverview({ stats }: { stats: ReturnType<typeof useDiscoveryAgent>["stats"] }) {
  const metrics = [
    { label: "Discovered", value: stats.discovered, icon: Telescope },
    { label: "Reviewing", value: stats.reviewing, icon: Clock },
    { label: "Approved", value: stats.approved, icon: Check },
    { label: "Seed Ready", value: stats.seedReady, icon: TreeDeciduous },
    { label: "Integrated", value: stats.integrated, icon: Layers },
    { label: "High Priority", value: stats.highPriority, icon: Star },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-3 text-center">
              <m.icon className="w-4 h-4 mx-auto mb-1 text-primary/60" />
              <p className="text-lg font-serif font-bold text-primary">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Score Display ── */
function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${v * 10}%` }}
        />
      </div>
      <span className="text-xs font-mono text-foreground w-5 text-right">{v}</span>
    </div>
  );
}

/* ── Score Editor ── */
const SCORE_KEYS = [
  { key: "score_official_status", label: "Official Status" },
  { key: "score_geographic_precision", label: "Geo Precision" },
  { key: "score_individual_records", label: "Individual Records" },
  { key: "score_species_detail", label: "Species Detail" },
  { key: "score_heritage_value", label: "Heritage Value" },
  { key: "score_public_accessibility", label: "Accessibility" },
  { key: "score_licensing_clarity", label: "Licensing" },
  { key: "score_update_frequency", label: "Update Freq" },
  { key: "score_map_compatibility", label: "Map Compat" },
  { key: "score_story_value", label: "Story Value" },
];

function ScoreEditor({
  candidate,
  onSave,
}: {
  candidate: DiscoveryCandidate;
  onSave: (id: string, scores: Record<string, number>) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    SCORE_KEYS.forEach(s => { init[s.key] = (candidate as any)[s.key] ?? 0; });
    return init;
  });

  return (
    <div className="space-y-3">
      {SCORE_KEYS.map(s => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 shrink-0">{s.label}</span>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[scores[s.key]]}
            onValueChange={([v]) => setScores(prev => ({ ...prev, [s.key]: v }))}
            className="flex-1"
          />
          <span className="text-xs font-mono w-5 text-right text-foreground">{scores[s.key]}</span>
        </div>
      ))}
      <Button size="sm" onClick={() => onSave(candidate.id, scores)} className="mt-2">
        Save Scores
      </Button>
    </div>
  );
}

/* ── Integration Pack Preview ── */
function IntegrationPackPreview({ candidate }: { candidate: DiscoveryCandidate }) {
  const countrySlug = (candidate.country_name ?? "unknown").toLowerCase().replace(/\s+/g, "-");
  const key = `${(candidate.country_code ?? "xx").toLowerCase()}-${candidate.dataset_type.replace(/_/g, "-")}`;

  const pack = {
    key,
    name: candidate.source_name,
    countryCode: candidate.country_code ?? "XX",
    countryName: candidate.country_name ?? "Unknown",
    countrySlug,
    datasetType: candidate.dataset_type,
    sourceUrl: candidate.source_url ?? "",
    sourceOrg: candidate.source_org ?? "",
    dataFormat: candidate.data_format,
    regionType: "country",
    suggestedCircles: [
      `${(candidate.country_code ?? "XX")}-C1 — Notable Specimens`,
      `${(candidate.country_code ?? "XX")}-C2 — Rare Species`,
      `${(candidate.country_code ?? "XX")}-C3 — Cultural Heritage`,
      `${(candidate.country_code ?? "XX")}-C4 — Urban Canopy`,
    ],
    seedStrategy: `Curate ~24 trees from ${candidate.source_name}, prioritising large specimens, rare species, and culturally significant trees.`,
    importMethod: candidate.api_available ? "API ingestion" : candidate.download_available ? "CSV/GeoJSON import" : "Manual curation",
  };

  return (
    <Card className="border-primary/20 bg-card/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Integration Pack Draft
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto text-foreground whitespace-pre-wrap font-mono">
{JSON.stringify(pack, null, 2)}
        </pre>
        <p className="text-xs text-muted-foreground">
          Use this as a starting point for the DatasetConfig in <code className="text-primary/80">datasetIntegration.ts</code>.
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Candidate Detail Card ── */
function CandidateDetail({
  candidate,
  onUpdateStatus,
  onSaveScores,
  onPromote,
}: {
  candidate: DiscoveryCandidate;
  onUpdateStatus: (id: string, status: DiscoveryStatus) => void;
  onSaveScores: (id: string, scores: Record<string, number>) => void;
  onPromote: (c: DiscoveryCandidate) => void;
}) {
  const [showScores, setShowScores] = useState(false);
  const [showPack, setShowPack] = useState(false);

  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-serif flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="block">{candidate.source_name}</span>
            <span className="text-xs text-muted-foreground font-sans block mt-0.5">
              {candidate.source_org}
            </span>
          </div>
          {candidate.source_url && (
            <a href={candidate.source_url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <StatusBadge status={candidate.status} />
          {candidate.priority_tier && (
            <Badge variant="outline" className={`text-xs ${TIER_COLORS[candidate.priority_tier] || ""}`}>
              {TIER_LABELS[candidate.priority_tier] || candidate.priority_tier}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs capitalize">{candidate.dataset_type.replace(/_/g, " ")}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {candidate.country_name && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="w-3 h-3" /> {candidate.country_name}
              {candidate.region_name && <span>· {candidate.region_name}</span>}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Database className="w-3 h-3" /> {candidate.data_format.replace(/_/g, " ")}
          </div>
          {candidate.estimated_record_count && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TreeDeciduous className="w-3 h-3" /> ~{candidate.estimated_record_count.toLocaleString()} records
            </div>
          )}
        </div>

        {/* Capability flags */}
        <div className="flex flex-wrap gap-2">
          {candidate.api_available && <Badge variant="secondary" className="text-xs">API</Badge>}
          {candidate.download_available && <Badge variant="secondary" className="text-xs">Download</Badge>}
          {candidate.geo_available && <Badge variant="secondary" className="text-xs">Geo Data</Badge>}
          {candidate.individual_trees && <Badge variant="secondary" className="text-xs">Individual Trees</Badge>}
          {candidate.species_detail && <Badge variant="secondary" className="text-xs">Species Detail</Badge>}
        </div>

        {/* Readiness Score */}
        {candidate.readiness_score !== null && (
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Readiness Score</span>
              <span className="text-lg font-serif font-bold text-primary">{Number(candidate.readiness_score).toFixed(1)}</span>
            </div>
            <div className="space-y-1.5">
              {SCORE_KEYS.map(s => (
                <ScoreBar key={s.key} label={s.label} value={(candidate as any)[s.key]} />
              ))}
            </div>
          </div>
        )}

        {/* Review Notes */}
        {candidate.review_notes && (
          <p className="text-sm text-muted-foreground italic">{candidate.review_notes}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
          {candidate.status === "discovered" && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(candidate.id, "review_needed")}>
              <Clock className="w-3 h-3 mr-1" /> Start Review
            </Button>
          )}
          {(candidate.status === "discovered" || candidate.status === "review_needed") && (
            <>
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus(candidate.id, "approved")}>
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(candidate.id, "rejected")}>
                <X className="w-3 h-3 mr-1" /> Reject
              </Button>
            </>
          )}
          {candidate.status === "approved" && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(candidate.id, "seed_ready")}>
              <TreeDeciduous className="w-3 h-3 mr-1" /> Mark Seed Ready
            </Button>
          )}
          {(candidate.status === "approved" || candidate.status === "seed_ready") && (
            <Button size="sm" onClick={() => onPromote(candidate)}>
              <ArrowUpRight className="w-3 h-3 mr-1" /> Promote to Source
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={() => setShowScores(!showScores)}>
            <Star className="w-3 h-3 mr-1" /> {showScores ? "Hide" : "Score"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowPack(!showPack)}>
            <Sparkles className="w-3 h-3 mr-1" /> {showPack ? "Hide" : "Integration Pack"}
          </Button>
        </div>

        {showScores && <ScoreEditor candidate={candidate} onSave={onSaveScores} />}
        {showPack && <IntegrationPackPreview candidate={candidate} />}
      </CardContent>
    </Card>
  );
}

/* ── Add Source Dialog ── */
function AddSourceDialog({ onAdd }: { onAdd: (data: Partial<DiscoveryCandidate>) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source_name: "",
    source_url: "",
    source_org: "",
    country_code: "",
    country_name: "",
    region_name: "",
    dataset_type: "heritage_trees",
    data_format: "manual_curation",
    discovery_method: "manual",
    api_available: false,
    download_available: false,
    geo_available: false,
    individual_trees: false,
    species_detail: false,
    estimated_record_count: "",
    review_notes: "",
  });

  const handleSubmit = async () => {
    if (!form.source_name.trim()) { toast.error("Source name required"); return; }
    const ok = await onAdd({
      ...form,
      source_url: form.source_url || null,
      source_org: form.source_org || null,
      country_code: form.country_code || null,
      country_name: form.country_name || null,
      region_name: form.region_name || null,
      estimated_record_count: form.estimated_record_count ? parseInt(form.estimated_record_count) : null,
      review_notes: form.review_notes || null,
    } as any);
    if (ok) setOpen(false);
  };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Discover Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Register a Discovered Source</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Source Name *</Label>
            <Input value={form.source_name} onChange={e => set("source_name", e.target.value)} placeholder="e.g. Japan Sacred Tree Register" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Input value={form.source_org} onChange={e => set("source_org", e.target.value)} placeholder="e.g. Agency for Cultural Affairs" />
            </div>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input value={form.source_url} onChange={e => set("source_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input value={form.country_code} onChange={e => set("country_code", e.target.value)} placeholder="JP" maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Country Name</Label>
              <Input value={form.country_name} onChange={e => set("country_name", e.target.value)} placeholder="Japan" />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={form.region_name} onChange={e => set("region_name", e.target.value)} placeholder="Kansai" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dataset Type</Label>
              <Select value={form.dataset_type} onValueChange={v => set("dataset_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATASET_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Format</Label>
              <Select value={form.data_format} onValueChange={v => set("data_format", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATA_FORMATS.map(f => (
                    <SelectItem key={f} value={f}>{f.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estimated Record Count</Label>
            <Input type="number" value={form.estimated_record_count} onChange={e => set("estimated_record_count", e.target.value)} placeholder="500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.api_available} onCheckedChange={v => set("api_available", v)} />
              <Label className="text-sm">API Available</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.download_available} onCheckedChange={v => set("download_available", v)} />
              <Label className="text-sm">Download Available</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.geo_available} onCheckedChange={v => set("geo_available", v)} />
              <Label className="text-sm">Geo Data</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.individual_trees} onCheckedChange={v => set("individual_trees", v)} />
              <Label className="text-sm">Individual Trees</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.species_detail} onCheckedChange={v => set("species_detail", v)} />
              <Label className="text-sm">Species Detail</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.review_notes} onChange={e => set("review_notes", e.target.value)} placeholder="Initial observations about this source..." rows={3} />
          </div>
          <Button onClick={handleSubmit} className="w-full">Add to Discovery Queue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Suggested Regions ── */
const SUGGESTED_REGIONS = [
  { code: "JP", name: "Japan", desc: "Sacred trees, shinboku, natural monuments", type: "sacred_trees", icon: "⛩️" },
  { code: "TW", name: "Taiwan", desc: "Protected old-growth camphor & banyan", type: "heritage_trees", icon: "🌿" },
  { code: "IN", name: "India", desc: "Banyan heritage, sacred groves", type: "heritage_trees", icon: "🕉️" },
  { code: "ZA", name: "South Africa", desc: "Champion trees, baobab networks", type: "champion_trees", icon: "🌍" },
  { code: "MX", name: "Mexico", desc: "Ahuehuete, Tule tree, sacred ceiba", type: "sacred_trees", icon: "🇲🇽" },
  { code: "BR", name: "Brazil", desc: "Atlantic forest giants, urban heritage", type: "ancient_trees", icon: "🌳" },
  { code: "IT", name: "Italy", desc: "Monumental tree register (MIPAAF)", type: "monumental_trees", icon: "🇮🇹" },
  { code: "ES", name: "Spain", desc: "Árboles singulares, regional registers", type: "notable_trees", icon: "🇪🇸" },
  { code: "NZ", name: "New Zealand", desc: "Notable trees, kauri protection", type: "heritage_trees", icon: "🌿" },
  { code: "CA", name: "Canada", desc: "Heritage trees, old-growth registries", type: "heritage_trees", icon: "🍁" },
  { code: "US", name: "United States", desc: "National Champion Trees registry", type: "champion_trees", icon: "🇺🇸" },
  { code: "GB", name: "United Kingdom", desc: "Ancient Tree Inventory, veteran trees", type: "ancient_trees", icon: "🇬🇧" },
];

function SuggestedRegions({ onQuickAdd }: { onQuickAdd: (region: typeof SUGGESTED_REGIONS[0]) => void }) {
  // Filter out already-integrated countries
  const existingCodes = Object.values(DATASET_CONFIGS).map(c => c.countryCode);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SUGGESTED_REGIONS.map(region => {
        const exists = existingCodes.includes(region.code);
        return (
          <Card
            key={region.code}
            className={`border-primary/15 bg-card/60 transition-all ${exists ? "opacity-50" : "hover:border-primary/40 cursor-pointer"}`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl">{region.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground">{region.name}</p>
                <p className="text-xs text-muted-foreground">{region.desc}</p>
                <Badge variant="outline" className="text-[10px] mt-1.5 capitalize">
                  {region.type.replace(/_/g, " ")}
                </Badge>
              </div>
              {exists ? (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary shrink-0">Active</Badge>
              ) : (
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => onQuickAdd(region)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */
const DatasetDiscoveryAgentPage = () => {
  const {
    candidates, loading, filter, setFilter, stats,
    addCandidate, updateCandidate, updateStatus, promoteToSource,
  } = useDiscoveryAgent();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSaveScores = async (id: string, scores: Record<string, number>) => {
    const ok = await updateCandidate(id, scores as any);
    if (ok) toast.success("Scores updated");
  };

  const handleQuickAdd = async (region: typeof SUGGESTED_REGIONS[0]) => {
    await addCandidate({
      source_name: `${region.name} Heritage Tree Register`,
      country_code: region.code,
      country_name: region.name,
      dataset_type: region.type,
      data_format: "manual_curation",
      discovery_method: "suggested",
      discovery_confidence: "medium",
    } as any);
  };

  const filtered = candidates.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.source_name.toLowerCase().includes(term) ||
      (c.country_name ?? "").toLowerCase().includes(term) ||
      (c.source_org ?? "").toLowerCase().includes(term) ||
      (c.region_name ?? "").toLowerCase().includes(term)
    );
  });

  const byStatus = (status: string) => filtered.filter(c => c.status === status);

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
                <Telescope className="w-6 h-6" /> Dataset Discovery Agent
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                A quiet research companion that helps S33D discover heritage tree datasets from around the world
                and prepare them for the Ancient Friends network.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AddSourceDialog onAdd={addCandidate} />
              <Button size="sm" variant="ghost" asChild>
                <Link to="/tree-data-commons">
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> Commons
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <AgentOverview stats={stats} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search sources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filter.status ?? "all"} onValueChange={v => setFilter(f => ({ ...f, status: v === "all" ? undefined : v }))}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="discovered">Discovered</SelectItem>
              <SelectItem value="review_needed">Review Needed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="seed_ready">Seed Ready</SelectItem>
              <SelectItem value="integrated">Integrated</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.type ?? "all"} onValueChange={v => setFilter(f => ({ ...f, type: v === "all" ? undefined : v }))}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DATASET_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.sort ?? "recent"} onValueChange={v => setFilter(f => ({ ...f, sort: v }))}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="readiness">Readiness Score</SelectItem>
              <SelectItem value="story">Story Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 overflow-x-auto">
            <TabsTrigger value="queue" className="text-xs">Review Queue ({byStatus("discovered").length + byStatus("review_needed").length})</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Approved ({byStatus("approved").length + byStatus("seed_ready").length})</TabsTrigger>
            <TabsTrigger value="integrated" className="text-xs">Integrated ({byStatus("integrated").length})</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">Suggested Regions</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading discovery queue…</p>
            ) : (
              <>
                {[...byStatus("review_needed"), ...byStatus("discovered")].map(c => (
                  <CandidateDetail
                    key={c.id}
                    candidate={c}
                    onUpdateStatus={updateStatus}
                    onSaveScores={handleSaveScores}
                    onPromote={promoteToSource}
                  />
                ))}
                {byStatus("discovered").length + byStatus("review_needed").length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Telescope className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No sources in the review queue yet.</p>
                    <p className="text-xs mt-1">Use "Discover Source" to add one, or explore the Suggested Regions tab.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-4">
            {[...byStatus("seed_ready"), ...byStatus("approved")].map(c => (
              <CandidateDetail
                key={c.id}
                candidate={c}
                onUpdateStatus={updateStatus}
                onSaveScores={handleSaveScores}
                onPromote={promoteToSource}
              />
            ))}
            {byStatus("approved").length + byStatus("seed_ready").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No approved sources yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="integrated" className="space-y-3 mt-4">
            {byStatus("integrated").map(c => (
              <CandidateDetail
                key={c.id}
                candidate={c}
                onUpdateStatus={updateStatus}
                onSaveScores={handleSaveScores}
                onPromote={promoteToSource}
              />
            ))}
            {byStatus("integrated").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No integrated datasets yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Regions with known heritage tree data that could expand the Ancient Friends network.
              Click <Plus className="w-3 h-3 inline" /> to add one to the discovery queue.
            </p>
            <SuggestedRegions onQuickAdd={handleQuickAdd} />
          </TabsContent>
        </Tabs>

        {/* Connected Systems */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-sm font-serif text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Connected Systems
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
              { label: "Dataset Watcher", to: "/dataset-watcher", icon: "👁️" },
              { label: "Expansion Map", to: "/atlas-expansion", icon: "🌍" },
              { label: "Seed-Plan Generator", to: "/seed-plan-generator", icon: "🌱" },
              { label: "Canopy Projection", to: "/canopy-projection", icon: "🔮" },
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

export default DatasetDiscoveryAgentPage;
