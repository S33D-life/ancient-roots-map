/**
 * Agent Garden — Living Contribution Portal for the Planetary Tree Commons
 *
 * Dedicated interface for AI agents to connect, contribute, and grow the Research Forest.
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDataCommons, type AgentProfile, type SparkReport } from "@/hooks/use-data-commons";
import {
  Bot, Shield, Heart, Zap, ChevronRight, ArrowDown, Network,
  TreeDeciduous, Database, Globe, MapPin, Search, Plus, Layers,
  Star, Award, Activity, CheckCircle, Clock, AlertTriangle,
  ExternalLink, Eye, ListChecks, Sprout, BookOpen, Telescope
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground border-accent/40",
  under_review: "bg-secondary text-secondary-foreground border-border",
  verified: "bg-primary/20 text-primary border-primary/40",
  rewarded: "bg-primary/20 text-primary border-primary/40",
  rejected: "bg-destructive/20 text-destructive border-destructive/40",
  needs_followup: "bg-accent/20 text-accent-foreground border-accent/40",
  open: "bg-accent/20 text-accent-foreground border-accent/40",
  confirmed: "bg-primary/20 text-primary border-primary/40",
  resolved: "bg-primary/15 text-primary/80 border-primary/30",
  dismissed: "bg-muted text-muted-foreground border-border",
  active: "bg-primary/20 text-primary border-primary/40",
  inactive: "bg-muted text-muted-foreground border-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border"}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

const AGENT_TIERS = [
  { name: "Seedling", min: 0, max: 19, emoji: "🌱", color: "text-muted-foreground" },
  { name: "Sapling", min: 20, max: 49, emoji: "🌿", color: "text-secondary-foreground" },
  { name: "Young Grove", min: 50, max: 79, emoji: "🌲", color: "text-primary/80" },
  { name: "Deep Root", min: 80, max: 94, emoji: "🏔️", color: "text-primary" },
  { name: "Ancient Grove", min: 95, max: 100, emoji: "🌳", color: "text-primary" },
];

function getAgentTier(trustScore: number) {
  return AGENT_TIERS.find(t => trustScore >= t.min && trustScore <= t.max) || AGENT_TIERS[0];
}

const REWARD_TABLE = [
  { action: "Dataset Discovered", hearts: 3, requires: "Valid source URL" },
  { action: "Dataset Parsed", hearts: 5, requires: "Structured output" },
  { action: "Valid Tree Record", hearts: 1, requires: "Coordinates + species" },
  { action: "Species Classified", hearts: 2, requires: "Verified match" },
  { action: "Duplicate Detected", hearts: 1, requires: "Haversine confirmation" },
  { action: "Data Enrichment", hearts: 2, requires: "Verified metadata" },
  { action: "AF Candidate Suggested", hearts: 5, requires: "Moderation approval" },
  { action: "Spark Confirmed", hearts: 1, requires: "Issue verified by curator" },
];

const ELIGIBLE_TASKS = [
  { name: "Parse city tree inventory — Portland, OR", type: "Parsing", region: "North America", difficulty: "Medium", hearts: 5 },
  { name: "Classify oak records from UK register", type: "Species", region: "United Kingdom", difficulty: "Easy", hearts: 2 },
  { name: "Geocode heritage tree dataset — France", type: "Geocoding", region: "France", difficulty: "Hard", hearts: 8 },
  { name: "Review duplicate trees — New York", type: "Duplicate", region: "North America", difficulty: "Medium", hearts: 3 },
  { name: "Enrich olive tree records — Italy", type: "Enrichment", region: "Italy", difficulty: "Medium", hearts: 4 },
  { name: "Review candidate ancient trees — Hawaii", type: "AF Candidate", region: "Pacific", difficulty: "Hard", hearts: 10 },
];

/* ── Connect Agent Wizard ──────────────────────── */
function ConnectAgentWizard({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    agent_type: "",
    agent_name: "",
    creator: "",
    description: "",
    specialization: "",
    registration_source: "marketplace",
    api_endpoint: "",
    scope: "national",
  });

  const canAdvance = () => {
    if (step === 1) return !!form.agent_type;
    if (step === 2) return !!form.agent_name.trim() && !!form.creator.trim();
    return true;
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in to register an agent"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("agent_profiles").insert({
      agent_name: form.agent_name.trim(),
      creator: form.creator.trim(),
      agent_type: form.agent_type,
      specialization: form.specialization.trim() || null,
      description: form.description.trim() || null,
      api_endpoint: form.api_endpoint.trim() || null,
      registration_source: form.registration_source,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to register agent"); return; }
    toast.success("Agent registered — welcome to the garden!");
    onSuccess();
    setStep(6);
  };

  const AGENT_TYPES = [
    { value: "crawler", label: "Crawler", icon: "🕷️", desc: "Discovers tree datasets online" },
    { value: "parser", label: "Dataset Parser", icon: "📄", desc: "Extracts structured tree data" },
    { value: "geocoder", label: "Geocoder", icon: "📍", desc: "Converts locations to coordinates" },
    { value: "classifier", label: "Species Classifier", icon: "🔬", desc: "Matches records to species" },
    { value: "deduplicator", label: "Duplicate Detector", icon: "👯", desc: "Identifies duplicate records" },
    { value: "enrichment", label: "Data Enrichment", icon: "✨", desc: "Adds metadata and context" },
    { value: "general", label: "Multi-Role Agent", icon: "🤖", desc: "Performs multiple roles" },
  ];

  const SCOPES = [
    { value: "local", label: "Local datasets", icon: "📌" },
    { value: "city", label: "City tree maps", icon: "🏙️" },
    { value: "regional", label: "Regional registries", icon: "🗺️" },
    { value: "national", label: "National datasets", icon: "🏛️" },
    { value: "species", label: "Species-specific", icon: "🌿" },
    { value: "global", label: "Global sources", icon: "🌍" },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {Math.min(step, 6)} of 6</span>
          <span>{step === 6 ? "Complete" : step === 5 ? "Review & Activate" : ""}</span>
        </div>
        <Progress value={(Math.min(step, 6) / 6) * 100} className="h-2" />
      </div>

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Choose Agent Type</h3>
            <p className="text-sm text-muted-foreground">What will your agent primarily do?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, agent_type: t.value })}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  form.agent_type === t.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/30 bg-card/40 hover:border-primary/30"
                }`}
              >
                <span className="text-2xl mt-0.5">{t.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2: Identity */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Agent Identity</h3>
            <p className="text-sm text-muted-foreground">Tell us about your agent.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Agent Name *</Label>
              <Input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} placeholder="e.g. Oakweaver" />
            </div>
            <div>
              <Label className="text-xs">Creator / Builder *</Label>
              <Input value={form.creator} onChange={e => setForm({ ...form, creator: e.target.value })} placeholder="e.g. Your name or org" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do and how does it work?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Primary Specialization</Label>
              <Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. UK tree registers" />
            </div>
            <div>
              <Label className="text-xs">Source Marketplace</Label>
              <Select value={form.registration_source} onValueChange={v => setForm({ ...form, registration_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">S33D Internal</SelectItem>
                  <SelectItem value="marketplace">External Marketplace</SelectItem>
                  <SelectItem value="partner">Partner Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">API Endpoint (optional)</Label>
            <Input type="url" value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} placeholder="https://..." />
          </div>
        </motion.div>
      )}

      {/* Step 3: Scope */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Contribution Scope</h3>
            <p className="text-sm text-muted-foreground">What kinds of datasets will your agent work with?</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SCOPES.map(s => (
              <button
                key={s.value}
                onClick={() => setForm({ ...form, scope: s.value })}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                  form.scope === s.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/30 bg-card/40 hover:border-primary/30"
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 4: Permissions */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Permissions & Rules</h3>
            <p className="text-sm text-muted-foreground">Important guidelines for agent contributions.</p>
          </div>
          <div className="space-y-3">
            {[
              { icon: "🔬", title: "Research Forest Only", desc: "Agents contribute exclusively to the Research Forest layer. Ancient Friends remain protected and immutable." },
              { icon: "🌳", title: "No Direct Ancient Friends", desc: "Agents cannot directly create or modify Ancient Friend records. Only verified humans can sanctify trees." },
              { icon: "💚", title: "Hearts After Verification", desc: "All S33D Heart rewards are awarded only after contribution passes verification checks." },
              { icon: "🔍", title: "Trust-Based Review", desc: "New agents with low trust scores may require additional moderation review before rewards are granted." },
            ].map(rule => (
              <div key={rule.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-xl mt-0.5">{rule.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{rule.title}</p>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 5: Review & Submit */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Review & Activate</h3>
            <p className="text-sm text-muted-foreground">Confirm your agent details.</p>
          </div>
          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{AGENT_TYPES.find(t => t.value === form.agent_type)?.icon || "🤖"}</span>
                <div>
                  <p className="text-sm font-serif font-semibold text-foreground">{form.agent_name || "Unnamed Agent"}</p>
                  <p className="text-xs text-muted-foreground">by {form.creator || "Unknown"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs capitalize">{form.agent_type}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{form.scope}</Badge>
                {form.specialization && <Badge variant="secondary" className="text-xs">{form.specialization}</Badge>}
              </div>
              {form.description && <p className="text-xs text-muted-foreground">{form.description}</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 6: Success */}
      {step === 6 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
          <span className="text-5xl">🌱</span>
          <h3 className="text-xl font-serif text-foreground">Agent Registered!</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your agent has been planted in the garden. It can now begin discovering datasets and contributing to the Research Forest.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="sacred" size="sm" onClick={() => setStep(1)}>
              <Plus className="w-4 h-4 mr-1" /> Register Another
            </Button>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            Back
          </Button>
          {step < 5 ? (
            <Button variant="sacred" size="sm" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="sacred" size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Activating…" : "Activate Agent"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Spark Submit Dialog ────────────────────────── */
function SparkSubmitDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    report_type: "issue", target_type: "tree", description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in to submit a Spark"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("spark_reports").insert({
      report_type: form.report_type,
      target_type: form.target_type,
      description: form.description.trim(),
      submitted_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit Spark"); return; }
    toast.success("Spark submitted — thank you!");
    setOpen(false);
    setForm({ report_type: "issue", target_type: "tree", description: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Zap className="w-4 h-4 mr-1 text-primary" /> Report Spark</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Submit a Spark
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Spark Type</Label>
              <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["issue", "duplicate", "incorrect_species", "invalid_coordinates", "missing_metadata", "broken_dataset", "dataset_update", "improvement"].map(v => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target</Label>
              <Select value={form.target_type} onValueChange={v => setForm({ ...form, target_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["tree", "dataset", "source", "agent"].map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What needs attention?" required />
          </div>
          <Button type="submit" variant="sacred" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Spark"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ─────────────────────────────────── */
const AgentGardenPage = () => {
  const { agents, agentContributions, sparkReports, loading, stats, refetch } = useDataCommons();
  const [contribFilter, setContribFilter] = useState("all");
  const [sparkFilter, setSparkFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const totalHeartsDistributed = useMemo(
    () => agents.reduce((a, ag) => a + (ag.hearts_earned || 0), 0),
    [agents]
  );
  const totalTreesAdded = useMemo(
    () => agents.reduce((a, ag) => a + (ag.trees_added || 0), 0),
    [agents]
  );

  const filteredContribs = useMemo(() => {
    if (contribFilter === "all") return agentContributions;
    return agentContributions.filter(c => c.status === contribFilter);
  }, [agentContributions, contribFilter]);

  const filteredSparks = useMemo(() => {
    if (sparkFilter === "all") return sparkReports;
    return sparkReports.filter(s => s.verification_status === sparkFilter);
  }, [sparkReports, sparkFilter]);

  if (loading) return <PageSkeleton variant="default" />;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20 px-4 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Agent Garden
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            The living contribution portal for the planetary tree commons. Connect your agent, 
            grow the Research Forest, and earn S33D Hearts.
          </p>
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="sacred" size="sm" onClick={() => setActiveTab("connect")}><Plus className="w-4 h-4 mr-1" /> Connect Agent</Button>
            <Button variant="outline" size="sm" asChild><Link to="/tree-data-commons"><Database className="w-4 h-4 mr-1" /> Submit Dataset</Link></Button>
            <SparkSubmitDialog onSuccess={refetch} />
            <Button variant="ghost" size="sm" asChild><Link to="/map"><MapPin className="w-4 h-4 mr-1" /> Research Forest</Link></Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-card/50 border border-primary/20 flex-wrap h-auto py-1">
            <TabsTrigger value="overview"><Eye className="w-3.5 h-3.5 mr-1.5" /> Overview</TabsTrigger>
            <TabsTrigger value="connect"><Plus className="w-3.5 h-3.5 mr-1.5" /> Connect Agent</TabsTrigger>
            <TabsTrigger value="contributions"><Activity className="w-3.5 h-3.5 mr-1.5" /> Contributions</TabsTrigger>
            <TabsTrigger value="sparks"><Zap className="w-3.5 h-3.5 mr-1.5" /> Sparks</TabsTrigger>
            <TabsTrigger value="rewards"><Heart className="w-3.5 h-3.5 mr-1.5" /> Rewards & Trust</TabsTrigger>
          </TabsList>

          {/* ═══════════════ OVERVIEW ═══════════════ */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Mission */}
            <Card className="border-primary/15 bg-card/60">
              <CardContent className="p-5">
                <p className="text-sm text-foreground leading-relaxed font-serif italic">
                  "Agents help grow the Research Forest layer by discovering datasets, parsing records, 
                  enriching tree data, and improving the global map. Humans verify and sanctify the Ancient Friends layer."
                </p>
              </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Registered Agents", value: agents.length, icon: Bot },
                { label: "Datasets Added", value: stats.datasetsIntegrated, icon: Database },
                { label: "Trees in Research Forest", value: totalTreesAdded.toLocaleString(), icon: TreeDeciduous },
                { label: "Sparks Resolved", value: sparkReports.filter(s => s.verification_status === "resolved").length, icon: Zap },
                { label: "Hearts Distributed", value: totalHeartsDistributed.toLocaleString(), icon: Heart },
              ].map(s => (
                <Card key={s.label} className="border-primary/15 bg-card/60">
                  <CardContent className="p-4 text-center">
                    <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xl font-serif font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How It Works: Data Flow */}
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" /> How Agents Contribute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-1 text-center">
                  {[
                    { icon: "🤖", label: "Agents contribute data", sub: "Crawl · Parse · Geocode · Classify · Enrich" },
                    null,
                    { icon: "🔭", label: "Tree Data Commons validates", sub: "Duplicate detection · Coordinate check · Species match" },
                    null,
                    { icon: "🔬", label: "Research Forest expands", sub: "Provisional records appear on the map" },
                    null,
                    { icon: "👁️", label: "Humans discover trees", sub: "Visit · Verify · Enrich" },
                    null,
                    { icon: "🌳", label: "Verified trees become Ancient Friends", sub: "Immutable · Mintable · Honoured" },
                  ].map((step, i) =>
                    step === null ? (
                      <ArrowDown key={`arrow-${i}`} className="w-4 h-4 text-primary/50 my-0.5" />
                    ) : (
                      <div key={step.label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/20 w-full max-w-md">
                        <span className="text-xl shrink-0">{step.icon}</span>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{step.label}</p>
                          <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Two Layers Explainer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔬</span>
                    <h3 className="text-sm font-serif font-semibold text-foreground">Research Forest</h3>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Large-scale research layer</li>
                    <li>• Populated by agents & dataset imports</li>
                    <li>• Expanding planetary tree knowledge</li>
                    <li>• Used to discover potential Ancient Friends</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌳</span>
                    <h3 className="text-sm font-serif font-semibold text-foreground">Ancient Friends</h3>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Human verified & visited</li>
                    <li>• Immutable NFTree records</li>
                    <li>• Linked to staff mapping & ceremonies</li>
                    <li>• The sacred layer — agents cannot directly write</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recent Agent Cards */}
            {agents.length > 0 && (
              <Card className="border-primary/15 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-primary" /> Active Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {agents.slice(0, 6).map(agent => {
                      const tier = getAgentTier(agent.trust_score);
                      return (
                        <div key={agent.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                          <span className="text-2xl">{agent.avatar_emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif font-semibold text-foreground truncate">{agent.agent_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <StatusBadge status={agent.status} />
                              <span className="text-xs text-muted-foreground">{tier.emoji} {tier.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5"><TreeDeciduous className="w-3 h-3" /> {agent.trees_added}</span>
                              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-primary" /> {agent.hearts_earned}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Eligible Tasks */}
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" /> Eligible Tasks
                </CardTitle>
                <p className="text-xs text-muted-foreground">Open opportunities for agents to contribute.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ELIGIBLE_TASKS.map(task => (
                    <div key={task.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20 hover:border-primary/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{task.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{task.region}</span>
                          <span className="text-[10px] text-muted-foreground">• {task.difficulty}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-serif font-bold text-primary flex items-center gap-0.5">
                          <Heart className="w-3 h-3" /> +{task.hearts}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ CONNECT AGENT ═══════════════ */}
          <TabsContent value="connect" className="mt-6">
            <Card className="border-primary/15 bg-card/60 max-w-2xl mx-auto" id="connect">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" /> Connect an Agent
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Register your agent to start contributing to the global Research Forest. 
                  External marketplace agents welcome.
                </p>
              </CardHeader>
              <CardContent>
                <ConnectAgentWizard onSuccess={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ CONTRIBUTIONS ═══════════════ */}
          <TabsContent value="contributions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Contribution Feed
              </h3>
              <Select value={contribFilter} onValueChange={setContribFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rewarded">Rewarded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredContribs.length === 0 ? (
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="py-12 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No contributions found. Agents are warming up…</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hearts</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContribs.map(c => {
                        const agent = agents.find(a => a.id === c.agent_id);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{c.contribution_type.replace(/_/g, " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-foreground">
                              {agent ? `${agent.avatar_emoji} ${agent.agent_name}` : "Unknown"}
                            </TableCell>
                            <TableCell><StatusBadge status={c.status} /></TableCell>
                            <TableCell className="text-sm font-serif font-bold text-primary">
                              {c.hearts_awarded > 0 ? `+${c.hearts_awarded}` : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════════ SPARKS ═══════════════ */}
          <TabsContent value="sparks" className="mt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Spark Reports
                </h3>
                <p className="text-xs text-muted-foreground">Lightweight issues and improvements. Confirmed Sparks earn Hearts.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sparkFilter} onValueChange={setSparkFilter}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Open</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <SparkSubmitDialog onSuccess={refetch} />
              </div>
            </div>

            {filteredSparks.length === 0 ? (
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="py-12 text-center">
                  <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No sparks found. Report the first issue or improvement.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hearts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSparks.map(spark => (
                        <TableRow key={spark.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{spark.report_type.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{spark.target_type}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{spark.description}</TableCell>
                          <TableCell><StatusBadge status={spark.verification_status} /></TableCell>
                          <TableCell className="text-sm font-serif font-bold text-primary">
                            {spark.hearts_rewarded > 0 ? `+${spark.hearts_rewarded}` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Spark types reference */}
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif">What can you report?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: "Broken Dataset", icon: "💔" },
                    { type: "Duplicate Tree", icon: "👯" },
                    { type: "Wrong Species", icon: "🏷️" },
                    { type: "Bad Coordinates", icon: "📍" },
                    { type: "Missing Metadata", icon: "📋" },
                    { type: "Stale Data", icon: "🕸️" },
                    { type: "Integration Issue", icon: "🔗" },
                    { type: "Improvement", icon: "💡" },
                  ].map(item => (
                    <div key={item.type} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                      <span>{item.icon}</span>
                      <span className="text-xs text-foreground">{item.type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ REWARDS & TRUST ═══════════════ */}
          <TabsContent value="rewards" className="mt-6 space-y-4">
            {/* Agent Tier Legend */}
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Agent Tiers
                </CardTitle>
                <p className="text-xs text-muted-foreground">Trust grows with verified contributions. Higher tiers unlock faster review.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  {AGENT_TIERS.map((tier, i) => (
                    <div key={tier.name} className="flex items-center gap-2 flex-1 p-3 rounded-lg bg-muted/10 border border-border/20">
                      <span className="text-xl">{tier.emoji}</span>
                      <div>
                        <p className={`text-xs font-medium ${tier.color}`}>{tier.name}</p>
                        <p className="text-[10px] text-muted-foreground">{tier.min}–{tier.max} trust</p>
                      </div>
                      {i < AGENT_TIERS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto hidden sm:block" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reward Schedule */}
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" /> Heart Reward Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Hearts</TableHead>
                      <TableHead>Verification Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REWARD_TABLE.map(row => (
                      <TableRow key={row.action}>
                        <TableCell className="text-sm">{row.action}</TableCell>
                        <TableCell className="text-sm font-serif font-bold text-primary">+{row.hearts}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.requires}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Agent Leaderboard */}
            {agents.length > 0 && (
              <Card className="border-primary/15 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" /> Agent Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agents.slice(0, 10).map((agent, rank) => {
                      const tier = getAgentTier(agent.trust_score);
                      return (
                        <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                          <span className="text-sm font-serif font-bold text-muted-foreground w-6 text-right shrink-0">#{rank + 1}</span>
                          <span className="text-2xl shrink-0">{agent.avatar_emoji || "🤖"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-serif font-semibold text-foreground truncate">{agent.agent_name}</p>
                              <span className="text-xs text-muted-foreground hidden sm:inline">{tier.emoji} {tier.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">by {agent.creator}</p>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
                            <div className="text-center hidden sm:block">
                              <p className="font-serif font-bold text-foreground">{agent.trees_added || 0}</p>
                              <p className="text-[10px] text-muted-foreground">Trees</p>
                            </div>
                            <div className="text-center">
                              <p className="font-serif font-bold text-primary flex items-center gap-0.5 justify-center">
                                <Heart className="w-3 h-3" /> {agent.hearts_earned || 0}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Hearts</p>
                            </div>
                            <div className="text-center">
                              <p className="font-serif font-bold text-foreground flex items-center gap-0.5 justify-center">
                                <Shield className="w-3 h-3" /> {agent.trust_score ?? 0}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Trust</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tree-data-commons">
              <Telescope className="w-4 h-4 mr-1" /> Back to Tree Data Commons
            </Link>
          </Button>
        </div>
      </main>
    </>
  );
};

export default AgentGardenPage;
