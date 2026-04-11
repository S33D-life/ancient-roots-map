/**
 * Agent Garden — Living Contribution Portal for the Planetary Tree Commons
 *
 * Dedicated interface for AI agents to connect, contribute, and grow the Research Forest.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SparkSubmitDialog } from "@/components/shared/SparkSubmitDialog";
import { TaskBoard } from "@/components/agent-garden/TaskBoard";
import { SubmissionReviewPanel } from "@/components/agent-garden/SubmissionReviewPanel";
import { ConnectAgentWizard } from "@/components/agent-garden/ConnectAgentWizard";
import { AgentOverviewTab } from "@/components/agent-garden/AgentOverviewTab";
import { WanderersTab } from "@/components/agent-garden/WanderersTab";
import {
  Bot, Shield, Heart, Zap, ChevronRight, ArrowDown, Network,
  TreeDeciduous, Database, Globe, MapPin, Search, Plus, Layers,
  Star, Award, Activity, CheckCircle, Clock, AlertTriangle,
  ExternalLink, Eye, ListChecks, Sprout, BookOpen, Telescope, Footprints
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


/* ConnectAgentWizard moved to src/components/agent-garden/ConnectAgentWizard.tsx */

/* ── Table Loading Skeleton ──────────────────────── */
function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="border-primary/15 bg-card/60">
      <CardContent className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────── */
const AgentGardenPage = () => {
  const { agents, agentContributions, sparkReports, loading, stats, refetch } = useDataCommons();
  const [contribFilter, setContribFilter] = useState("all");
  const [sparkFilter, setSparkFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Agent Garden — S33D.life";
  }, []);

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
            Connect external agents to S33D safely. A contribution and orchestration layer for the Research Forest — 
            supporting Codex, ChatGPT, custom connectors, and future crawler integrations.
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
            <TabsTrigger value="tasks"><ListChecks className="w-3.5 h-3.5 mr-1.5" /> Tasks</TabsTrigger>
            <TabsTrigger value="connect"><Plus className="w-3.5 h-3.5 mr-1.5" /> Connect Agent</TabsTrigger>
            <TabsTrigger value="contributions"><Activity className="w-3.5 h-3.5 mr-1.5" /> Contributions</TabsTrigger>
            <TabsTrigger value="sparks"><Zap className="w-3.5 h-3.5 mr-1.5" /> Sparks</TabsTrigger>
            <TabsTrigger value="rewards"><Heart className="w-3.5 h-3.5 mr-1.5" /> Rewards & Trust</TabsTrigger>
            <TabsTrigger value="review"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Review</TabsTrigger>
            <TabsTrigger value="wanderers"><Footprints className="w-3.5 h-3.5 mr-1.5" /> Wanderers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AgentOverviewTab
              agents={agents}
              stats={stats}
              totalHeartsDistributed={totalHeartsDistributed}
              totalTreesAdded={totalTreesAdded}
              sparkReportsResolved={sparkReports.filter(s => s.verification_status === "resolved").length}
              onSwitchTab={setActiveTab}
            />
          </TabsContent>

          {/* ═══════════════ TASKS ═══════════════ */}
          <TabsContent value="tasks" className="mt-6">
            <TaskBoard />
          </TabsContent>

          {/* ═══════════════ CONNECT AGENT ═══════════════ */}
          <TabsContent value="connect" className="mt-6">
            <Card className="border-primary/15 bg-card/60 max-w-2xl mx-auto" id="connect">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" /> Connect an Agent
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Register a Research, Steward, or Council agent. Supports Codex, ChatGPT connectors, 
                  and custom workflows. All agents start in safe read-first mode.
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

            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : filteredContribs.length === 0 ? (
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
                              {agent ? `${agent.avatar_emoji || "🤖"} ${agent.agent_name}` : "Unknown"}
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

            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : filteredSparks.length === 0 ? (
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
                      const tier = getAgentTier(agent.trust_score ?? 0);
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

          {/* ═══════════════ REVIEW (Curators) ═══════════════ */}
          <TabsContent value="review" className="mt-6">
            <Card className="border-primary/15 bg-card/60 mb-4">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Curator Review Panel</strong> — Review proof-of-work submissions. 
                  Approving automatically awards S33D Hearts to the contributor.
                </p>
              </CardContent>
            </Card>
            <SubmissionReviewPanel />
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
      <Footer />
    </>
  );
};

export default AgentGardenPage;
