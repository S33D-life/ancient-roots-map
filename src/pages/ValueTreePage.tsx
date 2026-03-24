import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, TreePine, Sprout, GitBranch,
  ChevronDown, ChevronRight, Clock, Check, Lock,
  Leaf, Sun, Eye, Music, Camera, MapPin, Users, Star,
  Bug, UserPlus, Flame, ArrowRight, Loader2, Crown,
  Wind, HandHeart, Wheat, ArrowLeftRight, Coins, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EconomyOverview = lazy(() => import("@/components/economy/EconomyOverview"));
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
  const tabMap: Record<string, string> = { economy: "overview", earn: "participation", how: "flow", chains: "flow" };
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
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="text-5xl block mb-3">🌳</span>
          <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-foreground mb-2">
            The S33D Value Tree
          </h1>
          <p className="text-muted-foreground font-serif max-w-lg mx-auto text-sm leading-relaxed">
            A living current of value — from breath to encounter to harvest. S33D Hearts are the commons currency, earned through stewardship, not speculation.
          </p>
        </motion.div>

        {/* Token legend */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: "❤️", label: "S33D Hearts", sub: "Commons currency", color: "hsl(0, 65%, 55%)" },
            { icon: "🌿", label: "Species Hearts", sub: "Fractal / hive", color: "hsl(var(--primary))" },
            { icon: "🛡️", label: "Influence", sub: "Governance voice", color: "hsl(42, 80%, 50%)" },
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
              <Wind className="w-3.5 h-3.5" /> Living Flow
            </TabsTrigger>
            <TabsTrigger value="participation" className="font-serif text-xs tracking-wider gap-1.5">
              <HandHeart className="w-3.5 h-3.5" /> Participation
            </TabsTrigger>
            <TabsTrigger value="origin-staff" className="font-serif text-xs tracking-wider gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Origin Staff
            </TabsTrigger>
            <TabsTrigger value="vault" className="font-serif text-xs tracking-wider gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Vault
            </TabsTrigger>
            <TabsTrigger value="philosophy" className="font-serif text-xs tracking-wider gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Philosophy
            </TabsTrigger>
          </TabsList>

          {/* ═══════ OVERVIEW ═══════ */}
          <TabsContent value="overview">
            <Suspense fallback={<TabLoader />}>
              <div className="space-y-8">
                <LivingValueCycle />

                {currentUserId && <YourPlaceInCycle userId={currentUserId} />}

                <EconomyOverview />

                {/* System links */}
                <div className="flex flex-wrap gap-3">
                  <SystemLink to="/map" label="Ancient Friends Map" icon={<MapPin className="w-3.5 h-3.5 text-primary" />} />
                  <SystemLink to="/library/staff-room" label="Staff Room" icon={<Crown className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                  <SystemLink to="/council-of-life" label="Council of Life" icon={<Users className="w-3.5 h-3.5 text-primary" />} />
                  <SystemLink to="/dashboard?tab=vault" label="Heartwood Vault" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                </div>

                <Suspense fallback={null}>
                  <EcosystemMomentum showDiscovery />
                </Suspense>
              </div>
            </Suspense>
          </TabsContent>

          {/* ═══════ LIVING FLOW ═══════ */}
          <TabsContent value="flow">
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-lg font-serif text-foreground">The Living Value Cycle</h2>
                <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto leading-relaxed">
                  Every action in the S33D ecosystem follows this living cycle — from the first seed planted to the breath that starts it all again.
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

              {/* Hive routing note */}
              <Card className="bg-card/40 backdrop-blur border-border/30">
                <CardContent className="p-5">
                  <h4 className="text-xs font-serif text-foreground mb-2 uppercase tracking-wider">Hive Routing</h4>
                  <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                    When you interact with a tree, Species Hearts are minted for the tree's botanical family.
                    An Oak tree mints Oak Hearts. A Pine mints Pine Hearts. Each hive accumulates its own fractal economy.
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
                <h2 className="text-lg font-serif text-foreground">How Do I Engage?</h2>
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

              {/* Firefly detail */}
              <Card className="bg-card/40 backdrop-blur border-primary/15">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">✦</span>
                    <h4 className="text-xs font-serif text-foreground uppercase tracking-wider">Firefly Contributions</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-serif leading-relaxed mb-3">
                    Use the floating <span className="text-primary">Firefly ✦</span> button to contribute. Validated contributions earn Hearts:
                  </p>
                  <div className="space-y-1.5 text-[11px] font-serif">
                    {[
                      ["🐞 Valid bug report", "+3–20 ❤️"],
                      ["✨ Accepted UX refinement", "+5–15 ❤️"],
                      ["💡 High-value insight", "variable ❤️"],
                      ["🌳 Verified tree suggestion", "+5–25 ❤️"],
                    ].map(([l, r]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-muted-foreground">{l}</span>
                        <span style={{ color: "hsl(0, 65%, 55%)" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Coming soon value chains */}
              <div className="space-y-3">
                <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">Coming Soon</h3>
                <p className="text-[10px] text-muted-foreground font-serif">
                  Future participation pathways being prepared for Chapter 3 and beyond.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Staking at Ancient Friends", icon: <Lock className="w-4 h-4" /> },
                    { label: "NFT Participation", icon: <Star className="w-4 h-4" /> },
                    { label: "Nurturing Saplings", icon: <Sprout className="w-4 h-4" /> },
                    { label: "Seed Saving & Sharing", icon: <Leaf className="w-4 h-4" /> },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border/30 bg-card/20 p-3 flex items-center gap-2.5"
                    >
                      <div className="text-muted-foreground/50">{item.icon}</div>
                      <span className="text-[11px] font-serif text-muted-foreground">{item.label}</span>
                      <Badge variant="outline" className="text-[8px] font-serif ml-auto border-muted-foreground/30 text-muted-foreground/60">
                        Soon
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════ ORIGIN STAFF ═══════ */}
          <TabsContent value="origin-staff">
            <Suspense fallback={<TabLoader />}>
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5">
                    <Crown className="w-3 h-3" style={{ color: "hsl(42, 85%, 55%)" }} />
                    <span className="text-[9px] font-serif text-foreground tracking-widest uppercase">The Origin Layer</span>
                  </div>
                  <h2 className="text-lg font-serif text-foreground">Founding Circle & Origin Staffs</h2>
                  <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto leading-relaxed">
                    The 36 handcrafted walking staffs form the root system of the S33D forest.
                    Each founding patron seeds the living economy and anchors the first layer of the value tree.
                  </p>
                </div>

                {/* Patron value card */}
                <StaffPatronValueCard />

                {/* Founding Staff Roots visual */}
                <FoundingStaffRoots />

                {/* Flow of value through the system */}
                <FlowOfValue />

                {/* Connections */}
                <Card className="bg-card/40 backdrop-blur border-border/30">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="text-xs font-serif text-foreground uppercase tracking-wider">How Origin Staffs Connect</h4>
                    <div className="space-y-3 text-[11px] font-serif text-muted-foreground leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-base">🪄</span>
                        <p><span className="text-foreground">Staff → NFTrees:</span> Each staff can generate unique NFTree artworks, creating visual lineage from the founding moment.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-base">🗺️</span>
                        <p><span className="text-foreground">Staff → Mapping:</span> Trees mapped by a staff patron carry a Founding Mapper badge, visible on the tree page.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-base">💰</span>
                        <p><span className="text-foreground">Staff → Value:</span> Patron donations flow into the treasury, funding development, accelerator programs, and community rewards.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <SystemLink to="/library/staff-room" label="Visit Staff Room" icon={<Crown className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                      <SystemLink to="/patron-offering" label="Patron Offering" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Suspense>
          </TabsContent>

          {/* ═══════ VAULT ═══════ */}
          <TabsContent value="vault">
            <Suspense fallback={<TabLoader />}>
              <div className="space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-lg font-serif text-foreground">Your Heartwood Vault</h2>
                  <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto">
                    The inner chamber where encounters become lasting value. Every action in Flow and Participation appears here.
                  </p>
                </div>

                {currentUserId ? (
                  <>
                    <YourRootsPanel userId={currentUserId} />

                    <div id="ledger">
                      <VaultHeartLedger userId={currentUserId} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">Recent Heart Activity</h3>
                      <ActivityFeed limit={8} compact />
                    </div>
                  </>
                ) : (
                  <Card className="bg-card/40 backdrop-blur border-border/30">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm font-serif text-muted-foreground mb-4">
                        Sign in to see your personal Heartwood Vault.
                      </p>
                      <Button variant="outline" className="font-serif" onClick={() => navigate("/auth")}>
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* CTA */}
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    className="font-serif gap-2 border-primary/30 hover:border-primary/50"
                    onClick={() => navigate("/dashboard?tab=vault")}
                  >
                    <Heart className="w-4 h-4" style={{ color: "hsl(0, 65%, 55%)" }} />
                    Open Heartwood Vault
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Suspense>
          </TabsContent>

          {/* ═══════ PHILOSOPHY ═══════ */}
          <TabsContent value="philosophy">
            <Suspense fallback={<TabLoader />}>
              <div className="space-y-8">
                <EncounterEconomyManifesto />

                <Card className="bg-card/40 backdrop-blur border-border/30">
                  <CardContent className="p-6 space-y-4">
                    <h4 className="text-sm font-serif text-foreground">Long-Term Vision</h4>
                    <div className="space-y-3 text-[11px] font-serif text-muted-foreground leading-relaxed">
                      <p>
                        S33D Hearts are designed for a 60-year emission cycle. This is not a sprint — it is a forest growing across generations.
                        The 777,777,777 total supply is allocated through the Distribution Compass, ensuring every branch of the ecosystem receives nourishment.
                      </p>
                      <p>
                        The economy distinguishes between active stewardship (mapping, offerings, council participation) and future participation layers
                        (staking, NFT holding, sapling nurturing) using a temporal gating model. Nothing is rushed. Everything grows in its season.
                      </p>
                      <p>
                        At its heart, the Encounter Economy is a rejection of extraction. Value begins with breath, deepens through encounter,
                        and circulates through the commons. Hearts are not mined — they are cultivated.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* System connections */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <SystemLink to="/golden-dream" label="yOur Golden Dream" icon={<Star className="w-3.5 h-3.5" style={{ color: "hsl(42, 80%, 50%)" }} />} />
                  <SystemLink to="/how-hearts-work" label="How Hearts Work" icon={<Heart className="w-3.5 h-3.5" style={{ color: "hsl(0, 65%, 55%)" }} />} />
                </div>
              </div>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default ValueTreePage;
