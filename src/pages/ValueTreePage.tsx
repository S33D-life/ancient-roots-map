import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, TreePine, Sprout, GitBranch,
  ChevronDown, ChevronRight, Clock, Check, Lock,
  Leaf, Sun, Eye, Music, Camera, MapPin, Users, Star,
  Bug, UserPlus, Flame, ArrowRight, Loader2, Crown,
  Wind, HandHeart, Wheat, ArrowLeftRight, Coins, Shield, Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EconomyOverview = lazy(() => import("@/components/economy/EconomyOverview"));
const EconomyCompass = lazy(() => import("@/components/economy/EconomyCompass"));
const YourRootsPanel = lazy(() => import("@/components/economy/YourRootsPanel"));
const LivingValueCycle = lazy(() => import("@/components/economy/LivingValueCycle"));
const YourPlaceInCycle = lazy(() => import("@/components/economy/YourPlaceInCycle"));
const VaultHeartLedger = lazy(() => import("@/components/dashboard/vault/VaultHeartLedger"));
const ActivityFeed = lazy(() => import("@/components/ActivityFeed"));
const EcosystemMomentum = lazy(() => import("@/components/EcosystemMomentum"));
const FoundingStaffRoots = lazy(() => import("@/components/economy/FoundingStaffRoots"));
const StaffPatronValueCard = lazy(() => import("@/components/economy/StaffPatronValueCard"));
const FlowOfValue = lazy(() => import("@/components/economy/FlowOfValue"));
const EncounterEconomyManifesto = lazy(() => import("@/components/economy/EncounterEconomyManifesto"));
const PublicGoodsFunding = lazy(() => import("@/components/economy/PublicGoodsFunding"));

/* ─── Shared loading fallback ──────────────────────────────── */
const TabLoader = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

/* ─── System link button ───────────────────────────────────── */
const SystemLink = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm text-xs font-serif text-foreground hover:border-primary/30 hover:bg-card/50 transition-all"
  >
    {icon}
    <span>{label}</span>
    <ArrowRight className="w-3 h-3 text-muted-foreground" />
  </Link>
);

/* ─── Flow step for the Living Flow tab ────────────────────── */
interface FlowStepData {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  detail: string;
  links?: { label: string; to: string }[];
}

const LIVING_FLOW_STEPS: FlowStepData[] = [
  {
    icon: <Sprout className="w-5 h-5" />,
    label: "Seeds",
    description: "3 seeds planted daily — each a small act of attention.",
    color: "hsl(120 50% 45%)",
    detail: "Each seed generates 33 Hearts when collected. Seeds are planted near trees you encounter on the map.",
    links: [{ label: "Plant seeds on the map", to: "/map" }],
  },
  {
    icon: <Music className="w-5 h-5" />,
    label: "Offerings",
    description: "Gift a photo, poem, song, or story to an Ancient Friend.",
    color: "hsl(30 70% 50%)",
    detail: "Offerings deepen your relationship with a tree and earn S33D Hearts and Species Hearts. Each offering enriches the tree's living record.",
    links: [{ label: "Make an offering", to: "/map" }],
  },
  {
    icon: <Eye className="w-5 h-5" />,
    label: "Encounter",
    description: "Meet the Ancient Friends — presence is the seed of all value.",
    color: "hsl(200 40% 60%)",
    detail: "Check-ins, 333-second presence sessions, and map explorations all count as encounters. Every visit earns S33D Hearts and Species Hearts.",
    links: [
      { label: "Open the map", to: "/map" },
      { label: "Browse tree stories", to: "/library/gallery" },
    ],
  },
  {
    icon: <Heart className="w-5 h-5" />,
    label: "Hearts",
    description: "S33D Hearts, Species Hearts, and Influence flow from every action.",
    color: "hsl(0 65% 55%)",
    detail: "S33D Hearts are the commons currency. Species Hearts route to botanical hives. Influence is your governance voice — soulbound and earned through curation.",
  },
  {
    icon: <Wheat className="w-5 h-5" />,
    label: "Accumulation",
    description: "Hearts accumulate in your Heartwood Vault — a living ledger of your journey.",
    color: "hsl(42 80% 50%)",
    detail: "Every tree accumulates Hearts toward a Windfall at 144 Hearts. Your personal vault tracks all earnings, milestones, and seed blooms.",
    links: [{ label: "Open Heartwood Vault", to: "/dashboard?tab=vault" }],
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    label: "Distribution",
    description: "Hearts flow through four branches: IGO, Accelerator, Tr33 Loto, Life Exchange.",
    color: "hsl(280 50% 55%)",
    detail: "The 360° Distribution Compass governs allocation. Species Hearts route to hives. The 60-year emission curve ensures long-term sustainability.",
  },
  {
    icon: <ArrowLeftRight className="w-5 h-5" />,
    label: "Cycle Reset",
    description: "The breath continues. Value circulates back into encounter.",
    color: "hsl(150 50% 45%)",
    detail: "This is a living cycle, not a linear extraction. Hearts spent on creative acts — NFTrees, room customisation, asset unlocks — feed energy back into the commons.",
  },
];

const LivingFlowStep = ({ step, index, isLast }: { step: FlowStepData; index: number; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative"
    >
      {/* Vertical connector */}
      {!isLast && (
        <div
          className="absolute left-5 top-[3.5rem] w-px h-[calc(100%-1rem)]"
          style={{ background: `linear-gradient(180deg, ${step.color}40, transparent)` }}
        />
      )}

      <div
        className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-all cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-4 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 mt-0.5"
            style={{ borderColor: step.color, background: `${step.color}15`, color: step.color }}
          >
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-serif text-foreground">{step.label}</h4>
              <span className="text-[9px] font-serif text-muted-foreground/50 tabular-nums">{index + 1}/7</span>
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{step.description}</p>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pl-[3.75rem] space-y-3">
                <p className="text-[11px] font-serif text-muted-foreground/80 leading-relaxed">
                  {step.detail}
                </p>
                {step.links && (
                  <div className="flex flex-wrap gap-2">
                    {step.links.map((l) => (
                      <Link
                        key={l.to + l.label}
                        to={l.to}
                        className="inline-flex items-center gap-1.5 text-[10px] font-serif text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowRight className="w-3 h-3" /> {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ─── Reward reference card (consolidated) ─────────────────── */
const RewardReference = () => (
  <Card className="bg-card/40 backdrop-blur border-border/30">
    <CardContent className="p-5">
      <h4 className="text-xs font-serif text-foreground mb-4 uppercase tracking-wider">Heart Rewards at a Glance</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span>❤️</span>
            <span className="text-xs font-serif text-foreground">S33D Hearts</span>
          </div>
          {[
            ["Map a tree", "+10"],
            ["Check-in", "+1"],
            ["Offering", "+2"],
            ["Council", "+5"],
            ["Seed bloom", "+33"],
          ].map(([a, r]) => (
            <div key={a} className="flex justify-between text-[11px] font-serif">
              <span className="text-muted-foreground">{a}</span>
              <span style={{ color: "hsl(0, 65%, 55%)" }}>{r}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span>🌿</span>
            <span className="text-xs font-serif text-foreground">Species Hearts</span>
          </div>
          {[
            ["Map tree", "+3"],
            ["Check-in", "+1"],
            ["Quality offering", "+2"],
            ["Complete map", "+5"],
          ].map(([a, r]) => (
            <div key={a} className="flex justify-between text-[11px] font-serif">
              <span className="text-muted-foreground">{a}</span>
              <span className="text-primary">{r}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span>🛡️</span>
            <span className="text-xs font-serif text-foreground">Influence</span>
          </div>
          {[
            ["Verify tree", "+2"],
            ["Add metadata", "+1-3"],
            ["Resolve dupes", "+3"],
            ["Quality media", "+1"],
          ].map(([a, r]) => (
            <div key={a} className="flex justify-between text-[11px] font-serif">
              <span className="text-muted-foreground">{a}</span>
              <span style={{ color: "hsl(42, 80%, 50%)" }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ─── Participation action card ────────────────────────────── */
interface ParticipationAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  reward: string;
  link: string;
  category: string;
}

const PARTICIPATION_ACTIONS: ParticipationAction[] = [
  { id: "map", label: "Map a Tree", description: "Add an Ancient Friend to the living atlas.", icon: <TreePine className="w-5 h-5" />, reward: "+10 ❤️ +3 🌿 +2 🛡️", link: "/add-tree", category: "Growth" },
  { id: "offering", label: "Make an Offering", description: "Gift a photo, poem, song, or story to a tree.", icon: <Music className="w-5 h-5" />, reward: "+2 ❤️ +1 🌿", link: "/map", category: "Care" },
  { id: "council", label: "Attend a Council", description: "Join a Council of Life gathering.", icon: <Users className="w-5 h-5" />, reward: "+5 ❤️ per event", link: "/council-of-life", category: "Council" },
  { id: "presence", label: "333-Second Presence", description: "Complete a mindfulness session with an Ancient Friend.", icon: <Sun className="w-5 h-5" />, reward: "+10 ❤️ +3 🌿", link: "/map", category: "Presence" },
  { id: "curate", label: "Verify or Curate", description: "Confirm species, resolve duplicates, add metadata.", icon: <Eye className="w-5 h-5" />, reward: "+1-5 🛡️", link: "/map", category: "Curation" },
  { id: "firefly", label: "Firefly Contribution", description: "Report bugs, suggest improvements, propose trees.", icon: <Bug className="w-5 h-5" />, reward: "+3-25 ❤️", link: "/bug-garden", category: "Care" },
  { id: "invite", label: "Invite a Wanderer", description: "Share your invite link — earn Hearts when they join.", icon: <UserPlus className="w-5 h-5" />, reward: "+5 ❤️ per referral", link: "/referrals", category: "Growth" },
];

/* ─── Main Page ────────────────────────────────────────────── */

const ValueTreePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabMap: Record<string, string> = { economy: "overview", earn: "participation", how: "flow", chains: "deeper", distribution: "deeper", compass: "deeper", vault: "deeper", philosophy: "deeper", "origin-staff": "deeper" };
  const rawTab = searchParams.get("tab") || "overview";
  const initialTab = tabMap[rawTab] || rawTab;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageShell className="container mx-auto px-4 pb-20 max-w-4xl" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Hero */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🌳</span>
          <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-foreground mb-2">
            The S33D Value Tree
          </h1>
          <p className="text-muted-foreground font-serif max-w-lg mx-auto text-sm leading-relaxed">
            Visit a tree. Leave an offering. Earn hearts. Watch them grow.
          </p>
          <p className="text-muted-foreground/50 font-serif max-w-md mx-auto text-[11px] leading-relaxed mt-1.5 italic">
            S33D Hearts are earned through stewardship, not speculation — a commons currency rooted in care.
          </p>
        </div>

        {/* Token legend — simplified labels */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: "❤️", label: "S33D Hearts", sub: "Earned from every action", color: "hsl(0, 65%, 55%)" },
            { icon: "🌿", label: "Species Hearts", sub: "Routed to botanical hives", color: "hsl(var(--primary))" },
            { icon: "🛡️", label: "Influence", sub: "Earned through curation", color: "hsl(42, 80%, 50%)" },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
              <span className="text-lg">{t.icon}</span>
              <div>
                <p className="text-xs font-serif" style={{ color: t.color }}>{t.label}</p>
                <p className="text-[9px] text-muted-foreground font-serif">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/30 border border-border/50 mb-8 flex-wrap h-auto gap-1 p-1.5 w-full justify-start">
            <TabsTrigger value="overview" className="font-serif text-xs tracking-wider gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="flow" className="font-serif text-xs tracking-wider gap-1.5">
              <Wind className="w-3.5 h-3.5" /> How It Works
            </TabsTrigger>
            <TabsTrigger value="participation" className="font-serif text-xs tracking-wider gap-1.5">
              <HandHeart className="w-3.5 h-3.5" /> Participate
            </TabsTrigger>
            <TabsTrigger value="deeper" className="font-serif text-xs tracking-wider gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Deeper
            </TabsTrigger>
          </TabsList>

          {/* ═══════ OVERVIEW ═══════ */}
          <TabsContent value="overview">
            <Suspense fallback={<TabLoader />}>
              <div className="space-y-8">
                <LivingValueCycle />

                {currentUserId && <YourPlaceInCycle userId={currentUserId} />}

                <EconomyOverview />

                {/* Contextual system links — attached to purpose */}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-serif">Continue the journey</p>
                  <div className="flex flex-wrap gap-3">
                    <SystemLink to="/map" label="Visit an Ancient Friend" icon={<MapPin className="w-3.5 h-3.5 text-primary" />} />
                    <SystemLink to="/library/gallery" label="Browse Tree Stories" icon={<TreePine className="w-3.5 h-3.5 text-primary" />} />
                    <SystemLink to="/library/staff-room" label="Staff Room — Ceremonial Origins" icon={<Crown className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                    <SystemLink to="/vault" label="Vault — Your Hearts & Activity" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                  </div>
                </div>

                <Suspense fallback={null}>
                  <EcosystemMomentum showDiscovery />
                </Suspense>
              </div>
            </Suspense>
          </TabsContent>

          {/* ═══════ COMPASS (hidden, kept for deep-link compat) ═══════ */}
          <TabsContent value="compass">
            <Suspense fallback={<TabLoader />}>
              <EconomyCompass />
            </Suspense>
          </TabsContent>

          {/* ═══════ LIVING FLOW (How It Works) ═══════ */}
          <TabsContent value="flow">
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-lg font-serif text-foreground">How Value Flows</h2>
                <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto leading-relaxed">
                  Every action follows this cycle — from the first seed to the breath that starts it again.
                </p>
              </div>

              <div className="space-y-3">
                {LIVING_FLOW_STEPS.map((step, i) => (
                  <LivingFlowStep
                    key={step.label}
                    step={step}
                    index={i}
                    isLast={i === LIVING_FLOW_STEPS.length - 1}
                  />
                ))}
              </div>

              {/* Consolidated reward reference */}
              <div className="pt-4">
                <RewardReference />
              </div>

              {/* Hive routing note */}
              <Card className="bg-card/40 backdrop-blur border-border/30">
                <CardContent className="p-5">
                  <h4 className="text-xs font-serif text-foreground mb-2 uppercase tracking-wider">Hive Routing</h4>
                  <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                    When you interact with a tree, Species Hearts are minted for the tree's botanical family.
                    An Oak tree mints Oak Hearts. A Pine mints Pine Hearts.
                    <Link to="/hives" className="text-primary hover:underline ml-1">Browse all hives →</Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════ PARTICIPATION ═══════ */}
          <TabsContent value="participation">
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-lg font-serif text-foreground">Ways to Participate</h2>
                <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto">
                  Every action grows the tree. Here's what you can do and what it generates.
                </p>
              </div>

              <div className="space-y-3">
                {PARTICIPATION_ACTIONS.map((action, i) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => navigate(action.link)}
                    >
                      <div className="p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/40 text-primary shrink-0 mt-0.5">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-serif text-foreground mb-0.5">{action.label}</h4>
                          <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{action.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] font-serif text-primary/70">{action.reward}</span>
                            <span className="text-[10px] font-serif text-muted-foreground/50 uppercase tracking-wider">{action.category}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-3" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Windfall progress */}
              <Card className="bg-card/40 backdrop-blur border-border/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4" style={{ color: "hsl(42, 80%, 50%)" }} />
                    <h4 className="text-xs font-serif text-foreground uppercase tracking-wider">Windfall Progress</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                    Every tree accumulates Hearts toward a <span style={{ color: "hsl(42, 80%, 50%)" }}>Windfall</span> at 144 Hearts.
                    Keep mapping trees and making offerings to trigger the next community windfall.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════ DEEPER ═══════ */}
          <TabsContent value="deeper">
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-lg font-serif text-foreground">Deeper into the Roots</h2>
                <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto leading-relaxed">
                  The mechanics, philosophy, and founding layer beneath the living economy.
                </p>
              </div>


              {/* Distribution Compass */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 transition-all">
                  <Compass className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-serif text-foreground flex-1 text-left">Distribution Compass</span>
                  <span className="text-[9px] font-serif text-muted-foreground/50">777M Hearts across 4 branches</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-3">
                    <Suspense fallback={<TabLoader />}>
                      <EconomyCompass />
                    </Suspense>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Origin Staff */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 transition-all">
                  <Crown className="w-4 h-4 shrink-0" style={{ color: "hsl(42, 85%, 55%)" }} />
                  <span className="text-sm font-serif text-foreground flex-1 text-left">Origin Staffs & Founding Circle</span>
                  <span className="text-[9px] font-serif text-muted-foreground/50">36 staffs</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-3 space-y-6">
                    <Suspense fallback={<TabLoader />}>
                      <StaffPatronValueCard />
                      <FoundingStaffRoots />
                      <FlowOfValue />
                      <div className="flex flex-wrap gap-3">
                        <SystemLink to="/library/staff-room" label="Visit Staff Room" icon={<Crown className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                        <SystemLink to="/patron-offering" label="Patron Offering" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                      </div>
                    </Suspense>
                  </div>
                </CollapsibleContent>
              </Collapsible>

               {/* Commons Nourishment */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 transition-all">
                  <span className="text-base shrink-0">🌧️</span>
                  <span className="text-sm font-serif text-foreground flex-1 text-left">Commons Nourishment</span>
                  <span className="text-[9px] font-serif text-muted-foreground/50">External support flowing inward</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-3">
                    <Suspense fallback={<TabLoader />}>
                      <PublicGoodsFunding />
                    </Suspense>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Philosophy */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 transition-all">
                  <Leaf className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-serif text-foreground flex-1 text-left">Philosophy & Vision</span>
                  <span className="text-[9px] font-serif text-muted-foreground/50">The encounter economy</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-3 space-y-6">
                    <Suspense fallback={<TabLoader />}>
                      <EncounterEconomyManifesto />
                      <Card className="bg-card/40 backdrop-blur border-border/30">
                        <CardContent className="p-5 space-y-3 text-[11px] font-serif text-muted-foreground leading-relaxed">
                          <p>
                            S33D Hearts are designed for a 60-year emission cycle. This is not a sprint — it is a forest growing across generations.
                          </p>
                          <p>
                            At its heart, the Encounter Economy is a rejection of extraction. Value begins with breath, deepens through encounter,
                            and circulates through the commons. Hearts are not mined — they are cultivated.
                          </p>
                        </CardContent>
                      </Card>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <SystemLink to="/golden-dream" label="yOur Golden Dream" icon={<Star className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                        <SystemLink to="/how-hearts-work" label="How Hearts Work" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                      </div>
                    </Suspense>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Integrity safeguards */}
              <Card className="bg-card/40 backdrop-blur border-border/30">
                <CardContent className="p-5">
                  <h4 className="text-xs font-serif text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Integrity Safeguards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Daily rate limits per tree per user",
                      "Verification tiers for higher rewards",
                      "Community review for curation actions",
                      "Anti-farming cooldown periods",
                    ].map(s => (
                      <div key={s} className="flex items-start gap-2 text-[11px] font-serif text-muted-foreground">
                        <Check className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>
      <Footer />
    </div>
  );
};

export default ValueTreePage;
