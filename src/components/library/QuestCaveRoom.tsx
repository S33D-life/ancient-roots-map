/**
 * QuestCaveRoom — Threshold chamber between Ancient Friends (outer world)
 * and Heartwood (inner library). Real-world care becomes living progression.
 *
 * Quests are *derived* from existing data (trees planted, offerings made,
 * whispers sent, hearts earned). No new backend table is introduced — the
 * cave is a window onto existing activity, not a new system of record.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, Users, Flame, Sparkles, TreeDeciduous, Heart,
  MessageCircle, Map as MapIcon, Radio, ArrowRight, Trophy,
  Mountain, Leaf,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import SeasonalQuestsPanel from "./quest-cave/SeasonalQuestsPanel";
import FourSeasonsCard from "./quest-cave/FourSeasonsCard";
import DreamTreesPanel from "./quest-cave/DreamTreesPanel";
import PathArchetypesPanel from "./quest-cave/PathArchetypesPanel";
import BloomingMapCard from "./quest-cave/BloomingMapCard";
import QuestHeartFlowCard from "./quest-cave/QuestHeartFlowCard";
import { currentSeason, type SeasonKey } from "./quest-cave/seasonalQuestsConfig";

// ─────────────────────────────────────────────────────────────────
// Quest model
// ─────────────────────────────────────────────────────────────────

type QuestStatus = "open" | "active" | "near" | "complete";
type QuestType = "path" | "hearth" | "circle" | "great";

interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: string;
  status: QuestStatus;
  actionLabel: string;
  actionTo: string;
  linkedLabel?: string;
}

function statusOf(progress: number, goal: number): QuestStatus {
  if (progress >= goal) return "complete";
  if (progress === 0) return "open";
  if (progress / goal >= 0.66) return "near";
  return "active";
}

const STATUS_TONE: Record<QuestStatus, { label: string; cls: string }> = {
  open:     { label: "Open",       cls: "bg-muted/40 text-muted-foreground border-border/40" },
  active:   { label: "Underway",   cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/30" },
  near:     { label: "Nearly there", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30" },
  complete: { label: "Complete",   cls: "bg-primary/15 text-primary border-primary/30" },
};

const TYPE_ICON: Record<QuestType, typeof Compass> = {
  path: Compass,
  hearth: Flame,
  circle: Users,
  great: Sparkles,
};

// ─────────────────────────────────────────────────────────────────
// Quest card
// ─────────────────────────────────────────────────────────────────

function QuestCard({ q, index }: { q: Quest; index: number }) {
  const Icon = TYPE_ICON[q.type];
  const tone = STATUS_TONE[q.status];
  const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="border border-amber-900/20 bg-gradient-to-br from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10 backdrop-blur-sm hover:border-primary/40 transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-sm text-foreground leading-snug">{q.title}</h4>
                <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5 leading-relaxed">
                  {q.description}
                </p>
                {q.linkedLabel && (
                  <p className="text-[10px] font-serif text-muted-foreground/60 mt-1 italic">
                    Linked to {q.linkedLabel}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[9px] font-serif shrink-0", tone.cls)}>
              {tone.label}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-serif text-muted-foreground">
              <span>{q.progress} / {q.goal}</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-primary/70" />
                {q.reward}
              </span>
            </div>
            <Progress value={pct} className="h-1.5 bg-muted/40" />
          </div>

          <Button
            asChild
            size="sm"
            variant={q.status === "complete" ? "secondary" : "default"}
            className="w-full text-xs font-serif h-8"
          >
            <Link to={q.actionTo}>
              {q.actionLabel}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Quest derivation — read user activity, shape into living quests
// ─────────────────────────────────────────────────────────────────

interface UserActivity {
  trees: number;
  offerings: number;
  whispers: number;
  visits: number;
  totalHearts: number;
  // Aggregate numbers — the "great quest" reflects the whole forest
  globalTrees: number;
  globalOfferings: number;
}

function buildQuests(a: UserActivity): Quest[] {
  const quests: Quest[] = [
    // ── My Path
    {
      id: "path-first-tree",
      type: "path",
      title: "Meet your first Ancient Friend",
      description: "Add a tree to the living atlas. Every path begins with one rooted being.",
      progress: Math.min(a.trees, 1),
      goal: 1,
      reward: "+10",
      status: statusOf(Math.min(a.trees, 1), 1),
      actionLabel: a.trees > 0 ? "Visit the map" : "Add a tree",
      actionTo: a.trees > 0 ? ROUTES.MAP : ROUTES.ADD_TREE,
    },
    {
      id: "path-three-offerings",
      type: "path",
      title: "Leave three offerings",
      description: "A song, a quote, a photograph. Small gifts that thicken the canopy.",
      progress: Math.min(a.offerings, 3),
      goal: 3,
      reward: "+15",
      status: statusOf(Math.min(a.offerings, 3), 3),
      actionLabel: "Open the map",
      actionTo: ROUTES.MAP,
    },
    {
      id: "path-five-visits",
      type: "path",
      title: "Walk five canopies",
      description: "Check in beneath five trees. Presence is the first offering.",
      progress: Math.min(a.visits, 5),
      goal: 5,
      reward: "+25",
      status: statusOf(Math.min(a.visits, 5), 5),
      actionLabel: "Find a tree near me",
      actionTo: ROUTES.MAP,
    },
    // ── Family / Our Hearth
    {
      id: "hearth-tribe-glow",
      type: "hearth",
      title: "Light your hearth",
      description: "Earn 100 hearts together with the wanderers in your lineage.",
      progress: Math.min(a.totalHearts, 100),
      goal: 100,
      reward: "Hearth flame unlock",
      status: statusOf(Math.min(a.totalHearts, 100), 100),
      actionLabel: "Open the Hearth",
      actionTo: ROUTES.HEARTH,
    },
    {
      id: "hearth-whispers",
      type: "hearth",
      title: "Send three whispers",
      description: "Place messages bound to trees. Future wanderers will find them.",
      progress: Math.min(a.whispers, 3),
      goal: 3,
      reward: "+12",
      status: statusOf(Math.min(a.whispers, 3), 3),
      actionLabel: "Begin a whisper",
      actionTo: ROUTES.MAP,
    },
    // ── Circles & Hives
    {
      id: "circle-hive-visit",
      type: "circle",
      title: "Find your Species Hive",
      description: "Step into the hive of a species you care for. Lineage answers presence.",
      progress: a.offerings > 0 ? 1 : 0,
      goal: 1,
      reward: "+8",
      status: statusOf(a.offerings > 0 ? 1 : 0, 1),
      actionLabel: "Open the Hives",
      actionTo: ROUTES.HIVES,
    },
    {
      id: "circle-ten-trees",
      type: "circle",
      title: "Ten trees in your circle",
      description: "Map ten Ancient Friends — enough to begin a grove.",
      progress: Math.min(a.trees, 10),
      goal: 10,
      reward: "+50 + grove unlock",
      status: statusOf(Math.min(a.trees, 10), 10),
      actionLabel: "View the map",
      actionTo: ROUTES.MAP,
    },
    // ── The Great Quest
    {
      id: "great-thousand-trees",
      type: "great",
      title: "1,000 Ancient Friends mapped",
      description: "A collective vow: one thousand trees held in living memory.",
      progress: Math.min(a.globalTrees, 1000),
      goal: 1000,
      reward: "Council bloom",
      status: statusOf(Math.min(a.globalTrees, 1000), 1000),
      actionLabel: "See the atlas",
      actionTo: ROUTES.ATLAS,
    },
    {
      id: "great-five-thousand-offerings",
      type: "great",
      title: "5,000 offerings rooted",
      description: "Songs, scrolls, photographs woven through the forest.",
      progress: Math.min(a.globalOfferings, 5000),
      goal: 5000,
      reward: "Library bloom",
      status: statusOf(Math.min(a.globalOfferings, 5000), 5000),
      actionLabel: "Open the Library",
      actionTo: ROUTES.LIBRARY,
    },
  ];

  return quests;
}

// ─────────────────────────────────────────────────────────────────
// Threshold panel — what the cave shows you on entry
// ─────────────────────────────────────────────────────────────────

interface RecentAction {
  id: string;
  label: string;
  when: string;
}

function ThresholdPanel({
  active,
  earned,
  nextMilestone,
  recent,
}: {
  active: number;
  earned: number;
  nextMilestone: Quest | null;
  recent: RecentAction[];
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-900/25 bg-gradient-to-br from-amber-100/40 via-card/70 to-emerald-100/30 dark:from-amber-950/20 dark:to-emerald-950/15 p-5 space-y-4">
      {/* root texture flourish */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 0, transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--accent, var(--primary))) 0, transparent 45%)",
        }}
      />

      <div className="relative flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Mountain className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-foreground leading-tight">The Threshold</h2>
          <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5 italic">
            Where real-world actions become living paths.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 text-center">
          <div className="text-lg font-serif text-primary">{active}</div>
          <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">Active quests</div>
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 text-center">
          <div className="text-lg font-serif text-primary">{earned}</div>
          <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">Hearts earned</div>
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 text-center">
          <div className="text-lg font-serif text-primary">{nextMilestone ? `${nextMilestone.goal - nextMilestone.progress}` : "—"}</div>
          <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">To next milestone</div>
        </div>
      </div>

      {nextMilestone && (
        <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-[10px] font-serif uppercase tracking-wider text-muted-foreground">
            <Trophy className="w-3 h-3 text-primary" /> Next milestone
          </div>
          <div className="font-serif text-sm text-foreground mt-1">{nextMilestone.title}</div>
          <Progress
            value={Math.min(100, Math.round((nextMilestone.progress / nextMilestone.goal) * 100))}
            className="h-1.5 mt-2 bg-muted/40"
          />
        </div>
      )}

      {recent.length > 0 && (
        <div className="relative space-y-1.5">
          <div className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground">Recent from Ancient Friends</div>
          <ul className="space-y-1">
            {recent.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-[11px] font-serif text-foreground/80">
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <Leaf className="w-3 h-3 text-emerald-600/70 shrink-0" />
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="text-muted-foreground/60 text-[10px] shrink-0 ml-2">{r.when}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative grid grid-cols-4 gap-2 pt-1">
        {[
          { to: ROUTES.MAP, icon: MapIcon, label: "Map" },
          { to: ROUTES.MAP, icon: Heart, label: "Offer" },
          { to: ROUTES.MAP, icon: MessageCircle, label: "Whisper" },
          { to: "/library/music-room", icon: Radio, label: "Radio" },
        ].map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/30 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all"
          >
            <q.icon className="w-4 h-4 text-primary/70" />
            <span className="text-[10px] font-serif text-foreground/80">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main room
// ─────────────────────────────────────────────────────────────────

const RELATIVE_TIME = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export default function QuestCaveRoom() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activity, setActivity] = useState<UserActivity>({
    trees: 0, offerings: 0, whispers: 0, visits: 0,
    totalHearts: 0, globalTrees: 0, globalOfferings: 0,
  });
  const [recent, setRecent] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const balance = useHeartBalance(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [
        userTreesRes, userOfferingsRes, userWhispersRes, userVisitsRes,
        globalTreesRes, globalOfferingsRes, recentOfferingsRes,
      ] = await Promise.all([
        userId
          ? supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId)
          : Promise.resolve({ count: 0 }),
        userId
          ? supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId)
          : Promise.resolve({ count: 0 }),
        userId
          ? supabase.from("tree_whispers" as any).select("*", { count: "exact", head: true }).eq("sender_user_id", userId)
          : Promise.resolve({ count: 0 }),
        userId
          ? supabase.from("tree_checkins").select("*", { count: "exact", head: true }).eq("user_id", userId)
          : Promise.resolve({ count: 0 }),
        supabase.from("trees").select("*", { count: "exact", head: true }),
        supabase.from("offerings").select("*", { count: "exact", head: true }),
        userId
          ? supabase
              .from("offerings")
              .select("id, title, type, created_at")
              .eq("created_by", userId)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      if (cancelled) return;

      setActivity({
        trees: userTreesRes.count || 0,
        offerings: userOfferingsRes.count || 0,
        whispers: userWhispersRes.count || 0,
        visits: userVisitsRes.count || 0,
        totalHearts: balance.totalHearts || 0,
        globalTrees: globalTreesRes.count || 0,
        globalOfferings: globalOfferingsRes.count || 0,
      });

      setRecent(
        (recentOfferingsRes.data || []).map((o: any) => ({
          id: o.id,
          label: o.title || `Offering · ${o.type ?? "gift"}`,
          when: RELATIVE_TIME(o.created_at),
        }))
      );
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [userId, balance.totalHearts]);

  const quests = useMemo(() => buildQuests(activity), [activity]);

  const grouped = useMemo(() => ({
    path: quests.filter(q => q.type === "path"),
    hearth: quests.filter(q => q.type === "hearth"),
    circle: quests.filter(q => q.type === "circle"),
    great: quests.filter(q => q.type === "great"),
  }), [quests]);

  const activeCount = quests.filter(q => q.status === "active" || q.status === "near").length;
  const nextMilestone = useMemo(() => {
    const candidates = quests.filter(q => q.status !== "complete" && q.progress > 0);
    if (candidates.length === 0) return quests.find(q => q.status !== "complete") || null;
    return candidates.sort((a, b) => (b.progress / b.goal) - (a.progress / a.goal))[0];
  }, [quests]);

  return (
    <div className="space-y-6">
      {/* Threshold image / ambience */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-900/25 bg-gradient-to-br from-amber-200/30 via-amber-100/20 to-emerald-200/25 dark:from-amber-900/20 dark:to-emerald-900/15 p-6 text-center">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(ellipse at top, hsl(var(--primary)/0.4), transparent 60%), radial-gradient(ellipse at bottom, hsl(var(--accent, var(--primary))/0.3), transparent 65%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 mb-3">
            <Mountain className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground tracking-wide">🜨 Quest Cave</h1>
          <p className="text-xs font-serif text-muted-foreground/80 mt-1 italic max-w-md mx-auto">
            Where real-world actions become living paths. Roots weave through stone; the chamber listens for your steps.
          </p>
        </div>
      </div>

      <ThresholdPanel
        active={activeCount}
        earned={balance.totalHearts}
        nextMilestone={nextMilestone}
        recent={recent}
      />

      <Tabs defaultValue="path" className="w-full">
        <TabsList className="bg-muted/40 w-full justify-start overflow-x-auto">
          <TabsTrigger value="path" className="text-xs font-serif gap-1.5">
            <Compass className="w-3.5 h-3.5" /> My Path
          </TabsTrigger>
          <TabsTrigger value="hearth" className="text-xs font-serif gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Our Hearth
          </TabsTrigger>
          <TabsTrigger value="circle" className="text-xs font-serif gap-1.5">
            <Users className="w-3.5 h-3.5" /> Circles
          </TabsTrigger>
          <TabsTrigger value="great" className="text-xs font-serif gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Great Quest
          </TabsTrigger>
        </TabsList>

        {(["path", "hearth", "circle", "great"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-32 rounded-xl bg-card/30 animate-pulse" />
                ))}
              </div>
            ) : grouped[key].length === 0 ? (
              <Card className="border-border/30 bg-card/30">
                <CardContent className="p-6 text-center">
                  <TreeDeciduous className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs font-serif text-muted-foreground italic">
                    The cave is quiet here. New paths will appear as the forest stirs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              grouped[key].map((q, i) => <QuestCard key={q.id} q={q} index={i} />)
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Bridge back to Heartwood */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <p className="text-xs font-serif text-foreground/80">
          Your steps echo through the chambers. Continue into the Heartwood.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button asChild size="sm" variant="outline" className="font-serif text-xs">
            <Link to="/library/bookshelf">Bookshelf</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="font-serif text-xs">
            <Link to="/library/scrolls">Scrolls & Records</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
