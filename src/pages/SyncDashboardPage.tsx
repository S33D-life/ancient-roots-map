import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSyncOrchestration, type SyncProject, type SyncAsset, type SyncCycle, type SyncLog, type ChainAnchor } from "@/hooks/use-sync-orchestration";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  RefreshCw, Plus, Activity, Database, Link2, Shield, Clock,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Loader2, ArrowRight, Sparkles, Globe, Layers, FileJson, Anchor,
  Radio, Eye, Trash2, Zap
} from "lucide-react";

const statusColors: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  syncing: "bg-primary/20 text-primary border border-primary/40",
  verified: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  reconciled: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  failed: "bg-destructive/20 text-destructive border border-destructive/30",
  pinned: "bg-emerald-500/20 text-emerald-300",
  unpinned: "bg-muted text-muted-foreground",
  missing: "bg-destructive/20 text-destructive",
  pending: "bg-primary/20 text-primary",
  anchored: "bg-emerald-500/20 text-emerald-400",
  submitted: "bg-blue-500/20 text-blue-400",
};

const statusIcons: Record<string, React.ReactNode> = {
  queued: <Clock className="h-3 w-3" />,
  syncing: <RefreshCw className="h-3 w-3 animate-spin" />,
  verified: <CheckCircle2 className="h-3 w-3" />,
  reconciled: <AlertTriangle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  pinned: <CheckCircle2 className="h-3 w-3" />,
  missing: <AlertTriangle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  anchored: <Shield className="h-3 w-3" />,
  submitted: <Radio className="h-3 w-3" />,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`${statusColors[status] || "bg-muted text-muted-foreground"} text-[10px] gap-1 font-mono uppercase tracking-wider`}>
      {statusIcons[status]}
      {status}
    </Badge>
  );
}

function CycleTimeline({ cycles }: { cycles: SyncCycle[] }) {
  if (!cycles.length) return <p className="text-xs text-muted-foreground/60 italic font-serif">No cycles yet</p>;

  return (
    <div className="space-y-2">
      {cycles.slice(0, 8).map((c) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 text-xs"
        >
          <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
          <StatusBadge status={c.status} />
          <span className="text-muted-foreground font-mono">
            {c.assets_processed}p / {c.assets_verified}v / {c.assets_conflicted}c
          </span>
          <span className="text-muted-foreground/50 ml-auto font-mono text-[10px]">
            {c.started_at ? new Date(c.started_at).toLocaleTimeString() : "—"}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function LogStream({ logs }: { logs: SyncLog[] }) {
  const levelColors: Record<string, string> = {
    info: "text-blue-400",
    warn: "text-amber-400",
    error: "text-destructive",
  };

  return (
    <ScrollArea className="h-64">
      <div className="space-y-1 p-2 font-mono text-[11px]">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 leading-relaxed">
            <span className="text-muted-foreground/40 shrink-0">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
            <span className={`uppercase font-bold shrink-0 w-10 ${levelColors[log.level] || "text-foreground"}`}>
              {log.level}
            </span>
            <span className="text-foreground/80">{log.message}</span>
          </div>
        ))}
        {!logs.length && (
          <p className="text-muted-foreground/40 italic">No logs yet</p>
        )}
      </div>
    </ScrollArea>
  );
}

function AssetRow({ asset, onPin, onAnchorEth, onAnchorBtc }: {
  asset: SyncAsset;
  onPin: () => void;
  onAnchorEth: () => void;
  onAnchorBtc: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/20"
    >
      <FileJson className="h-4 w-4 text-primary/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif truncate">{asset.name}</p>
        {asset.current_cid && (
          <p className="text-[10px] font-mono text-muted-foreground/50 truncate">
            {asset.current_cid}
          </p>
        )}
      </div>
      <StatusBadge status={asset.pin_status} />
      <span className="text-[10px] font-mono text-muted-foreground/40">v{asset.version}</span>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onPin} title="Pin to IPFS">
          <Database className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAnchorEth} title="Anchor to Ethereum">
          <Globe className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAnchorBtc} title="Anchor to Bitcoin">
          <Link2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function SyncDashboardPage() {
  const {
    loading, fetchProjects, createProject, fetchAssets, createAsset,
    fetchCycles, fetchLogs, pinJson, runCycle, anchorEthereum, anchorBitcoin,
  } = useSyncOrchestration();

  const [projects, setProjects] = useState<SyncProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SyncProject | null>(null);
  const [assets, setAssets] = useState<SyncAsset[]>([]);
  const [cycles, setCycles] = useState<SyncCycle[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const p = await fetchProjects();
      setProjects(p);
      if (p.length > 0 && !selectedProject) {
        setSelectedProject(p[0]);
      }
    } catch {
      // handle silently
    } finally {
      setInitialLoad(false);
    }
  }, [fetchProjects, selectedProject]);

  const loadProjectData = useCallback(async (projectId: string) => {
    try {
      const [a, c, l] = await Promise.all([
        fetchAssets(projectId),
        fetchCycles(projectId),
        fetchLogs(projectId),
      ]);
      setAssets(a);
      setCycles(c);
      setLogs(l);
    } catch {
      // handle silently
    }
  }, [fetchAssets, fetchCycles, fetchLogs]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [selectedProject, loadProjectData]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const p = await createProject(newProjectName.trim());
      setProjects((prev) => [p, ...prev]);
      setSelectedProject(p);
      setNewProjectName("");
      setShowNewProject(false);
    } catch {
      // toast handled in hook
    }
  };

  const handleCreateAsset = async () => {
    if (!selectedProject || !newAssetName.trim()) return;
    try {
      const a = await createAsset(selectedProject.id, newAssetName.trim());
      setAssets((prev) => [a, ...prev]);
      setNewAssetName("");
      setShowNewAsset(false);
    } catch {
      // toast handled in hook
    }
  };

  const handleRunCycle = async () => {
    if (!selectedProject) return;
    try {
      await runCycle(selectedProject.id);
      await loadProjectData(selectedProject.id);
    } catch {
      // toast handled
    }
  };

  const handlePinAsset = async (asset: SyncAsset) => {
    if (!selectedProject) return;
    const content = { name: asset.name, metadata: asset.metadata, version: asset.version, timestamp: Date.now() };
    try {
      await pinJson(content, asset.name, asset.id, selectedProject.id);
      await loadProjectData(selectedProject.id);
    } catch {
      // handled
    }
  };

  const handleAnchorEth = async (asset: SyncAsset) => {
    if (!selectedProject || !asset.current_cid) return;
    try {
      await anchorEthereum(asset.id, asset.current_cid, undefined, selectedProject.id);
      await loadProjectData(selectedProject.id);
    } catch {
      // handled
    }
  };

  const handleAnchorBtc = async (asset: SyncAsset) => {
    if (!selectedProject || !asset.current_cid) return;
    try {
      await anchorBitcoin(asset.id, asset.current_cid, undefined, selectedProject.id);
      await loadProjectData(selectedProject.id);
    } catch {
      // handled
    }
  };

  // Stats
  const pinnedCount = assets.filter((a) => a.pin_status === "pinned" || a.pin_status === "verified").length;
  const lastCycle = cycles[0];
  const healthScore = assets.length > 0 ? Math.round((pinnedCount / assets.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-wide flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Sync Orchestration
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-serif">
            IPFS · Ethereum · Bitcoin — living archive pipeline
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Projects */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Projects</CardTitle>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowNewProject(!showNewProject)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <AnimatePresence>
                  {showNewProject && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        className="text-xs h-8"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      />
                      <Button size="sm" className="h-8" onClick={handleCreateProject} disabled={loading}>
                        <Check className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {initialLoad ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 italic text-center py-4 font-serif">
                    No sync projects yet
                  </p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                        selectedProject?.id === p.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/20 border border-transparent hover:border-border/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif truncate">{p.name}</span>
                        {p.is_active && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      {p.last_cycle_at && (
                        <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
                          Last sync: {new Date(p.last_cycle_at).toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedProject ? (
              <>
                {/* Health Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="bg-card/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Assets</p>
                      <p className="text-2xl font-bold font-mono text-foreground">{assets.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Pinned</p>
                      <p className="text-2xl font-bold font-mono text-emerald-400">{pinnedCount}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cycles</p>
                      <p className="text-2xl font-bold font-mono text-foreground">{cycles.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Health</p>
                      <p className="text-2xl font-bold font-mono text-primary">{healthScore}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Health bar */}
                <Progress value={healthScore} className="h-2" />

                {/* Actions Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="mystical"
                    size="sm"
                    onClick={handleRunCycle}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Run Sync Cycle
                  </Button>
                  <Button
                    variant="sacred"
                    size="sm"
                    onClick={() => setShowNewAsset(!showNewAsset)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Asset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadProjectData(selectedProject.id)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {/* New Asset Input */}
                <AnimatePresence>
                  {showNewAsset && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        placeholder="Asset name (e.g. staff-metadata.json)"
                        className="text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateAsset()}
                      />
                      <Button onClick={handleCreateAsset} disabled={loading}>
                        <Check className="h-4 w-4 mr-1" /> Create
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Assets */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary/60" />
                      Assets Pipeline
                    </CardTitle>
                    <CardDescription>IPFS-pinned assets with chain anchoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {assets.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 italic text-center py-6 font-serif">
                        Add assets to begin pinning and anchoring
                      </p>
                    ) : (
                      assets.map((a) => (
                        <AssetRow
                          key={a.id}
                          asset={a}
                          onPin={() => handlePinAsset(a)}
                          onAnchorEth={() => handleAnchorEth(a)}
                          onAnchorBtc={() => handleAnchorBtc(a)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Cycle Timeline */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary/60" />
                      Cycle Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CycleTimeline cycles={cycles} />
                  </CardContent>
                </Card>

                {/* Logs */}
                <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/10 transition-colors">
                        <CardTitle className="text-base flex items-center gap-2">
                          {logsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <Zap className="h-4 w-4 text-primary/60" />
                          Sync Logs
                          <Badge variant="secondary" className="ml-2 text-[10px]">{logs.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <LogStream logs={logs} />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <Activity className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-serif text-foreground/60">Create a sync project to begin</h3>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    Define assets, configure IPFS pinning, and anchor to Ethereum & Bitcoin
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Needed for the Check icon used in the page
function Check(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return <CheckCircle2 {...props} />;
}
