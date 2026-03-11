import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  TreeDeciduous, Heart, MapPin, Camera, Users, Shield, Hexagon,
  Sprout, Clock, ArrowRight, ThumbsUp, Plus, Loader2, Leaf, Crown,
  ChevronDown, ChevronUp, Sparkles, Calendar, Target, AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface Campaign {
  id: string;
  title: string;
  description: string | null;
  heart_pool: number;
  hearts_distributed: number;
  starts_at: string;
  ends_at: string;
  eligibility_rules: string | null;
  status: string;
}

interface Proposal {
  id: string;
  proposed_by: string;
  title: string;
  description: string;
  why_it_matters: string | null;
  suggested_hearts: number;
  suggested_duration: string | null;
  verification_level: string;
  support_count: number;
  status: string;
  created_at: string;
}

/* ─── Static earn-actions data (Roots) ─── */
const EARN_ACTIONS = [
  {
    icon: MapPin, label: "Map a Tree", hearts: 10, cooldown: "No limit",
    guard: "GPS required", link: "/add-tree",
    desc: "+1 bonus for photo offering",
  },
  {
    icon: Camera, label: "Upload Photo", hearts: 2, cooldown: "Per tree per day",
    guard: "Validated media", link: "/map",
    desc: "Species Hearts also earned",
  },
  {
    icon: Sprout, label: "Plant a Seed", hearts: 1, cooldown: "3 seeds/day",
    guard: "100m proximity", link: "/map",
    desc: "Wanderer + Sower + Tree hearts",
  },
  {
    icon: Shield, label: "Verify a Tree", hearts: 2, cooldown: "Per tree",
    guard: "Influence earned", link: "/map",
    desc: "Soulbound curation token",
  },
  {
    icon: Users, label: "Attend Council", hearts: 5, cooldown: "Per event",
    guard: "Signed attendance", link: "/council-of-life",
    desc: "Governance participation",
  },
  {
    icon: Hexagon, label: "Contribute to Hive", hearts: 3, cooldown: "Per action",
    guard: "Hive membership", link: "/hives",
    desc: "Species-specific rewards",
  },
];

/* ─── Component ─── */
interface Props {
  userId: string;
  totalHearts: number;
}

const VaultValueTree = ({ userId, totalHearts }: Props) => {
  const [activeSection, setActiveSection] = useState<"roots" | "trunk" | "canopy">("roots");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [mySupports, setMySupports] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const [campRes, propRes, supRes] = await Promise.all([
        supabase.from("heart_campaigns").select("*").eq("status", "active").order("ends_at", { ascending: true }),
        supabase.from("value_proposals").select("*").in("status", ["pending", "active"]).order("support_count", { ascending: false }),
        supabase.from("value_proposal_supports").select("proposal_id").eq("user_id", userId),
      ]);
      setCampaigns((campRes.data as Campaign[]) || []);
      setProposals((propRes.data as Proposal[]) || []);
      setMySupports(new Set((supRes.data || []).map((s: any) => s.proposal_id)));
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const toggleSupport = async (proposalId: string) => {
    const supported = mySupports.has(proposalId);
    if (supported) {
      await supabase.from("value_proposal_supports").delete().eq("proposal_id", proposalId).eq("user_id", userId);
      setMySupports(prev => { const n = new Set(prev); n.delete(proposalId); return n; });
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, support_count: Math.max(0, p.support_count - 1) } : p));
    } else {
      await supabase.from("value_proposal_supports").insert({ proposal_id: proposalId, user_id: userId });
      setMySupports(prev => new Set(prev).add(proposalId));
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, support_count: p.support_count + 1 } : p));
    }
  };

  const SECTIONS = [
    { id: "roots" as const, label: "Roots", sublabel: "Core Earn", icon: TreeDeciduous, accent: "120 45% 45%" },
    { id: "trunk" as const, label: "Trunk", sublabel: "Campaigns", icon: Leaf, accent: "28 70% 50%", count: campaigns.length },
    { id: "canopy" as const, label: "Canopy", sublabel: "Proposals", icon: Crown, accent: "45 100% 55%", count: proposals.length },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header with heart balance */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "radial-gradient(circle, hsl(42 95% 55% / 0.2), transparent)" }}
          >
            <Heart className="w-4.5 h-4.5" style={{ color: "hsl(42, 95%, 55%)" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-serif tracking-wide text-foreground">S33D Hearts — The Value Tree</h3>
            <p className="text-[10px] text-muted-foreground font-serif">The commons currency — how Hearts grow from roots to canopy</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-serif font-bold tabular-nums" style={{ color: "hsl(42, 95%, 55%)" }}>
              {totalHearts.toLocaleString()}
            </p>
            <p className="text-[9px] text-muted-foreground font-serif">Total Hearts</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="px-5 flex gap-1.5 pb-1">
        {SECTIONS.map(s => {
          const active = activeSection === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all text-center ${
                active ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-secondary/20"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: active ? `hsl(${s.accent})` : "hsl(var(--muted-foreground))" }} />
              <span className="text-xs font-serif" style={{ color: active ? `hsl(${s.accent})` : "hsl(var(--muted-foreground))" }}>
                {s.label}
              </span>
              {s.count !== undefined && s.count > 0 && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 min-w-[16px]">{s.count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5 pt-3"
        >
          {activeSection === "roots" && <RootsPanel />}
          {activeSection === "trunk" && <TrunkPanel campaigns={campaigns} loading={loading} />}
          {activeSection === "canopy" && (
            <CanopyPanel
              proposals={proposals}
              mySupports={mySupports}
              onToggleSupport={toggleSupport}
              userId={userId}
              loading={loading}
              proposalOpen={proposalOpen}
              setProposalOpen={setProposalOpen}
              onProposalCreated={(p) => setProposals(prev => [p, ...prev])}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Roots Panel ─── */
const RootsPanel = () => (
  <div className="space-y-2">
    <p className="text-[10px] text-muted-foreground/60 font-serif mb-3">
      Currently active ways to earn S33D Hearts — the foundation of the value tree.
    </p>
    {EARN_ACTIONS.map((a, i) => {
      const Icon = a.icon;
      return (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={a.link}
            className="group flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/30 hover:border-primary/30 hover:bg-card/50 transition-all"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "hsl(120 45% 45% / 0.12)" }}
            >
              <Icon className="w-4 h-4" style={{ color: "hsl(120, 45%, 45%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">{a.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{a.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-serif font-bold tabular-nums" style={{ color: "hsl(42, 95%, 55%)" }}>
                +{a.hearts}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                <span className="text-[9px] text-muted-foreground/60">{a.cooldown}</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        </motion.div>
      );
    })}
    <div className="pt-2 flex items-start gap-2 px-1">
      <AlertTriangle className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0" />
      <p className="text-[9px] text-muted-foreground/50 font-serif leading-relaxed">
        Anti-spam: GPS validation for mapping, daily caps on check-ins (3/tree/day), duplicate detection on media uploads. All Heart issuance is logged in an immutable ledger.
      </p>
    </div>
  </div>
);

/* ─── Trunk Panel (Campaigns) ─── */
const TrunkPanel = ({ campaigns, loading }: { campaigns: Campaign[]; loading: boolean }) => {
  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  if (campaigns.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <p className="text-xs text-muted-foreground font-serif">No active campaigns right now.</p>
        <p className="text-[10px] text-muted-foreground/60 font-serif">Seasonal Heart opportunities appear here when launched by curators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground/60 font-serif">
        Limited-time opportunities to earn bonus Hearts.
      </p>
      {campaigns.map((c, i) => {
        const progress = c.heart_pool > 0 ? Math.min(100, (c.hearts_distributed / c.heart_pool) * 100) : 0;
        const endDate = new Date(c.ends_at);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-xl border border-border/30 bg-card/30 space-y-2.5"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "hsl(28 70% 50% / 0.15)" }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "hsl(28, 70%, 50%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground">{c.title}</p>
                {c.description && <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{c.description}</p>}
              </div>
              <Badge variant="outline" className="text-[9px] font-serif shrink-0" style={{ borderColor: "hsl(28 70% 50% / 0.4)" }}>
                {daysLeft}d left
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-muted-foreground font-serif">
                <span>{c.hearts_distributed.toLocaleString()} / {c.heart_pool.toLocaleString()} Hearts</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
            {c.eligibility_rules && (
              <p className="text-[9px] text-muted-foreground/50 font-serif">
                <Target className="w-2.5 h-2.5 inline mr-1" />{c.eligibility_rules}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

/* ─── Canopy Panel (Proposals) ─── */
const CanopyPanel = ({
  proposals, mySupports, onToggleSupport, userId, loading, proposalOpen, setProposalOpen, onProposalCreated,
}: {
  proposals: Proposal[];
  mySupports: Set<string>;
  onToggleSupport: (id: string) => void;
  userId: string;
  loading: boolean;
  proposalOpen: boolean;
  setProposalOpen: (v: boolean) => void;
  onProposalCreated: (p: Proposal) => void;
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [why, setWhy] = useState("");
  const [hearts, setHearts] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("value_proposals").insert({
      proposed_by: userId,
      title: title.trim(),
      description: description.trim(),
      why_it_matters: why.trim() || null,
      suggested_hearts: parseInt(hearts) || 10,
    }).select().single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
    } else if (data) {
      onProposalCreated(data as Proposal);
      setProposalOpen(false);
      setTitle(""); setDescription(""); setWhy(""); setHearts("10");
      toast({ title: "Proposal submitted", description: "The community can now signal support." });
    }
  };

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/60 font-serif">
          Propose new Heart-eligible activities for the community to consider.
        </p>
        <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-[10px] font-serif gap-1 h-7 px-2.5">
              <Plus className="w-3 h-3" /> Propose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-base">Propose a New Reward Branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Activity Name</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Record seasonal phenology" className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does the wanderer do?" className="mt-1 text-sm min-h-[60px]" />
              </div>
              <div>
                <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Why It Matters</label>
                <Textarea value={why} onChange={e => setWhy(e.target.value)} placeholder="How does this serve the grove?" className="mt-1 text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Suggested Hearts</label>
                <Input type="number" value={hearts} onChange={e => setHearts(e.target.value)} min={1} max={100} className="mt-1 text-sm w-24" />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !description.trim()} className="w-full font-serif">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
                Submit Proposal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {proposals.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <Crown className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground font-serif">No proposals yet.</p>
          <p className="text-[10px] text-muted-foreground/60 font-serif">Be the first to propose a new reward branch.</p>
        </div>
      ) : (
        proposals.map((p, i) => {
          const supported = mySupports.has(p.id);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-border/30 bg-card/30 space-y-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{p.description}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-serif shrink-0"
                  style={{ borderColor: p.status === "active" ? "hsl(120 45% 45% / 0.4)" : "hsl(var(--border))" }}
                >
                  {p.status}
                </Badge>
              </div>
              {p.why_it_matters && (
                <p className="text-[9px] text-muted-foreground/60 font-serif italic">"{p.why_it_matters}"</p>
              )}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-serif">
                  <Heart className="w-3 h-3 inline mr-0.5" style={{ color: "hsl(42, 95%, 55%)" }} />
                  +{p.suggested_hearts} suggested
                </span>
                <span className="text-[10px] text-muted-foreground font-serif">
                  {p.verification_level} verification
                </span>
                <div className="ml-auto">
                  <button
                    onClick={() => onToggleSupport(p.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif transition-all border ${
                      supported
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/20 border-border/40 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {p.support_count}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default VaultValueTree;
