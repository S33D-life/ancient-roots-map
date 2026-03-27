/**
 * DevRoom (Tap Root) — The deep technical root of the S33D ecosystem.
 * Houses developer systems, infrastructure, settings, and advanced controls.
 * "The tap root feeds the entire living tree."
 */
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { SkillViewer } from "@/components/library/SkillViewer";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import {
  Terminal, Bot, Database, Layers, TreeDeciduous, Network, Shield,
  Heart, Activity, GitBranch, FileCode, BookOpen, Map, Settings,
  Zap, Globe, Eye, CheckCircle, Clock, AlertTriangle, Sprout,
  Flower, Leaf, ChevronRight, ExternalLink, Package, Server,
  Code, FileText, Telescope, Users, Scroll, Archive,
  RefreshCw, Bug, Wrench, Import, Share2, PenTool, Crown, Send, Loader2
} from "lucide-react";

const TelegramSettings = lazy(() => import("@/components/settings/TelegramSettings"));

/* ── Types ── */
type Section = "overview" | "system-map" | "data-roots" | "agent-garden" | "code-grove" | "contract-shelf" | "roadmap" | "toolshed" | "skills" | "settings" | "telegram";

interface SystemNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  route: string;
  status: "live" | "building" | "planned";
  connections: string[];
}

/* ── Section nav ── */
const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: "overview",        label: "Overview",    icon: <Eye className="w-3.5 h-3.5" /> },
  { key: "system-map",      label: "System Map",  icon: <Network className="w-3.5 h-3.5" /> },
  { key: "data-roots",      label: "Data Roots",  icon: <Database className="w-3.5 h-3.5" /> },
  { key: "agent-garden",    label: "Agent Garden", icon: <Bot className="w-3.5 h-3.5" /> },
  { key: "code-grove",      label: "Code Grove",  icon: <Code className="w-3.5 h-3.5" /> },
  { key: "contract-shelf",  label: "Contracts",   icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "roadmap",         label: "Roadmap",     icon: <Sprout className="w-3.5 h-3.5" /> },
  { key: "toolshed",        label: "Toolshed",    icon: <Wrench className="w-3.5 h-3.5" /> },
  { key: "skills",          label: "Skills",      icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: "settings",        label: "Settings",    icon: <Settings className="w-3.5 h-3.5" /> },
  { key: "telegram",        label: "Telegram",    icon: <Send className="w-3.5 h-3.5" /> },
];

/* ── System Map Nodes ── */
const SYSTEM_NODES: SystemNode[] = [
  { id: "ancient-friends", label: "Ancient Friends", icon: <TreeDeciduous className="w-5 h-5" />, description: "Human-verified ceremonial tree records. Immutable layer.", route: "/library/gallery", status: "live", connections: ["research-forest", "ledger"] },
  { id: "research-forest", label: "Research Forest", icon: <Telescope className="w-5 h-5" />, description: "Agent & dataset-populated research tree records.", route: "/tree-data-commons", status: "live", connections: ["agent-garden", "data-commons", "ancient-friends"] },
  { id: "data-commons", label: "Tree Data Commons", icon: <Database className="w-5 h-5" />, description: "Knowledge observatory. Sources, datasets, crawl pipelines.", route: "/tree-data-commons", status: "live", connections: ["research-forest", "agent-garden"] },
  { id: "agent-garden", label: "Agent Garden", icon: <Bot className="w-5 h-5" />, description: "Agent contribution protocol. Registration, capabilities, rewards.", route: "/agent-garden", status: "live", connections: ["research-forest", "data-commons", "hearts"] },
  { id: "heartwood", label: "Heartwood Library", icon: <BookOpen className="w-5 h-5" />, description: "Central hall with rooms: Staff, Books, Seeds, Music, Vault.", route: "/library", status: "live", connections: ["ancient-friends", "council"] },
  { id: "council", label: "Council of Life", icon: <Users className="w-5 h-5" />, description: "Community governance. Proposals, voting, bio-region stewardship.", route: "/council-of-life", status: "live", connections: ["heartwood", "hearts"] },
  { id: "hearts", label: "S33D Hearts", icon: <Heart className="w-5 h-5" />, description: "Reward currency. Earned through contributions, check-ins, and governance.", route: "/how-hearts-work", status: "live", connections: ["agent-garden", "ledger", "council"] },
  { id: "ledger", label: "Ledger Explorer", icon: <Scroll className="w-5 h-5" />, description: "Transaction records. Heart flows, anchoring, audit trail.", route: "/library/scrolls", status: "live", connections: ["hearts", "ancient-friends"] },
  { id: "spiral", label: "Spiral of Species", icon: <Leaf className="w-5 h-5" />, description: "Species hives, bio-region mapping, seasonal markers.", route: "/hives", status: "live", connections: ["research-forest", "data-commons"] },
  { id: "companion", label: "Companion", icon: <Users className="w-5 h-5" />, description: "Grove companions, quests, social layer.", route: "/companion", status: "live", connections: ["heartwood", "hearts"] },
  { id: "whispers", label: "Whispers", icon: <Flower className="w-5 h-5" />, description: "Reflections, check-ins, poetry layer.", route: "/whispers", status: "live", connections: ["ancient-friends", "heartwood"] },
  { id: "ecosystem-map", label: "Ecosystem Map", icon: <Globe className="w-5 h-5" />, description: "TETOL living map. Infrastructure orbits, partner mycelium.", route: "/ecosystem", status: "live", connections: ["heartwood"] },
];

/* ── Contract definitions ── */
const CONTRACTS = [
  { id: "agent-protocol", title: "Agent Garden Protocol", version: "v1", status: "live" as const, description: "REST API contract for agent registration, contributions, and rewards.", route: "/api-docs", endpoints: 15 },
  { id: "heart-ledger", title: "Heart Ledger Schema", version: "v1", status: "live" as const, description: "Transaction types, chain anchoring, claim flows.", route: "/library/scrolls", endpoints: 8 },
  { id: "tree-record", title: "Research Tree Record", version: "v1", status: "live" as const, description: "Data model for research forest entries with validation pipeline.", route: "/tree-data-commons", endpoints: 6 },
  { id: "promotion-flow", title: "Promotion Protocol", version: "v1", status: "building" as const, description: "Research → Candidate → Ancient Friend. Human verification gate.", route: "#", endpoints: 3 },
  { id: "smart-contracts", title: "On-Chain Contracts", version: "draft", status: "planned" as const, description: "Future smart contract plans for Hearts, NFTrees, and governance.", route: "#", endpoints: 0 },
];

/* ── Roadmap items ── */
const ROADMAP_ITEMS = [
  { id: "r1", title: "Agent Garden v1", status: "in bloom" as const, system: "agent-garden", description: "Full agent registration, contribution, and reward pipeline." },
  { id: "r2", title: "Research Forest Layer", status: "growing" as const, system: "research-forest", description: "Separate research tree records from Ancient Friends." },
  { id: "r3", title: "Species Enrichment Pipeline", status: "growing" as const, system: "spiral", description: "Automated species classification via agent capabilities." },
  { id: "r4", title: "Promotion Flow", status: "sprout" as const, system: "ancient-friends", description: "Human verification gate for Ancient Friend candidacy." },
  { id: "r5", title: "Marketplace Integration", status: "seed" as const, system: "agent-garden", description: "Support for external agent marketplace tokens and webhooks." },
  { id: "r6", title: "On-Chain Hearts", status: "seed" as const, system: "hearts", description: "Bridge S33D Hearts to EVM-compatible chains." },
  { id: "r7", title: "Governance Proposals v2", status: "sprout" as const, system: "council", description: "Weighted voting with influence scores and delegation." },
  { id: "r8", title: "Bio-Region Seasonal AI", status: "seed" as const, system: "spiral", description: "ML-driven seasonal markers from field observations." },
];

const statusColors: Record<string, string> = {
  "live": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "building": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "planned": "bg-muted text-muted-foreground border-border",
  "seed": "bg-amber-900/30 text-amber-200/70 border-amber-700/30",
  "sprout": "bg-lime-900/30 text-lime-200/70 border-lime-700/30",
  "growing": "bg-emerald-900/30 text-emerald-200/80 border-emerald-700/30",
  "in bloom": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "blocked": "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  "seed": <Sprout className="w-3 h-3" />,
  "sprout": <Sprout className="w-3 h-3" />,
  "growing": <Leaf className="w-3 h-3" />,
  "in bloom": <Flower className="w-3 h-3" />,
  "blocked": <AlertTriangle className="w-3 h-3" />,
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

const DevRoom = () => {
  const [section, setSection] = useState<Section>("overview");
  const [stats, setStats] = useState({ agents: 0, datasets: 0, sources: 0, trees: 0, sparks: 0, contributions: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Fetch live stats
  useEffect(() => {
    const load = async () => {
      const [agents, datasets, sources, trees, sparks, contribs] = await Promise.all([
        supabase.from("agent_profiles").select("id", { count: "exact", head: true }),
        supabase.from("tree_datasets").select("id", { count: "exact", head: true }),
        supabase.from("tree_data_sources").select("id", { count: "exact", head: true }),
        supabase.from("research_trees").select("id", { count: "exact", head: true }),
        supabase.from("spark_reports").select("id", { count: "exact", head: true }),
        supabase.from("agent_contribution_events").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        agents: agents.count ?? 0,
        datasets: datasets.count ?? 0,
        sources: sources.count ?? 0,
        trees: trees.count ?? 0,
        sparks: sparks.count ?? 0,
        contributions: contribs.count ?? 0,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tap Root header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono text-amber-300/80">TAP ROOT</span>
        </div>
        <p className="text-xs text-muted-foreground/60 max-w-md mx-auto font-serif">
          The deep technical root feeding the entire S33D ecosystem.
        </p>
      </div>

      {/* Section Nav */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              section === s.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-card/40 text-muted-foreground/70 border border-border/30 hover:bg-card/60 hover:text-foreground/80"
            }`}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <Separator className="opacity-30" />

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {section === "overview" && <OverviewSection stats={stats} />}
          {section === "system-map" && <SystemMapSection selectedNode={selectedNode} setSelectedNode={setSelectedNode} />}
          {section === "data-roots" && <DataRootsSection stats={stats} />}
          {section === "agent-garden" && <AgentGardenSection stats={stats} />}
          {section === "code-grove" && <CodeGroveSection />}
          {section === "contract-shelf" && <ContractShelfSection />}
          {section === "roadmap" && <RoadmapSection />}
          {section === "toolshed" && <ToolshedSection />}
          {section === "skills" && <SkillsSection />}
          {section === "settings" && <SettingsSection />}
          {section === "telegram" && <TelegramSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   OVERVIEW
   ═══════════════════════════════════════════════════ */
function OverviewSection({ stats }: { stats: Record<string, number> }) {
  const cards = [
    { label: "Connected Agents", value: stats.agents, icon: <Bot className="w-4 h-4 text-emerald-400" />, route: "/agent-garden" },
    { label: "Active Datasets", value: stats.datasets, icon: <Database className="w-4 h-4 text-blue-400" />, route: "/tree-data-commons" },
    { label: "Data Sources", value: stats.sources, icon: <Globe className="w-4 h-4 text-cyan-400" />, route: "/tree-data-commons" },
    { label: "Research Trees", value: stats.trees, icon: <TreeDeciduous className="w-4 h-4 text-green-400" />, route: "/tree-data-commons" },
    { label: "Open Sparks", value: stats.sparks, icon: <Zap className="w-4 h-4 text-amber-400" />, route: "/agent-garden" },
    { label: "Contributions", value: stats.contributions, icon: <Activity className="w-4 h-4 text-purple-400" />, route: "/agent-garden" },
  ];

  return (
    <div className="space-y-6">
      {/* Status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(c => (
          <Link key={c.label} to={c.route}>
            <Card className="bg-card/30 border-border/20 hover:bg-card/50 transition-colors group cursor-pointer">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {c.icon}
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
                <span className="text-2xl font-mono font-bold text-foreground/90">{c.value}</span>
                <span className="text-[10px] text-muted-foreground/60 leading-tight">{c.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* System health */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Database", health: 100 },
            { label: "Edge Functions", health: 100 },
            { label: "Auth Service", health: 100 },
            { label: "Storage", health: 100 },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/70 w-28">{s.label}</span>
              <Progress value={s.health} className="flex-1 h-1.5" />
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Ecosystem Map", route: "/ecosystem", icon: <Globe className="w-3.5 h-3.5" /> },
          { label: "API Docs", route: "/api-docs", icon: <FileCode className="w-3.5 h-3.5" /> },
          { label: "Roadmap", route: "/roadmap", icon: <Sprout className="w-3.5 h-3.5" /> },
          { label: "Bug Garden", route: "/bug-garden", icon: <Bug className="w-3.5 h-3.5" /> },
          { label: "Sync Dashboard", route: "/sync", icon: <RefreshCw className="w-3.5 h-3.5" /> },
          { label: "Test Lab", route: "/test-lab", icon: <Wrench className="w-3.5 h-3.5" /> },
          { label: "Curator Tools", route: "/curator", icon: <Crown className="w-3.5 h-3.5" /> },
          { label: "Admin Evolution", route: "/admin-evolution", icon: <Settings className="w-3.5 h-3.5" /> },
        ].map(l => (
          <Link key={l.label} to={l.route}>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-card/20 border-border/20 text-xs">
              {l.icon}
              {l.label}
              <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-40" />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SYSTEM MAP
   ═══════════════════════════════════════════════════ */
function SystemMapSection({ selectedNode, setSelectedNode }: { selectedNode: string | null; setSelectedNode: (n: string | null) => void }) {
  const selected = SYSTEM_NODES.find(n => n.id === selectedNode);
  const connectedIds = selected ? selected.connections : [];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground/50 text-center font-serif">
        Tap a node to see its connections and relationships.
      </p>

      {/* Node grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SYSTEM_NODES.map(node => {
          const isSelected = selectedNode === node.id;
          const isConnected = connectedIds.includes(node.id);
          const isDimmed = selectedNode && !isSelected && !isConnected;

          return (
            <motion.button
              key={node.id}
              onClick={() => setSelectedNode(isSelected ? null : node.id)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-primary/15 border-primary/40 ring-1 ring-primary/20"
                  : isConnected
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : isDimmed
                  ? "bg-card/10 border-border/10 opacity-30"
                  : "bg-card/30 border-border/20 hover:bg-card/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={isSelected ? "text-primary" : isConnected ? "text-emerald-400" : "text-muted-foreground/60"}>
                  {node.icon}
                </span>
                <Badge variant="outline" className={`text-[8px] ${statusColors[node.status]}`}>
                  {node.status}
                </Badge>
              </div>
              <span className="text-xs font-medium text-foreground/80 block">{node.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-card/30 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {selected.icon}
                  <span className="font-medium text-sm">{selected.label}</span>
                </div>
                <p className="text-xs text-muted-foreground/70 font-serif">{selected.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground/50 mr-1">Connects to:</span>
                  {selected.connections.map(c => {
                    const target = SYSTEM_NODES.find(n => n.id === c);
                    return target ? (
                      <button
                        key={c}
                        onClick={() => setSelectedNode(c)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        {target.label}
                      </button>
                    ) : null;
                  })}
                </div>
                <Link to={selected.route}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 mt-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DATA ROOTS
   ═══════════════════════════════════════════════════ */
function DataRootsSection({ stats }: { stats: Record<string, number> }) {
  const [sources, setSources] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("tree_data_sources").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("tree_datasets").select("*").order("created_at", { ascending: false }).limit(10),
    ]).then(([s, d]) => {
      setSources(s.data || []);
      setDatasets(d.data || []);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Sources", value: stats.sources },
          { label: "Datasets", value: stats.datasets },
          { label: "Research Trees", value: stats.trees },
        ].map(s => (
          <Card key={s.label} className="bg-card/20 border-border/20">
            <CardContent className="p-3">
              <span className="text-lg font-mono font-bold text-foreground/80">{s.value}</span>
              <p className="text-[10px] text-muted-foreground/50">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent sources */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Recent Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {sources.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic">No sources yet</p>
          ) : (
            sources.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                <span className="text-xs text-foreground/70 truncate flex-1">{s.name}</span>
                <Badge variant="outline" className="text-[8px] ml-2">{s.integration_status}</Badge>
              </div>
            ))
          )}
          <Link to="/tree-data-commons">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground/50 mt-2">
              View all in Tree Data Commons <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent datasets */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Recent Datasets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {datasets.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic">No datasets yet</p>
          ) : (
            datasets.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                <span className="text-xs text-foreground/70 truncate flex-1">{d.name}</span>
                <Badge variant="outline" className="text-[8px] ml-2">{d.ingestion_status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AGENT GARDEN
   ═══════════════════════════════════════════════════ */
function AgentGardenSection({ stats }: { stats: Record<string, number> }) {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("agent_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setAgents(data || []));
  }, []);

  const tierColors: Record<string, string> = {
    seedling: "text-amber-400",
    sapling: "text-lime-400",
    young_grove: "text-emerald-400",
    deep_root: "text-cyan-400",
    ancient_grove: "text-purple-400",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-center">
        <Card className="bg-card/20 border-border/20">
          <CardContent className="p-3">
            <span className="text-lg font-mono font-bold text-foreground/80">{stats.agents}</span>
            <p className="text-[10px] text-muted-foreground/50">Registered Agents</p>
          </CardContent>
        </Card>
        <Card className="bg-card/20 border-border/20">
          <CardContent className="p-3">
            <span className="text-lg font-mono font-bold text-foreground/80">{stats.contributions}</span>
            <p className="text-[10px] text-muted-foreground/50">Total Contributions</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent list */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            Agent Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic">No agents registered yet</p>
          ) : (
            agents.slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-border/10 last:border-0">
                <span className="text-base">{a.avatar_emoji || "🤖"}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground/80 block truncate">{a.agent_name}</span>
                  <span className="text-[10px] text-muted-foreground/50">{a.agent_type} · {a.creator}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono ${tierColors[a.tier] || "text-muted-foreground"}`}>{a.tier}</span>
                  <Badge variant="outline" className={`text-[8px] ${a.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'}`}>
                    {a.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
          <Link to="/agent-garden">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground/50 mt-2">
              Open Agent Garden <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CODE GROVE
   ═══════════════════════════════════════════════════ */
function CodeGroveSection() {
  const modules = [
    { name: "Core App", path: "src/App.tsx", icon: <Package className="w-3.5 h-3.5" />, desc: "Routing, lazy-loading, realm wrappers" },
    { name: "Heartwood Library", path: "src/pages/library/", icon: <BookOpen className="w-3.5 h-3.5" />, desc: "Room routing, HeartwoodRoomShell, Landing" },
    { name: "Tree Data Commons", path: "src/pages/TreeDataCommonsPage.tsx", icon: <Database className="w-3.5 h-3.5" />, desc: "Sources, datasets, crawl pipelines" },
    { name: "Agent Garden", path: "src/pages/AgentGardenPage.tsx", icon: <Bot className="w-3.5 h-3.5" />, desc: "Agent portal, registration, contributions" },
    { name: "Ecosystem Map", path: "src/components/ecosystem/", icon: <Globe className="w-3.5 h-3.5" />, desc: "TETOL SVG visualization, resilience layer" },
    { name: "Edge Functions", path: "supabase/functions/", icon: <Server className="w-3.5 h-3.5" />, desc: "API gateway, agent garden service" },
    { name: "Data Hooks", path: "src/hooks/", icon: <GitBranch className="w-3.5 h-3.5" />, desc: "useDataCommons, useTreeDetail, etc." },
    { name: "Shared Components", path: "src/components/shared/", icon: <Layers className="w-3.5 h-3.5" />, desc: "SparkDialog, StatusBadge, etc." },
  ];

  const deps = [
    { name: "React", version: "18.3", category: "framework" },
    { name: "Vite", version: "latest", category: "build" },
    { name: "Tailwind CSS", version: "latest", category: "styling" },
    { name: "Framer Motion", version: "12.x", category: "animation" },
    { name: "Supabase JS", version: "2.x", category: "backend" },
    { name: "React Query", version: "5.x", category: "data" },
    { name: "Leaflet", version: "1.9", category: "maps" },
    { name: "Ethers.js", version: "6.x", category: "web3" },
    { name: "Recharts", version: "2.x", category: "charts" },
  ];

  return (
    <div className="space-y-4">
      {/* Modules */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-violet-400" />
            Modules & Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {modules.map(m => (
            <div key={m.name} className="flex items-start gap-2.5 py-2 border-b border-border/10 last:border-0">
              <span className="text-muted-foreground/50 mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground/80 block">{m.name}</span>
                <span className="text-[10px] text-muted-foreground/40 font-mono block truncate">{m.path}</span>
                <span className="text-[10px] text-muted-foreground/50">{m.desc}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            Key Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {deps.map(d => (
              <Badge key={d.name} variant="outline" className="text-[10px] bg-card/30 border-border/20">
                {d.name} <span className="text-muted-foreground/40 ml-1">{d.version}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CONTRACT SHELF
   ═══════════════════════════════════════════════════ */
function ContractShelfSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground/50 text-center font-serif">
        Technical contracts, API schemas, and protocol documentation.
      </p>
      {CONTRACTS.map(c => (
        <Card key={c.id} className="bg-card/20 border-border/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400/60" />
                <span className="text-sm font-medium text-foreground/80">{c.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[8px] font-mono">{c.version}</Badge>
                <Badge variant="outline" className={`text-[8px] ${statusColors[c.status]}`}>{c.status}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60">{c.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/40">{c.endpoints} endpoints</span>
              {c.route !== "#" && (
                <Link to={c.route}>
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2 gap-1">
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROADMAP CANOPY
   ═══════════════════════════════════════════════════ */
function RoadmapSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground/50 text-center font-serif">
        Living roadmap tied to real systems. Items grow from seed to bloom.
      </p>
      {ROADMAP_ITEMS.map(item => (
        <Card key={item.id} className="bg-card/20 border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground/80">{item.title}</span>
              <Badge variant="outline" className={`text-[9px] gap-1 ${statusColors[item.status]}`}>
                {statusIcons[item.status]}
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-2">{item.description}</p>
            <Badge variant="outline" className="text-[8px] bg-card/20">{item.system}</Badge>
          </CardContent>
        </Card>
      ))}
      <Link to="/roadmap">
        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
          <Sprout className="w-3 h-3" />
          View Full Living Forest Roadmap
        </Button>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETTINGS & CONTROLS
   ═══════════════════════════════════════════════════ */
function SettingsSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground/50 text-center font-serif">
        Advanced system settings. Handle with care.
      </p>

      {/* Map Layer Config */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Map className="w-3.5 h-3.5 text-blue-400" />
            Map Layers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Ancient Friends", "Research Forest", "Bio-Regions", "Harvest Listings"].map(layer => (
            <div key={layer} className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground/70">{layer}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Thresholds */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Validation Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground/70">Auto-approve trust score</Label>
              <span className="text-xs font-mono text-muted-foreground/50">≥ 80</span>
            </div>
            <Slider defaultValue={[80]} max={100} step={5} className="w-full" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground/70">Bulk upload limit</Label>
              <span className="text-xs font-mono text-muted-foreground/50">500</span>
            </div>
            <Slider defaultValue={[500]} max={2000} step={100} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Moderation */}
      <Card className="bg-card/20 border-border/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-violet-400" />
            Moderation Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Require manual review for new agents",
            "Auto-flag duplicate submissions",
            "Enable trust-based auto-verification",
            "Allow marketplace agent registration",
          ].map(setting => (
            <div key={setting} className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground/70 flex-1 mr-2">{setting}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOOLSHED — Dev tools gathered from across the ecosystem
   ═══════════════════════════════════════════════════ */
function ToolshedSection() {
  const tools = [
    {
      category: "Infrastructure",
      items: [
        { label: "Sync Dashboard", desc: "CID pinning, chain anchoring, asset reconciliation", route: "/sync", icon: <RefreshCw className="w-4 h-4" />, status: "live" },
        { label: "Ecosystem Map", desc: "TETOL living infrastructure map with resilience mode", route: "/ecosystem", icon: <Globe className="w-4 h-4" />, status: "live" },
      ],
    },
    {
      category: "Quality & Testing",
      items: [
        { label: "Test Lab", desc: "Feature checklists, edge case testing, smoke tests", route: "/test-lab", icon: <Wrench className="w-4 h-4" />, status: "live" },
        { label: "Bug Garden", desc: "Bug reports, triage, community upvotes", route: "/bug-garden", icon: <Bug className="w-4 h-4" />, status: "live" },
        { label: "Share Simulator", desc: "Test sharing flows and incoming share parsing", route: "/share-simulator", icon: <Share2 className="w-4 h-4" />, status: "live" },
      ],
    },
    {
      category: "Data & Curation",
      items: [
        { label: "Curator Tools", desc: "Staff management, tree verification, moderation", route: "/curator", icon: <Crown className="w-4 h-4" />, status: "live" },
        { label: "Rootstone Importer", desc: "Bulk CSV/JSON import for tree records", route: "/curator/rootstones-import", icon: <Import className="w-4 h-4" />, status: "live" },
        { label: "Edit Review", desc: "Review pending community edits and contributions", route: "/edit-review", icon: <PenTool className="w-4 h-4" />, status: "live" },
      ],
    },
    {
      category: "API & Contracts",
      items: [
        { label: "API Docs", desc: "REST endpoint reference, health checks, auth info", route: "/api-docs", icon: <FileCode className="w-4 h-4" />, status: "live" },
        { label: "Agent Garden Portal", desc: "Agent registration, capabilities, contribution tracking", route: "/agent-garden", icon: <Bot className="w-4 h-4" />, status: "live" },
      ],
    },
    {
      category: "Administration",
      items: [
        { label: "Admin Evolution", desc: "Growth panels, system evolution controls", route: "/admin-evolution", icon: <Settings className="w-4 h-4" />, status: "live" },
        { label: "Calendar Settings", desc: "Seasonal lens configuration, calendar markers", route: "/calendar-settings", icon: <Clock className="w-4 h-4" />, status: "live" },
        { label: "Install Guide", desc: "PWA installation instructions for all platforms", route: "/install", icon: <Package className="w-4 h-4" />, status: "live" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground/50 text-center font-serif">
        Developer tools and utilities gathered from across the ecosystem into one root system.
      </p>

      {tools.map(group => (
        <div key={group.category} className="space-y-2">
          <h3 className="text-[11px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.items.map(tool => (
              <Link key={tool.label} to={tool.route}>
                <Card className="bg-card/20 border-border/20 hover:bg-card/40 hover:border-primary/20 transition-all group cursor-pointer h-full">
                  <CardContent className="p-3 flex items-start gap-3">
                    <span className="text-muted-foreground/50 group-hover:text-primary/70 transition-colors mt-0.5 shrink-0">
                      {tool.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground/80">{tool.label}</span>
                        <Badge variant="outline" className={`text-[7px] ${statusColors[tool.status]}`}>{tool.status}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 leading-relaxed mt-0.5">{tool.desc}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors mt-1 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SKILLS
   ═══════════════════════════════════════════════════ */
function SkillsSection() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> S33D Skills
        </h2>
        <p className="text-xs text-muted-foreground/70">
          A living field guide for co-creators. Learn how to contribute safely and effectively before taking tasks.
        </p>
      </div>
      <SkillViewer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TELEGRAM INTEGRATION
   ═══════════════════════════════════════════════════ */
function TelegramSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Telegram Integration
        </h2>
        <p className="text-xs text-muted-foreground/70">
          TEOTAG connects the S33D ecosystem to Telegram — login, guidance, notifications, and community.
        </p>
      </div>

      {/* Open Layer — visible to all */}
      <Card className="border-border/30 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> What TEOTAG does
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { emoji: "🔑", title: "Login", desc: "Sign in to S33D via Telegram once linked" },
              { emoji: "🧭", title: "Guidance", desc: "TEOTAG answers questions and helps you navigate" },
              { emoji: "🔔", title: "Notifications", desc: "Receive heart milestones, tree alerts, and council updates" },
              { emoji: "🤝", title: "Community", desc: "Join the @s33dlife group for fellow wanderers" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ background: "hsl(var(--secondary) / 0.1)", border: "1px solid hsl(var(--border) / 0.1)" }}>
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-xs font-serif text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="opacity-20" />

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-serif">Commands</p>
            <div className="flex flex-wrap gap-1.5">
              {["/login", "/connect", "/new", "/help"].map((cmd) => (
                <span key={cmd} className="px-2 py-1 rounded-md text-xs font-mono"
                  style={{ background: "hsl(var(--secondary) / 0.15)", border: "1px solid hsl(var(--border) / 0.15)", color: "hsl(var(--primary))" }}>
                  {cmd}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a href="https://t.me/s33dlifebot" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif min-h-[32px] transition-colors"
              style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}>
              <Send className="w-3 h-3" /> Open TEOTAG Bot
            </a>
            <a href="https://t.me/s33dlife" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif text-muted-foreground min-h-[32px] transition-colors"
              style={{ background: "hsl(var(--secondary) / 0.15)", border: "1px solid hsl(var(--border) / 0.2)" }}>
              <Users className="w-3 h-3" /> @s33dlife Group
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Curator Layer — Bot configuration */}
      <Card className="border-border/30 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" /> Bot Configuration
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Notification settings, delivery mode, and integration controls.
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="py-6 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>}>
            <TelegramSettings />
          </Suspense>
        </CardContent>
      </Card>

      {/* Return to Hearth */}
      <div className="text-center pt-2">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors font-serif">
          ← Return to Hearth
        </Link>
      </div>
    </div>
  );
}

export default DevRoom;
