/**
 * Tree Data Commons — Knowledge Observatory for the Map
 *
 * Central registry and control layer for all tree knowledge sources feeding S33D.
 */
import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDataCommons, type DataSource, type AgentProfile } from "@/hooks/use-data-commons";
import {
  Globe, Database, Layers, TreeDeciduous, MapPin, Search,
  ExternalLink, Plus, Telescope, BookOpen, Leaf, Clock, ChevronRight,
  Bot, Shield, Heart, Zap, ArrowDown, Network
} from "lucide-react";

/* ── Status helpers ─────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  published: "bg-primary/20 text-primary border-primary/40",
  queued: "bg-accent/20 text-accent border-accent/40",
  crawling: "bg-secondary text-secondary-foreground border-border",
  needs_review: "bg-destructive/20 text-destructive border-destructive/40",
  not_integrated: "bg-muted text-muted-foreground border-border",
  parsed: "bg-secondary text-secondary-foreground border-border",
  normalised: "bg-primary/15 text-primary/80 border-primary/30",
  geocoded: "bg-primary/20 text-primary border-primary/40",
  pending: "bg-accent/20 text-accent border-accent/40",
  confirmed: "bg-primary/20 text-primary border-primary/40",
  rejected: "bg-destructive/20 text-destructive border-destructive/40",
  resolved: "bg-primary/15 text-primary/80 border-primary/30",
  verified: "bg-primary/20 text-primary border-primary/40",
  rewarded: "bg-primary/20 text-primary border-primary/40",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[status] || ""}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/* ── Canopy Overview ────────────────────────────────────────── */
function CanopyOverview({ stats }: { stats: ReturnType<typeof useDataCommons>["stats"] }) {
  const metrics = [
    { label: "Sources Tracked", value: stats.totalSources, icon: Database },
    { label: "Datasets Integrated", value: stats.datasetsIntegrated, icon: Layers },
    { label: "Countries Covered", value: stats.countriesCovered, icon: Globe },
    { label: "Species Represented", value: stats.speciesRepresented, icon: Leaf },
    { label: "Total Records", value: stats.totalRecords.toLocaleString(), icon: TreeDeciduous },
    { label: "Active Agents", value: stats.activeAgents, icon: Bot },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <m.icon className="w-5 h-5 mx-auto mb-2 text-primary/70" />
              <p className="text-xl font-serif font-bold text-primary">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Source Registry Card ───────────────────────────────────── */
function SourceCard({ source }: { source: DataSource }) {
  return (
    <Card className="border-primary/15 hover:border-primary/40 transition-all duration-300 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-serif flex items-start justify-between gap-2">
          <span>{source.name}</span>
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <StatusBadge status={source.integration_status} />
          <Badge variant="outline" className="text-xs capitalize">{source.scope}</Badge>
          <Badge variant="outline" className="text-xs capitalize">{source.source_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {source.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{source.notes}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {source.country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {source.country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" /> {source.record_count.toLocaleString()} records
          </span>
          <span className="capitalize">{source.data_format}</span>
        </div>
        {source.species_keys.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {source.species_keys.slice(0, 5).map(s => (
              <Badge key={s} variant="secondary" className="text-xs capitalize">
                {s.replace(/_/g, " ")}
              </Badge>
            ))}
            {source.species_keys.length > 5 && (
              <Badge variant="secondary" className="text-xs">+{source.species_keys.length - 5}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Contribution Modal ─────────────────────────────────────── */
function ContributeSourceDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", country: "", url: "", notes: "",
    source_type: "mixed", data_format: "manual", scope: "national",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Source name is required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in to contribute"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("tree_data_sources").insert({
      name: form.name.trim(),
      country: form.country.trim() || null,
      url: form.url.trim() || null,
      notes: form.notes.trim() || null,
      source_type: form.source_type,
      data_format: form.data_format,
      scope: form.scope,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit source"); return; }
    toast.success("Source submitted for review");
    setOpen(false);
    setForm({ name: "", country: "", url: "", notes: "", source_type: "mixed", data_format: "manual", scope: "national" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="sacred" size="sm"><Plus className="w-4 h-4 mr-1" /> Suggest Source</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Suggest a Tree Dataset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dc-name">Source Name *</Label>
            <Input id="dc-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dc-country">Country</Label>
              <Input id="dc-country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="dc-scope">Scope</Label>
              <Select value={form.scope} onValueChange={v => setForm({ ...form, scope: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="dc-url">Source URL</Label>
            <Input id="dc-url" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.source_type} onValueChange={v => setForm({ ...form, source_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ancient">Ancient</SelectItem>
                  <SelectItem value="champion">Champion</SelectItem>
                  <SelectItem value="species">Species</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="heritage">Heritage</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Format</Label>
              <Select value={form.data_format} onValueChange={v => setForm({ ...form, data_format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="geojson">GeoJSON</SelectItem>
                  <SelectItem value="scrape">Scrape</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="dc-notes">Notes</Label>
            <Textarea id="dc-notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Describe the dataset and why it should be included…" />
          </div>
          <Button type="submit" variant="sacred" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Register Agent Dialog ──────────────────────────────────── */
function RegisterAgentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    agent_name: "", creator: "", agent_type: "general", specialization: "",
    description: "", api_endpoint: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agent_name.trim() || !form.creator.trim()) {
      toast.error("Agent name and creator are required"); return;
    }
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
      registration_source: "marketplace",
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to register agent"); return; }
    toast.success("Agent registered successfully");
    setOpen(false);
    setForm({ agent_name: "", creator: "", agent_type: "general", specialization: "", description: "", api_endpoint: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="sacred" size="sm"><Bot className="w-4 h-4 mr-1" /> Register Agent</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Register an Agent</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Connect your AI agent to S33D's Research Forest. Agents earn Hearts for verified contributions.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agent Name *</Label>
              <Input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} required />
            </div>
            <div>
              <Label>Creator / Org *</Label>
              <Input value={form.creator} onChange={e => setForm({ ...form, creator: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agent Type</Label>
              <Select value={form.agent_type} onValueChange={v => setForm({ ...form, agent_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crawler">Crawler</SelectItem>
                  <SelectItem value="parser">Dataset Parser</SelectItem>
                  <SelectItem value="geocoder">Geocoder</SelectItem>
                  <SelectItem value="classifier">Species Classifier</SelectItem>
                  <SelectItem value="deduplicator">Duplicate Detector</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specialization</Label>
              <Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. UK tree registers" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do?" />
          </div>
          <div>
            <Label>API Endpoint (optional)</Label>
            <Input type="url" value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} placeholder="https://..." />
          </div>
          <Button type="submit" variant="sacred" className="w-full" disabled={submitting}>
            {submitting ? "Registering…" : "Register Agent"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Submit Spark Dialog ────────────────────────────────────── */
function SubmitSparkDialog({ onSuccess }: { onSuccess: () => void }) {
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
          <p className="text-xs text-muted-foreground">
            Report issues, duplicates, or improvements. Confirmed Sparks earn Hearts.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Report Type</Label>
              <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="incorrect_species">Incorrect Species</SelectItem>
                  <SelectItem value="invalid_coordinates">Invalid Coordinates</SelectItem>
                  <SelectItem value="missing_metadata">Missing Metadata</SelectItem>
                  <SelectItem value="broken_dataset">Broken Dataset</SelectItem>
                  <SelectItem value="dataset_update">Dataset Update</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target</Label>
              <Select value={form.target_type} onValueChange={v => setForm({ ...form, target_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tree">Tree</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description *</Label>
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

/* ── Main Page ──────────────────────────────────────────────── */
const TreeDataCommonsPage = () => {
  const { sources, crawlTasks, agents, sparkReports, loading, stats, refetch } = useDataCommons();
  const [search, setSearch] = useState("");

  const filteredSources = sources.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q) ||
      s.source_type.includes(q) ||
      s.notes?.toLowerCase().includes(q);
  });

  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 pb-32" style={{ paddingTop: "var(--content-top)" }}>
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <Telescope className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Tree Data Commons
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            The knowledge observatory for the map. Discover where tree data comes from,
            control which datasets appear, and track integration of global tree sources
            into the living atlas.
          </p>
        </motion.div>

        {/* ── Canopy Overview ── */}
        {!loading && <CanopyOverview stats={stats} />}

        {/* ── Tabs ── */}
        <Tabs defaultValue="sources" className="mt-8">
          <TabsList className="bg-card/50 border border-primary/20">
            <TabsTrigger value="sources">
              <Database className="w-3.5 h-3.5 mr-1.5" /> Sources
            </TabsTrigger>
            <TabsTrigger value="integration">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Integration Queue
            </TabsTrigger>
            <TabsTrigger value="layers">
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Map Layers
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-3.5 h-3.5 mr-1.5" /> Agent Garden
            </TabsTrigger>
            <TabsTrigger value="sparks">
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Sparks
            </TabsTrigger>
          </TabsList>

          {/* ── Source Registry Tab ── */}
          <TabsContent value="sources" className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sources, countries, species…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ContributeSourceDialog onSuccess={refetch} />
            </div>

            {loading ? (
              <p className="text-center py-12 text-muted-foreground">Loading sources…</p>
            ) : filteredSources.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                {sources.length === 0 ? "No sources registered yet." : "No sources match your search."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSources.map(s => <SourceCard key={s.id} source={s} />)}
              </div>
            )}
          </TabsContent>

          {/* ── Integration Queue Tab ── */}
          <TabsContent value="integration" className="mt-6">
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Crawl & Integration Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crawlTasks.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    No crawl tasks yet. Sources queued for integration will appear here.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crawlTasks.map(task => {
                        const src = sources.find(s => s.id === task.source_id);
                        return (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium text-sm">{src?.name || "Unknown"}</TableCell>
                            <TableCell className="text-sm">{task.country || "—"}</TableCell>
                            <TableCell className="text-sm capitalize">{task.crawl_type}</TableCell>
                            <TableCell className="text-sm">{task.priority}</TableCell>
                            <TableCell><StatusBadge status={task.status} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{task.next_action || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pipeline summary from sources themselves */}
            <Card className="border-primary/15 bg-card/60 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif">Integration Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["published", "queued", "needs_review", "not_integrated"].map(status => {
                    const count = sources.filter(s => s.integration_status === status).length;
                    return (
                      <div key={status} className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                        <p className="text-lg font-serif font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground capitalize">{status.replace(/_/g, " ")}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Map Layers Tab ── */}
          <TabsContent value="layers" className="mt-6">
            <Card className="border-primary/15 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Active Data Layers
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  These layers feed tree data into the Atlas map. Toggle visibility to control what you see.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Ancient Friends (user-mapped)", source: "S33D Community", count: "Growing", active: true },
                  { name: "Research Trees", source: "Curated Research", count: "Growing", active: true },
                  { name: "OpenStreetMap Trees", source: "OSM Contributors", count: "Dynamic", active: true },
                  { name: "Champion Trees Registers", source: "National Registers", count: "Pending", active: false },
                  { name: "Urban Tree Inventories", source: "City Open Data", count: "Pending", active: false },
                  { name: "Protected Heritage Trees", source: "Government DBs", count: "Pending", active: false },
                ].map((layer, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{layer.name}</p>
                      <p className="text-xs text-muted-foreground">{layer.source} · {layer.count} records</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {layer.active ? (
                        <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/40">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      )}
                      <Link to="/map" className="text-primary hover:text-primary/80">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Species contributions */}
            <Card className="border-primary/15 bg-card/60 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" /> Species Contributions
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Species knowledge flowing from registered sources into the ecosystem.
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const speciesMap = new Map<string, string[]>();
                  sources.forEach(s => {
                    (s.species_keys || []).forEach(sp => {
                      if (!speciesMap.has(sp)) speciesMap.set(sp, []);
                      speciesMap.get(sp)!.push(s.name);
                    });
                  });
                  const entries = [...speciesMap.entries()].sort((a, b) => b[1].length - a[1].length);
                  if (entries.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No species data yet.</p>;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {entries.slice(0, 12).map(([species, srcs]) => (
                        <div key={species} className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-sm capitalize text-foreground">{species.replace(/_/g, " ")}</span>
                          <span className="text-xs text-muted-foreground">{srcs.length} source{srcs.length > 1 ? "s" : ""}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Agent Garden Tab ── */}
          <TabsContent value="agents" className="mt-6 space-y-4">
            {/* Summary Card */}
            <Card className="border-primary/15 bg-card/60">
              <CardContent className="p-6 text-center space-y-4">
                <Bot className="w-10 h-10 text-primary mx-auto" />
                <h3 className="text-lg font-serif font-semibold text-foreground">Agent Garden</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The living contribution portal for AI agents. Connect, contribute datasets,
                  earn S33D Hearts, and help grow the Research Forest.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                  <div className="text-center">
                    <p className="text-xl font-serif font-bold text-foreground">{stats.activeAgents}</p>
                    <p className="text-[10px] text-muted-foreground">Active Agents</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-serif font-bold text-foreground">
                      {agents.reduce((a, ag) => a + (ag.trees_added || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Trees Added</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-serif font-bold text-primary flex items-center justify-center gap-0.5">
                      <Heart className="w-4 h-4" />
                      {agents.reduce((a, ag) => a + (ag.hearts_earned || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Hearts Earned</p>
                  </div>
                </div>
                <Button variant="sacred" asChild>
                  <Link to="/agent-garden">
                    <Bot className="w-4 h-4 mr-1" /> Open Agent Garden
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Agent List */}
            {agents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {agents.slice(0, 6).map(agent => (
                  <Card key={agent.id} className="border-primary/15 bg-card/40">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{agent.avatar_emoji || "🤖"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-serif font-semibold text-foreground truncate">{agent.agent_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5"><TreeDeciduous className="w-3 h-3" /> {agent.trees_added || 0}</span>
                            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-primary" /> {agent.hearts_earned || 0}</span>
                            <span className="flex items-center gap-0.5"><Shield className="w-3 h-3" /> {agent.trust_score ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Sparks Tab ── */}
          <TabsContent value="sparks" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Spark Reports
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lightweight issue and improvement reports. Confirmed Sparks earn Hearts.
                </p>
              </div>
              <SubmitSparkDialog onSuccess={refetch} />
            </div>

            {sparkReports.length === 0 ? (
              <Card className="border-primary/15 bg-card/60">
                <CardContent className="py-12 text-center">
                  <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No sparks yet. Be the first to report an issue or improvement.</p>
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
                      {sparkReports.map(spark => (
                        <TableRow key={spark.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{spark.report_type.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{spark.target_type}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{spark.description}</TableCell>
                          <TableCell>
                            <StatusBadge status={spark.verification_status} />
                          </TableCell>
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
                    { type: "Dataset Update", icon: "🔄" },
                    { type: "Improvement", icon: "💡" },
                    { type: "General Issue", icon: "⚠️" },
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
        </Tabs>

        {/* ── Connected Systems ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <h2 className="text-lg font-serif text-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Connected Systems
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Atlas Map", desc: "Datasets become map layers", to: "/map", icon: "🗺" },
              { label: "Ledger Explorer", desc: "Source & integration records", to: "/ledger", icon: "📜" },
              { label: "Spiral of Species", desc: "Species enrichment", to: "/hives", icon: "🌀" },
              { label: "Research Trees", desc: "Research imports as datasets", to: "/library/gallery", icon: "🔬" },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/40 transition-all group">
                <span className="text-2xl">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif text-foreground group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default TreeDataCommonsPage;
