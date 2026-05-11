/**
 * QuestCavePage — /heartwood/quest-cave
 *
 * A quiet, candlelit map-room inside Heartwood where a wanderer's real
 * activity (mapped trees, visits, offerings, blooms, whispers) becomes
 * personal paths, circle quests, collective quests, and TETOL progress.
 *
 * The page is intentionally data-ready: counters come from real Supabase
 * queries via useQuestCaveActivity, while quest definitions live in
 * mockQuests.ts and can be replaced by a backed-quest table later without
 * touching the UI.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass, Users, Globe2, TreePine, Leaf, MapPin, Mountain,
  ArrowRight, Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuestCaveActivity } from "@/hooks/use-quest-cave-activity";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/routes";
import QuestCard from "@/components/quest-cave/QuestCard";
import {
  buildMyPaths, buildCollective, buildSeasonal, MOCK_CIRCLE_QUESTS,
} from "@/components/quest-cave/mockQuests";
import LivingPathsPanel from "@/components/quest-cave/living/LivingPathsPanel";
import QuestCaveRoom from "@/components/library/QuestCaveRoom";

const TABS = [
  { value: "my", label: "My Paths", icon: Compass },
  { value: "circles", label: "Circles", icon: Users },
  { value: "collective", label: "Collective", icon: Globe2 },
  { value: "tetol", label: "TETOL", icon: TreePine },
  { value: "seasonal", label: "Seasonal", icon: Leaf },
  { value: "nearby", label: "Nearby", icon: MapPin },
] as const;

export default function QuestCavePage() {
  useDocumentTitle("Quest Room · Heartwood");
  const { userId } = useCurrentUser();
  const activity = useQuestCaveActivity(userId);

  const myPaths = useMemo(() => buildMyPaths(activity), [activity]);
  const collective = useMemo(() => buildCollective(activity), [activity]);
  const seasonal = useMemo(() => buildSeasonal(activity), [activity]);
  const treesContributed = activity.trees + activity.blooms;
  const activePaths = myPaths.filter(q => q.status === "active").length;

  return (
    <div className="min-h-screen relative overflow-hidden botanical-heartwood">
      <Header />
      <div
        className="relative z-10 max-w-3xl mx-auto px-4 pb-24"
        style={{ paddingTop: "var(--content-top)" }}
      >
        {/* Hero ─────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-900/25 bg-gradient-to-br from-amber-200/30 via-amber-100/20 to-emerald-200/25 dark:from-amber-900/20 dark:to-emerald-900/15 p-6 text-center mb-6">
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at top, hsl(var(--primary)/0.4), transparent 60%), radial-gradient(ellipse at bottom, hsl(var(--accent, var(--primary))/0.3), transparent 65%)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 mb-3">
              <Mountain className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-serif text-3xl text-foreground tracking-wide">Quest Room</h1>
            <p className="text-sm font-serif text-muted-foreground mt-1">
              Choose a path through the living world.
            </p>
            <p className="text-xs font-serif text-muted-foreground/80 mt-3 italic max-w-md mx-auto leading-relaxed">
              Your visits, offerings, blooms, whispers, and mapped trees become paths here.
              Some quests are yours alone. Some belong to your circles. Some are carried by the whole forest.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <SummaryStat label="Hearts this moon" value={activity.totalHearts} />
          <SummaryStat label="Active paths" value={activePaths} />
          <SummaryStat label="Trees contributed" value={treesContributed} />
        </div>

        {/* Living Paths — quiet ecological progression */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-3 px-1">
            <h2 className="font-serif text-lg text-foreground">Living Paths</h2>
            <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              A wandering naturalist's journal
            </p>
          </div>
          <LivingPathsPanel userId={userId} activity={activity} />
        </div>

        {/* Tabs ─────────────────────────────────────── */}
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="bg-muted/40 w-full justify-start overflow-x-auto flex-nowrap">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="text-xs font-serif gap-1.5 shrink-0"
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="my" className="mt-4 space-y-3">
            {!userId ? (
              <SignInPrompt />
            ) : myPaths.length === 0 ? (
              <EmptyState />
            ) : (
              myPaths.map((q, i) => <QuestCard key={q.id} q={q} index={i} />)
            )}
          </TabsContent>

          <TabsContent value="circles" className="mt-4 space-y-3">
            <p className="text-[11px] font-serif text-muted-foreground/70 italic px-1">
              Sample circles shown below. Your real friends, family, staff, grove and
              council circles will appear here as the data is wired in.
            </p>
            {MOCK_CIRCLE_QUESTS.map((q, i) => <QuestCard key={q.id} q={q} index={i} />)}
          </TabsContent>

          <TabsContent value="collective" className="mt-4 space-y-3">
            {collective.map((q, i) => <QuestCard key={q.id} q={q} index={i} />)}
          </TabsContent>

          <TabsContent value="tetol" className="mt-4">
            <TetolPanel activity={activity} />
          </TabsContent>

          <TabsContent value="seasonal" className="mt-4 space-y-3">
            <SeasonalIntro />
            {seasonal.map((q, i) => <QuestCard key={q.id} q={q} index={i} />)}
          </TabsContent>

          <TabsContent value="nearby" className="mt-4 space-y-3">
            <NearbyPanel userId={userId} />
          </TabsContent>
        </Tabs>

        {/* Quest chambers — derived staff/path quests, seasonal & dream layers */}
        <div className="mt-10 mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-3 px-1">
            <h2 className="font-serif text-lg text-foreground">Quest Chambers</h2>
            <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              Staff · Seasonal · Dream
            </p>
          </div>
          <QuestCaveRoom />
        </div>

        {/* Bridge back */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center mt-8">
          <p className="text-xs font-serif text-foreground/80">
            Your steps echo through the chambers.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <Button asChild size="sm" variant="outline" className="font-serif text-xs">
              <Link to="/library">Heartwood</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="font-serif text-xs">
              <Link to={ROUTES.MAP}>Open Map</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ── Bits ───────────────────────────────────────────────────────────────

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
      <div className="text-xl font-serif text-primary">{value}</div>
      <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function EmptyState() {
  const starters = [
    { title: "Meet Your First Ancient Friend", to: ROUTES.ADD_TREE },
    { title: "Record One Bloom Nearby", to: ROUTES.MAP },
    { title: "Visit One Tree This Week", to: ROUTES.MAP },
    { title: "Leave Your First Offering", to: ROUTES.MAP },
    { title: "Join a Collective Quest", to: "#" },
  ];
  return (
    <Card className="border-border/30 bg-card/30">
      <CardContent className="p-5 space-y-3">
        <h3 className="font-serif text-base text-foreground text-center">
          Choose a path through the living world.
        </h3>
        <p className="text-xs font-serif text-muted-foreground italic text-center">
          Begin with one tree, one offering, or one bloom. Your quests will grow from there.
        </p>
        <div className="space-y-1.5 pt-1">
          {starters.map((s) => (
            <Link
              key={s.title}
              to={s.to}
              className="flex items-center justify-between text-xs font-serif text-foreground/80 px-3 py-2 rounded-lg border border-border/30 bg-card/50 hover:border-primary/40"
            >
              <span>{s.title}</span>
              <ArrowRight className="w-3 h-3 text-primary/70" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SignInPrompt() {
  return (
    <Card className="border-border/30 bg-card/30">
      <CardContent className="p-5 text-center space-y-3">
        <p className="text-xs font-serif text-muted-foreground italic">
          Sign in to see the paths your steps are weaving.
        </p>
        <Button asChild size="sm" className="font-serif text-xs">
          <Link to={ROUTES.AUTH}>Sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function SeasonalIntro() {
  const month = new Date().getMonth();
  const season =
    month >= 2 && month <= 4 ? "Spring" :
    month >= 5 && month <= 7 ? "Summer" :
    month >= 8 && month <= 10 ? "Autumn" : "Winter";
  return (
    <Card className="border-border/30 bg-gradient-to-br from-emerald-50/30 to-amber-50/20 dark:from-emerald-950/10 dark:to-amber-950/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
          <Leaf className="w-3.5 h-3.5 text-emerald-600/70" />
          <span className="uppercase tracking-wider">{season}</span>
        </div>
        <p className="text-[11px] font-serif text-foreground/80 mt-1 italic">
          Look for opening buds, returning blossoms, and the trees beginning their year.
        </p>
      </CardContent>
    </Card>
  );
}

// ── TETOL panel ─────────────────────────────────────────────────────────

function TetolPanel({ activity }: { activity: ReturnType<typeof useQuestCaveActivity> }) {
  const counters = [
    { label: "Trees mapped", value: activity.globalTrees },
    { label: "Offerings", value: activity.globalOfferings },
    { label: "Blooms recorded", value: activity.globalBlooms },
    { label: "My visits", value: activity.visits },
    { label: "My whispers", value: activity.whispersSent },
    { label: "My hearts", value: activity.totalHearts },
  ];

  const layers = [
    { name: "Roots", desc: "Ancient Friends mapped and visited.", value: activity.globalTrees, of: 1000 },
    { name: "Trunk", desc: "Heartwood records, offerings, seeds, songs and memories.", value: activity.globalOfferings, of: 5000 },
    { name: "Canopy", desc: "Council activity, collective quests, governance, stewardship.", value: 0, of: 100 },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-amber-900/20 bg-gradient-to-br from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-base">TETOL — The Whole Living Tree</h3>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground italic leading-relaxed">
            Every path, circle, quest, tree, offering, and Heart becomes part of the wider organism.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {counters.map((c) => (
          <div key={c.label} className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
            <div className="text-lg font-serif text-primary">{c.value}</div>
            <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {layers.map((l) => {
          const pct = Math.min(100, Math.round((l.value / l.of) * 100));
          return (
            <Card key={l.name} className="border-border/30 bg-card/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm text-foreground">{l.name}</h4>
                  <span className="text-[10px] font-serif text-muted-foreground">{l.value} / {l.of}</span>
                </div>
                <p className="text-[11px] font-serif text-muted-foreground/80 italic">{l.desc}</p>
                <Progress value={pct} className="h-1.5 bg-muted/40" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Nearby panel ────────────────────────────────────────────────────────

interface NearbyTree {
  id: string;
  name: string | null;
  species: string | null;
}

function NearbyPanel({ userId }: { userId: string | null }) {
  const [trees, setTrees] = useState<NearbyTree[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("trees")
          .select("id, name, species")
          .order("created_at", { ascending: false })
          .limit(5);
        if (!cancelled) setTrees((data as any) || []);
      } catch {
        if (!cancelled) setTrees([]);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="space-y-3">
      <Card className="border-border/30 bg-card/30">
        <CardContent className="p-4">
          <p className="text-[11px] font-serif text-muted-foreground italic">
            Open the map to find trees that count toward your quests. We'll show
            distance and quest matches here once your location is shared.
          </p>
          <Button asChild size="sm" className="font-serif text-xs mt-3 w-full sm:w-auto">
            <Link to={ROUTES.MAP}>
              Open the Map <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {trees === null ? (
        <div className="h-24 rounded-xl bg-card/30 animate-pulse" />
      ) : trees.length === 0 ? (
        <Card className="border-border/30 bg-card/30">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-serif text-muted-foreground italic">
              No trees yet — be the first to plant one in the atlas.
            </p>
          </CardContent>
        </Card>
      ) : (
        trees.map((t) => (
          <Card key={t.id} className="border-amber-900/20 bg-card/50">
            <CardContent className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-serif text-sm text-foreground truncate">
                    {t.name || "Unnamed Ancient Friend"}
                  </h4>
                  <p className="text-[11px] font-serif text-muted-foreground italic">
                    {t.species || "Possible quest match"}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="font-serif text-[10px] h-7 shrink-0">
                  <Link to={ROUTES.TREE(t.id)}>View tree</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
