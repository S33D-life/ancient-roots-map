import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Shield, TreePine, Sprout, GitBranch, Vote,
  ChevronDown, ChevronRight, Clock, Check, Zap, Lock,
  Leaf, Sun, Eye, Music, Camera, MapPin, Users, Star,
  Bug, UserPlus, Megaphone, Flame, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartBalance } from "@/hooks/use-heart-balance";

/* ─── Value-node data model ────────────────────────────────── */

interface RewardOutput {
  token: "s33d" | "species" | "influence";
  amount: string; // e.g. "1-3" or "1"
  note?: string;
}

interface ValueNode {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  rewards: RewardOutput[];
  cooldown?: string;
  verification?: string;
  children?: ValueNode[];
  status?: "active" | "experimental" | "seasonal" | "coming_soon";
  /** Deep-link to the action that earns this reward */
  actionLink?: string;
}

interface ProposalNode {
  id: string;
  title: string;
  description: string;
  proposedRewards: RewardOutput[];
  rationale: string;
  votes: number;
  state: "proposed" | "under_review" | "approved" | "archived";
}

/* ─── Static data (the living reward tree) ─────────────────── */

const ROOT_ACTIONS: ValueNode[] = [
  {
    id: "checkin",
    label: "Tree Check-in",
    description: "Visit an Ancient Friend and log your presence.",
    icon: <MapPin className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "1" },
      { token: "species", amount: "1", note: "Based on tree hive" },
    ],
    cooldown: "3 per tree per day",
    verification: "Self-reported",
    actionLink: "/map",
    children: [
      {
        id: "checkin-offering",
        label: "Check-in with Offering",
        description: "Add a photo, poem, or voice note during check-in.",
        icon: <Camera className="w-4 h-4" />,
        rewards: [
          { token: "s33d", amount: "2" },
          { token: "species", amount: "2" },
          { token: "influence", amount: "1", note: "Quality media bonus" },
        ],
        cooldown: "3 per tree per day",
        verification: "Content quality check",
        actionLink: "/map",
      },
    ],
  },
  {
    id: "mapping",
    label: "Map a New Tree",
    description: "Add a verified Ancient Friend to the atlas.",
    icon: <TreePine className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "10" },
      { token: "species", amount: "3", note: "Higher for complete data" },
      { token: "influence", amount: "2", note: "If verified or high-quality" },
    ],
    verification: "Location + species + photo recommended",
    actionLink: "/add-tree",
    children: [
      {
        id: "mapping-complete",
        label: "Complete Mapping",
        description: "Include photo, estimated age, description, and species confidence.",
        icon: <Check className="w-4 h-4" />,
        rewards: [
          { token: "s33d", amount: "15" },
          { token: "species", amount: "5" },
          { token: "influence", amount: "3" },
        ],
        verification: "All fields completed",
        actionLink: "/add-tree",
      },
    ],
  },
  {
    id: "offering",
    label: "Make an Offering",
    description: "Gift a photo, poem, song, story, or voice note to a tree.",
    icon: <Music className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "1-5" },
      { token: "species", amount: "1" },
    ],
    actionLink: "/map",
    children: [
      {
        id: "offering-quality",
        label: "High-Quality Offering",
        description: "Offering that enriches hive library quality.",
        icon: <Star className="w-4 h-4" />,
        rewards: [
          { token: "s33d", amount: "5" },
          { token: "species", amount: "2" },
          { token: "influence", amount: "1" },
        ],
        verification: "Minimum content threshold",
        actionLink: "/map",
      },
    ],
  },
  {
    id: "curation",
    label: "Curation Action",
    description: "Improve tree records, verify data, or curate hive content.",
    icon: <Eye className="w-4 h-4" />,
    rewards: [
      { token: "influence", amount: "1-5", note: "Based on action depth" },
    ],
    cooldown: "Rate-limited",
    verification: "Peer review for higher tiers",
    actionLink: "/map",
    children: [
      {
        id: "curation-verify",
        label: "Verify Tree Record",
        description: "Confirm species, location, or age data.",
        icon: <Check className="w-4 h-4" />,
        rewards: [{ token: "influence", amount: "2" }],
        actionLink: "/map",
      },
      {
        id: "curation-metadata",
        label: "Add Missing Metadata",
        description: "Species, accessibility tags, story notes.",
        icon: <Leaf className="w-4 h-4" />,
        rewards: [{ token: "influence", amount: "1-3" }],
        actionLink: "/map",
      },
      {
        id: "curation-resolve",
        label: "Resolve Duplicates",
        description: "Identify and merge duplicate tree entries.",
        icon: <GitBranch className="w-4 h-4" />,
        rewards: [{ token: "influence", amount: "3" }],
        verification: "Curator approval",
        actionLink: "/map",
      },
    ],
  },
  {
    id: "species-confirm",
    label: "Species Confirmation",
    description: "Community-confirm a tree's species identity.",
    icon: <Sprout className="w-4 h-4" />,
    rewards: [
      { token: "species", amount: "1" },
      { token: "influence", amount: "1" },
    ],
    verification: "Cross-referenced by multiple wanderers",
    actionLink: "/map",
  },
];

const ADVANCED_CHAINS: ValueNode[] = [
  {
    id: "multi-tree",
    label: "Multi-Tree Exploration",
    description: "Visit 3+ trees in a single session for a journey bonus.",
    icon: <GitBranch className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "5 bonus" },
      { token: "species", amount: "3 bonus" },
    ],
    status: "experimental",
    verification: "GPS + time-gap validation",
  },
  {
    id: "documentation",
    label: "Tree Media Documentation",
    description: "Capture seasonal photos, audio recordings, or field notes.",
    icon: <Camera className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "3-8" },
      { token: "species", amount: "2-5" },
      { token: "influence", amount: "1-2" },
    ],
    status: "active",
  },
  {
    id: "meditation",
    label: "Silent Tree Meditation",
    description: "30-minute silent presence session at a tree. Requires phone inactivity.",
    icon: <Sun className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "10" },
      { token: "species", amount: "5" },
    ],
    status: "coming_soon",
    verification: "Motion sensor + time validation",
    cooldown: "1 per day",
  },
  {
    id: "hive-radio",
    label: "Curate Hive Radio Set",
    description: "Assemble a playlist from offerings within a species hive.",
    icon: <Music className="w-4 h-4" />,
    rewards: [
      { token: "influence", amount: "3-5" },
    ],
    status: "active",
    verification: "Minimum 5 tracks, peer reviewed",
  },
  {
    id: "seasonal-quest",
    label: "Seasonal Quest",
    description: "Participate in time-limited ecological observation challenges.",
    icon: <Leaf className="w-4 h-4" />,
    rewards: [
      { token: "s33d", amount: "20 bonus" },
      { token: "species", amount: "10 bonus" },
      { token: "influence", amount: "5" },
    ],
    status: "seasonal",
    cooldown: "Per season",
  },
];

const PROPOSALS: ProposalNode[] = [
  {
    id: "prop-1",
    title: "Birdsong Identification Bonus",
    description: "Award Species Hearts when birdsong recordings identify species tied to the tree's hive.",
    proposedRewards: [{ token: "species", amount: "2" }, { token: "influence", amount: "1" }],
    rationale: "Encourages ecological data collection and enriches hive biodiversity records.",
    votes: 12,
    state: "under_review",
  },
  {
    id: "prop-2",
    title: "Story Keeper Milestone",
    description: "Award a one-time Influence bonus for contributing 10+ stories to a single hive.",
    proposedRewards: [{ token: "influence", amount: "10" }],
    rationale: "Incentivizes deep narrative engagement with specific lineages.",
    votes: 8,
    state: "proposed",
  },
  {
    id: "prop-3",
    title: "Elder Tree Guardian",
    description: "Monthly S33D Heart drip for verified caretakers of trees over 500 years old.",
    proposedRewards: [{ token: "s33d", amount: "5/month" }],
    rationale: "Rewards ongoing stewardship of irreplaceable ancient beings.",
    votes: 23,
    state: "approved",
  },
];

/* ─── Token badge component ────────────────────────────────── */

const TokenBadge = ({ token, amount, note }: RewardOutput) => {
  const config = {
    s33d: { label: "S33D Hearts", color: "hsl(0, 65%, 55%)", icon: "❤️" },
    species: { label: "Species Hearts", color: "hsl(var(--primary))", icon: "🌿" },
    influence: { label: "Influence", color: "hsl(42, 80%, 50%)", icon: "🛡️" },
  }[token];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-serif border"
      style={{ borderColor: `${config.color}40`, color: config.color }}
    >
      <span>{config.icon}</span>
      <span className="font-bold tabular-nums">+{amount}</span>
      {note && <span className="text-muted-foreground text-[9px]">({note})</span>}
    </span>
  );
};

/* ─── Expandable tree node ─────────────────────────────────── */

const TreeNode = ({ node, depth = 0 }: { node: ValueNode; depth?: number }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Connector line for children */}
      {depth > 0 && (
        <div
          className="absolute top-0 -left-4 w-4 h-full"
          style={{ borderLeft: "1px dashed hsl(var(--border) / 0.4)" }}
        />
      )}

      <div
        className={`rounded-xl border transition-all ${
          expanded ? "border-primary/30 bg-card/60" : "border-border/40 bg-card/30 hover:border-primary/20"
        } backdrop-blur-sm`}
      >
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="w-full p-4 text-left flex items-start gap-3"
        >
          {/* Expand icon or node icon */}
          <div className="shrink-0 mt-0.5 flex items-center gap-1.5">
            {hasChildren ? (
              expanded ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <span className="w-3.5" />
            )}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/40 text-primary">
              {node.icon}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-serif text-foreground">{node.label}</h4>
              {node.status && node.status !== "active" && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-serif"
                  style={{
                    borderColor: node.status === "coming_soon" ? "hsl(var(--muted-foreground))" :
                      node.status === "experimental" ? "hsl(280, 60%, 55%)" :
                      "hsl(150, 60%, 45%)",
                  }}
                >
                  {node.status === "coming_soon" ? "Coming Soon" :
                   node.status === "experimental" ? "Experimental" : "Seasonal"}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{node.description}</p>

            {/* Reward tokens */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {node.rewards.map((r, i) => (
                <TokenBadge key={i} {...r} />
              ))}
            </div>

            {/* Meta row + action link */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground/70 font-serif">
              {node.cooldown && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {node.cooldown}
                </span>
              )}
              {node.verification && (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> {node.verification}
                </span>
              )}
              {node.actionLink && (
                <span
                  role="link"
                  className="flex items-center gap-1 text-primary/70 hover:text-primary cursor-pointer transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(node.actionLink!); }}
                >
                  <ArrowRight className="w-3 h-3" /> Do this now
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-8 mt-2 space-y-2"
          >
            {node.children!.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Flow diagram component ───────────────────────────────── */

const FlowStep = ({ icon, label, color, isLast }: { icon: React.ReactNode; label: string; color: string; isLast?: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
      style={{ borderColor: color, background: `${color}15` }}
    >
      {icon}
    </div>
    <span className="text-xs font-serif" style={{ color }}>{label}</span>
    {!isLast && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mx-1" />}
  </div>
);

/* ─── Proposal card ────────────────────────────────────────── */

const ProposalCard = ({ proposal }: { proposal: ProposalNode }) => {
  const stateStyles = {
    proposed: { color: "hsl(var(--muted-foreground))", label: "Proposed" },
    under_review: { color: "hsl(280, 60%, 55%)", label: "Under Review" },
    approved: { color: "hsl(150, 60%, 45%)", label: "Approved" },
    archived: { color: "hsl(var(--muted-foreground))", label: "Archived" },
  }[proposal.state];

  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${stateStyles.color}, transparent)` }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-sm font-serif text-foreground">{proposal.title}</h4>
          <Badge variant="outline" className="text-[9px] font-serif shrink-0" style={{ borderColor: `${stateStyles.color}60`, color: stateStyles.color }}>
            {stateStyles.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground font-serif mb-3">{proposal.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {proposal.proposedRewards.map((r, i) => (
            <TokenBadge key={i} {...r} />
          ))}
        </div>

        <div className="border-t border-border/30 pt-3 mt-3">
          <p className="text-[10px] text-muted-foreground/70 font-serif mb-2 italic">"{proposal.rationale}"</p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif flex items-center gap-1.5" style={{ color: "hsl(42, 80%, 50%)" }}>
              <Shield className="w-3.5 h-3.5" /> {proposal.votes} influence votes
            </span>
            {proposal.state === "approved" && (
              <span className="text-[10px] font-serif text-muted-foreground flex items-center gap-1">
                <Check className="w-3 h-3" /> Migrated to active tree
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */

/* ─── Earn Branch — Dynamic Opportunities ──────────────────── */

interface Opportunity {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  estimatedReward: string;
  link: string;
  ready: boolean;
  priority: number;
}

const EarnBranch = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const heartBalance = useHeartBalance(userId);
  const navigate = useNavigate();
  const [showNotifyModal, setShowNotifyModal] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const opportunities = useMemo<Opportunity[]>(() => {
    const tc = heartBalance.counts.trees;
    const oc = heartBalance.counts.offerings;
    const items: Opportunity[] = [
      {
        id: "map-tree",
        label: "Map a Tree",
        description: "Add an Ancient Friend to the living atlas and earn 10 S33D Hearts.",
        icon: <TreePine className="w-5 h-5" />,
        category: "Growth",
        estimatedReward: "+10 ❤️ +3 🌿 +2 🛡️",
        link: "/add-tree",
        ready: true,
        priority: tc === 0 ? 0 : 5,
      },
      {
        id: "offering",
        label: "Make an Offering",
        description: "Gift a photo, poem, song, or story to a tree you've visited.",
        icon: <Music className="w-5 h-5" />,
        category: "Care",
        estimatedReward: "+1-5 ❤️ +1 🌿",
        link: "/map",
        ready: true,
        priority: tc > 0 && oc === 0 ? 0 : 4,
      },
      {
        id: "council",
        label: "Attend or Host a Council",
        description: "Join or organize a gathering of the Council of Life.",
        icon: <Users className="w-5 h-5" />,
        category: "Council",
        estimatedReward: "+5-20 ❤️ +5 🛡️",
        link: "/council-of-life",
        ready: true,
        priority: 6,
      },
      {
        id: "bug-report",
        label: "Firefly Contribution 🐞✨💡🌳",
        description: "Report bugs, suggest improvements, share insights, or propose trees. Validated contributions earn Hearts.",
        icon: <Bug className="w-5 h-5" />,
        category: "Care",
        estimatedReward: "+3-25 ❤️",
        link: "/bug-garden",
        ready: true,
        priority: 7,
      },
      {
        id: "curate",
        label: "Verify or Curate Data",
        description: "Confirm species, resolve duplicates, or add missing metadata.",
        icon: <Eye className="w-5 h-5" />,
        category: "Curation",
        estimatedReward: "+1-5 🛡️",
        link: "/map",
        ready: true,
        priority: 8,
      },
      {
        id: "invite",
        label: "Invite a Wanderer",
        description: "Share your invite link and earn Hearts when they join.",
        icon: <UserPlus className="w-5 h-5" />,
        category: "Growth",
        estimatedReward: "+5 ❤️ per referral",
        link: "/referrals",
        ready: true,
        priority: 9,
      },
      {
        id: "presence",
        label: "333-Second Presence",
        description: "Complete a mindfulness session with an Ancient Friend.",
        icon: <Sun className="w-5 h-5" />,
        category: "Presence",
        estimatedReward: "+10 ❤️ +3 🌿",
        link: "/map",
        ready: true,
        priority: 10,
      },
    ];
    return items.sort((a, b) => a.priority - b.priority);
  }, [heartBalance.counts]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-serif mb-2">
        Active ways to grow the tree — personalized for your journey.
      </p>

      <div className="space-y-3">
        {opportunities.map((opp, i) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className="relative rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => opp.ready ? navigate(opp.link) : setShowNotifyModal(opp.id)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{
                background: opp.priority <= 1
                  ? "linear-gradient(180deg, hsl(42 80% 50%), hsl(38 70% 40%))"
                  : "hsl(var(--primary) / 0.3)",
              }} />
              <div className="p-4 pl-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/40 text-primary shrink-0 mt-0.5">
                  {opp.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-serif text-foreground">{opp.label}</h4>
                    {opp.priority === 0 && (
                      <Badge variant="outline" className="text-[9px] font-serif border-amber-500/40 text-amber-400">
                        Recommended
                      </Badge>
                    )}
                    {!opp.ready && (
                      <Badge variant="outline" className="text-[9px] font-serif border-muted-foreground/40 text-muted-foreground">
                        Preparing…
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{opp.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] font-serif text-primary/70">{opp.estimatedReward}</span>
                    <span className="text-[10px] font-serif text-muted-foreground/50 uppercase tracking-wider">{opp.category}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-3" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Card className="bg-card/40 backdrop-blur border-border/30 mt-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-serif text-foreground uppercase tracking-wider">Windfall Progress</h4>
          </div>
          <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
            Every tree accumulates Hearts toward a <span className="text-amber-400">Windfall</span> at 144 Hearts.
            Keep mapping trees and making offerings to trigger the next community windfall.
          </p>
          <Link to="/how-hearts-work" className="text-[11px] font-serif text-primary hover:underline mt-2 inline-block">
            Learn how Hearts work →
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur border-primary/15 mt-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">✦</span>
            <h4 className="text-xs font-serif text-foreground uppercase tracking-wider">Firefly Contributions</h4>
          </div>
          <p className="text-[11px] text-muted-foreground font-serif leading-relaxed mb-3">
            Use the floating <span className="text-primary">Firefly ✦</span> button to report bugs, suggest improvements, share insights, or propose trees.
            Validated contributions earn Hearts:
          </p>
          <div className="space-y-1.5 text-[11px] font-serif">
            <div className="flex justify-between"><span className="text-muted-foreground">🐞 Valid bug report</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+3–20 ❤️</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">✨ Accepted UX refinement</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+5–15 ❤️</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">💡 High-value insight</span><span style={{ color: "hsl(0, 65%, 55%)" }}>variable ❤️</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">🌳 Verified tree suggestion</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+5–25 ❤️</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-serif mt-3">
            Hearts are awarded when your contribution is reviewed and validated. Look for the glowing ✦ orb at the edge of your screen.
          </p>
        </CardContent>
      </Card>

      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifyModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif text-foreground mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground font-serif mb-4">
              This opportunity is being prepared. When ready, you'll earn Hearts for participating.
            </p>
            <Button variant="outline" className="w-full font-serif" onClick={() => setShowNotifyModal(null)}>
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */

const ValueTreePage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "how";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
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
            Explore how every action grows into ecosystem value — from roots to fruit. S33D Hearts are the commons currency, earned through stewardship, not speculation.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: "❤️", label: "S33D Hearts", sub: "Global currency", color: "hsl(0, 65%, 55%)" },
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/30 border border-border/50 mb-8 flex-wrap h-auto gap-1 p-1.5 w-full justify-start">
            <TabsTrigger value="earn" className="font-serif text-xs tracking-wider gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Earn & Grow
            </TabsTrigger>
            <TabsTrigger value="how" className="font-serif text-xs tracking-wider gap-1.5">
              <Sprout className="w-3.5 h-3.5" /> How Hearts Grow
            </TabsTrigger>
            <TabsTrigger value="flow" className="font-serif text-xs tracking-wider gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Fractal Distribution
            </TabsTrigger>
            <TabsTrigger value="chains" className="font-serif text-xs tracking-wider gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Value Chains
            </TabsTrigger>
            <TabsTrigger value="proposals" className="font-serif text-xs tracking-wider gap-1.5">
              <Vote className="w-3.5 h-3.5" /> Proposed Branches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earn">
            <EarnBranch />
          </TabsContent>

          <TabsContent value="how">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-serif mb-4">
                Tap any action to explore its reward branches. Every root leads to tokens.
              </p>
              {ROOT_ACTIONS.map((node, i) => (
                <motion.div key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <TreeNode node={node} />
                </motion.div>
              ))}
            </div>
            <Card className="bg-card/40 backdrop-blur border-border/30 mt-8">
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
          </TabsContent>

          <TabsContent value="flow">
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground font-serif">
                How rewards flow through the token system when you interact with a tree.
              </p>
              <Card className="bg-card/60 backdrop-blur border-border/40">
                <CardContent className="p-6">
                  <h4 className="text-sm font-serif text-foreground mb-5">Universal Token Flow</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <FlowStep icon={<Users className="w-4 h-4 text-foreground" />} label="User Action" color="hsl(var(--foreground))" />
                    <FlowStep icon={<Check className="w-4 h-4" style={{ color: "hsl(150, 60%, 45%)" }} />} label="Verification" color="hsl(150, 60%, 45%)" />
                    <FlowStep icon={<Heart className="w-4 h-4" style={{ color: "hsl(0, 65%, 55%)" }} />} label="S33D Hearts" color="hsl(0, 65%, 55%)" />
                    <FlowStep icon={<Sprout className="w-4 h-4 text-primary" />} label="Species Hearts" color="hsl(var(--primary))" />
                    <FlowStep icon={<Shield className="w-4 h-4" style={{ color: "hsl(42, 80%, 50%)" }} />} label="Influence" color="hsl(42, 80%, 50%)" isLast />
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-5 text-center">
                    <span className="text-3xl block mb-2">❤️</span>
                    <h4 className="text-sm font-serif text-foreground mb-1">S33D Hearts</h4>
                    <p className="text-[10px] text-muted-foreground font-serif mb-3">Global currency — always issued</p>
                    <div className="space-y-1.5 text-[11px] font-serif text-left">
                      <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+1</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Map tree</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+10</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Offering</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+1-5</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Complete map</span><span style={{ color: "hsl(0, 65%, 55%)" }}>+15</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-5 text-center">
                    <span className="text-3xl block mb-2">🌿</span>
                    <h4 className="text-sm font-serif text-foreground mb-1">Species Hearts</h4>
                    <p className="text-[10px] text-muted-foreground font-serif mb-3">Routed to tree's botanical hive</p>
                    <div className="space-y-1.5 text-[11px] font-serif text-left">
                      <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="text-primary">+1</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Map tree</span><span className="text-primary">+3</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Quality offering</span><span className="text-primary">+2</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Complete map</span><span className="text-primary">+5</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-5 text-center">
                    <span className="text-3xl block mb-2">🛡️</span>
                    <h4 className="text-sm font-serif text-foreground mb-1">Influence</h4>
                    <p className="text-[10px] text-muted-foreground font-serif mb-3">Soulbound governance voice</p>
                    <div className="space-y-1.5 text-[11px] font-serif text-left">
                      <div className="flex justify-between"><span className="text-muted-foreground">Verify tree</span><span style={{ color: "hsl(42, 80%, 50%)" }}>+2</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Add metadata</span><span style={{ color: "hsl(42, 80%, 50%)" }}>+1-3</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Quality media</span><span style={{ color: "hsl(42, 80%, 50%)" }}>+1</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Resolve dupes</span><span style={{ color: "hsl(42, 80%, 50%)" }}>+3</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

          <TabsContent value="chains">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-serif mb-4">
                Advanced and multi-step reward systems — deeper engagement unlocks greater value.
              </p>
              {ADVANCED_CHAINS.map((node, i) => (
                <motion.div key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <TreeNode node={node} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="proposals">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-serif">
                  Community proposals for new value branches. Vote with Influence tokens.
                </p>
                <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5" disabled>
                  <Vote className="w-3.5 h-3.5" /> Submit Proposal
                </Button>
              </div>
              {PROPOSALS.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <ProposalCard proposal={p} />
                </motion.div>
              ))}
              <Card className="bg-card/40 backdrop-blur border-border/30">
                <CardContent className="p-5 text-center">
                  <p className="text-xs text-muted-foreground font-serif">
                    Approved proposals are migrated into the active Value Tree.
                    Earn <span style={{ color: "hsl(42, 80%, 50%)" }}>Influence tokens</span> through curation actions to participate in governance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default ValueTreePage;
