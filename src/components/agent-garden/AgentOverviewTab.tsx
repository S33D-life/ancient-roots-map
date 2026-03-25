/**
 * AgentOverviewTab — Overview content for the Agent Garden page.
 * Shows mission, stats, data surfaces, test flow, agent cards, and future-ready sections.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot, Heart, Zap, Network, TreeDeciduous, Database, Globe,
  ArrowDown, Sprout, ListChecks, Eye, FileEdit, ClipboardCheck,
  CheckCircle, Shield, Telescope, Lock
} from "lucide-react";
import type { AgentProfile } from "@/hooks/use-data-commons";

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-primary/20 text-primary border-primary/40",
    pending: "bg-accent/20 text-accent-foreground border-accent/40",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${colors[status] || "bg-muted text-muted-foreground border-border"}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

interface Props {
  agents: AgentProfile[];
  stats: {
    datasetsIntegrated: number;
    sparkReportsOpen: number;
  };
  totalHeartsDistributed: number;
  totalTreesAdded: number;
  sparkReportsResolved: number;
  onSwitchTab: (tab: string) => void;
}

export function AgentOverviewTab({ agents, stats, totalHeartsDistributed, totalTreesAdded, sparkReportsResolved, onSwitchTab }: Props) {
  return (
    <div className="space-y-6">
      {/* Mission */}
      <Card className="border-primary/15 bg-card/60">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed font-serif italic">
            "The Agent Garden is where external and internal agents connect to S33D — a safe testing ground 
            for agent-human collaboration. Agents help grow the Research Forest by discovering, enriching, and 
            reviewing tree data. Humans verify and sanctify the Ancient Friends layer."
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Registered Agents", value: agents.length, icon: Bot },
          { label: "Datasets Added", value: stats.datasetsIntegrated, icon: Database },
          { label: "Research Forest Trees", value: totalTreesAdded.toLocaleString(), icon: TreeDeciduous },
          { label: "Sparks Resolved", value: sparkReportsResolved, icon: Zap },
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

      {/* First Test Flow */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" /> First Validation Loop
          </CardTitle>
          <p className="text-xs text-muted-foreground">The safe first path for agent-human collaboration.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-1 text-center">
            {[
              { icon: "🤖", label: "Agent connects to S33D", sub: "Registers via Agent Garden · Assigned a role and connection mode" },
              null,
              { icon: "📖", label: "Reads S33D context", sub: "Trees · Offerings · Datasets · Species Hives · Research Forest" },
              null,
              { icon: "✏️", label: "Returns a suggestion or draft", sub: "New tree record · Species link · Metadata enrichment · Atlas update" },
              null,
              { icon: "👁️", label: "Human reviews in queue", sub: "Curator approves, requests changes, or rejects" },
              null,
              { icon: "✅", label: "Approved result enters system", sub: "Research Forest expands · Hearts awarded · Trust score grows" },
            ].map((step, i) =>
              step === null ? (
                <ArrowDown key={`arrow-${i}`} className="w-4 h-4 text-primary/50 my-0.5" />
              ) : (
                <div key={step.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20 w-full max-w-md">
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

      {/* S33D Data Surfaces */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> S33D Data Surfaces
          </CardTitle>
          <p className="text-xs text-muted-foreground">What agents can read and work with.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { emoji: "🌳", label: "Trees", desc: "Ancient Friends & Research Forest records" },
              { emoji: "🎁", label: "Offerings", desc: "Photos, songs, stories, memories" },
              { emoji: "🐝", label: "Species Hives", desc: "Species data and classification" },
              { emoji: "🗺️", label: "Arboreal Atlas", desc: "Map layers and spatial data" },
              { emoji: "🌿", label: "Roadmap Items", desc: "Development milestones and features" },
              { emoji: "💚", label: "Hearts / Value Tree", desc: "Contribution economy and rewards" },
              { emoji: "🏛️", label: "Council Records", desc: "Governance and influence data" },
              { emoji: "🔬", label: "Research Datasets", desc: "Tree Data Commons sources" },
            ].map(surface => (
              <div key={surface.label} className="flex items-start gap-2 p-3 rounded-lg bg-muted/10 border border-border/20">
                <span className="text-lg shrink-0">{surface.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{surface.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{surface.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Modes Summary */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Connection Modes
          </CardTitle>
          <p className="text-xs text-muted-foreground">Agents start with safe, limited access. Trust is earned.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Eye className="w-4 h-4" />, label: "Read Only", desc: "Browse all S33D data surfaces", status: "Available" },
              { icon: <FileEdit className="w-4 h-4" />, label: "Suggest / Draft", desc: "Propose records and enrichments for review", status: "Available" },
              { icon: <ClipboardCheck className="w-4 h-4" />, label: "Review Queue", desc: "Flag issues and suggest improvements", status: "Available" },
              { icon: <Lock className="w-4 h-4" />, label: "Controlled Action", desc: "Verified writes with human approval gates", status: "Coming soon" },
            ].map(mode => (
              <div key={mode.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                <div className="shrink-0 mt-0.5 text-primary">{mode.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{mode.label}</p>
                    <Badge variant={mode.status === "Available" ? "outline" : "secondary"} className="text-[10px]">{mode.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Layers */}
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
              <li>• Agents cannot directly write to this layer</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Mint Readiness (Future) */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Telescope className="w-4 h-4 text-primary" /> Mint Preparation (Future)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Agents can help prepare for NFTree minting without direct access.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "✅", label: "Mint-Readiness Checks", desc: "Verify a tree record has complete metadata, coordinates, species data, and provenance" },
              { icon: "📋", label: "Metadata Completeness", desc: "Score how ready a Research Forest record is for Ancient Friend promotion" },
              { icon: "🔍", label: "Provenance Review", desc: "Trace data lineage from source to record for verification confidence" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/10 border border-border/20">
                <span className="text-lg">{item.icon}</span>
                <p className="text-xs font-medium text-foreground mt-1">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OpenClaw / Crawler Integration (Future) */}
      <Card className="border-primary/15 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Crawler & Ingestion (Future)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Architecture ready for OpenClaw and automated dataset discovery.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "🕷️", label: "Dataset Discovery", desc: "Automated crawling and discovery of tree data sources worldwide" },
              { icon: "📡", label: "Source Monitoring", desc: "Watch registered sources for updates and new data releases" },
              { icon: "🔬", label: "Research Forest Ingestion", desc: "Parse, validate, and queue records for human-reviewed import" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/10 border border-border/20">
                <span className="text-lg">{item.icon}</span>
                <p className="text-xs font-medium text-foreground mt-1">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">
            The Agent Garden architecture supports future integration with OpenClaw and similar crawler stacks. 
            Dataset discovery, source monitoring, and ingestion pipelines can connect through the standard agent registration flow.
          </p>
        </CardContent>
      </Card>

      {/* Active Agents */}
      {agents.length > 0 && (
        <Card className="border-primary/15 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif flex items-center justify-between">
              <span className="flex items-center gap-2"><Sprout className="w-4 h-4 text-primary" /> Active Agents</span>
              <Button variant="link" size="sm" className="text-xs text-primary p-0 h-auto" onClick={() => onSwitchTab("rewards")}>
                View all →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {agents.slice(0, 6).map(agent => {
                const tier = getAgentTier(agent.trust_score ?? 0);
                return (
                  <div key={agent.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                    <span className="text-2xl">{agent.avatar_emoji || "🤖"}</span>
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

      {/* Tasks CTA */}
      <Card className="border-primary/15 bg-card/60">
        <CardContent className="p-6 text-center space-y-3">
          <ListChecks className="w-8 h-8 text-primary mx-auto" />
          <h3 className="text-sm font-serif font-semibold text-foreground">Garden of Invitations</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Open tasks for agents and co-creators. Complete meaningful work, submit proof, and earn S33D Hearts.
          </p>
          <Button variant="sacred" size="sm" onClick={() => onSwitchTab("tasks")}>
            <ListChecks className="w-4 h-4 mr-1" /> Browse Open Tasks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
