/**
 * QuestCavePage — /heartwood/quest-cave
 *
 * "A place where paths become visible."
 *
 * Structure (post-harmonisation):
 *   Hero → Current Resonance → Living Paths → Staff Paths →
 *   Seasonal & Collective (collapsible) → Great Quests (collapsible) →
 *   More Chambers (collapsible) → Bridge
 *
 * The page reads real progression via existing hooks. Underlying chamber
 * components (Seasonal panel, Dream Trees, Path Archetypes, Heart Flow,
 * Spark/Bug Bounty, Blooming Map) are preserved inside collapsibles so no
 * data-driven feature is lost — they simply no longer dominate the room.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Mountain, Compass, Sparkles, Leaf, Trophy, ArrowRight,
  Flame, ChevronDown,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuestCaveActivity } from "@/hooks/use-quest-cave-activity";
import { useLivingProgression } from "@/hooks/use-living-progression";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { ROUTES } from "@/lib/routes";
import LivingPathsPanel from "@/components/quest-cave/living/LivingPathsPanel";
import {
  currentSeason, nextMilestone, SPECIES_MILESTONES, STAFF_RESONANCE,
} from "@/lib/quest-cave/livingPaths";

// Heavier chambers are lazy — only mounted when the user opens "More Chambers".
const SeasonalQuestsPanel = lazy(() => import("@/components/library/quest-cave/SeasonalQuestsPanel"));
const FourSeasonsCard      = lazy(() => import("@/components/library/quest-cave/FourSeasonsCard"));
const DreamTreesPanel      = lazy(() => import("@/components/library/quest-cave/DreamTreesPanel"));
const PathArchetypesPanel  = lazy(() => import("@/components/library/quest-cave/PathArchetypesPanel"));
const QuestHeartFlowCard   = lazy(() => import("@/components/library/quest-cave/QuestHeartFlowCard"));
const SparkBugBountyPanel  = lazy(() => import("@/components/library/quest-cave/SparkBugBountyPanel"));
const BloomingMapCard      = lazy(() => import("@/components/library/quest-cave/BloomingMapCard"));
import { currentSeason as seasonKey } from "@/components/library/quest-cave/seasonalQuestsConfig";

export default function QuestCavePage() {
  useDocumentTitle("Quest Cave · Heartwood");
  const { userId } = useCurrentUser();
  const activity = useQuestCaveActivity(userId);
  const progression = useLivingProgression(userId);
  const identity = useStaffIdentity(userId);
  const staff = identity.borrowed;

  const season = currentSeason();
  const sKey = useMemo(() => seasonKey(), []);
  const speciesCount = progression.speciesEncountered.length;
  const speciesNext = nextMilestone(speciesCount, SPECIES_MILESTONES) as number;
  const resonanceLine = staff
    ? STAFF_RESONANCE[(staff.archetype_species ?? "").toLowerCase()]
    : undefined;

  return (
    <div className="min-h-screen relative overflow-hidden botanical-heartwood">
      <Header />
      <div
        className="relative z-10 max-w-3xl mx-auto px-4 pb-32"
        style={{ paddingTop: "var(--content-top)" }}
      >
        {/* ── Hero ───────────────────────────────────── */}
        <section className="relative rounded-2xl overflow-hidden border border-amber-900/25 bg-gradient-to-br from-amber-200/30 via-amber-100/20 to-emerald-200/25 dark:from-amber-900/20 dark:to-emerald-900/15 p-6 text-center mb-6">
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
            <h1 className="font-serif text-3xl text-foreground tracking-wide">Quest Cave</h1>
            <p className="text-sm font-serif text-muted-foreground mt-1 italic">
              A place where paths become visible.
            </p>
          </div>
        </section>

        {/* ── Current Resonance ──────────────────────── */}
        <SectionTitle title="Current Resonance" caption="What stirs beneath your feet right now." />
        <Card className="border-amber-900/20 bg-gradient-to-br from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10 mb-8">
          <CardContent className="p-4 space-y-3">
            <p className="font-serif text-[12px] italic text-muted-foreground/80">
              The cave listens for the paths already unfolding beneath your feet.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <ResonanceStat label="Hearts this moon" value={activity.totalHearts} />
              <ResonanceStat label="Species met" value={speciesCount} />
              <ResonanceStat label="To next seal" value={Math.max(0, speciesNext - speciesCount)} />
            </div>

            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-serif uppercase tracking-[0.2em] text-muted-foreground">
                <Leaf className="w-3 h-3 text-emerald-600/70" /> Season · {season}
              </div>
              <p className="font-serif text-sm text-foreground/90">
                Next species milestone at <span className="text-primary">{speciesNext}</span>
              </p>
              <Progress
                value={Math.min(100, Math.round((speciesCount / speciesNext) * 100))}
                className="h-1.5 bg-muted/40"
              />
            </div>

            {resonanceLine && (
              <div className="rounded-lg border border-amber-700/20 bg-amber-50/30 dark:bg-amber-950/10 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-serif uppercase tracking-[0.2em] text-muted-foreground">
                  <Flame className="w-3 h-3 text-amber-700/80" /> Borrowed Staff resonance
                </div>
                <p className="font-serif text-sm italic text-foreground/90 mt-1">{resonanceLine}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <QuickLink to={ROUTES.MAP} label="Open the map" />
              <QuickLink to={ROUTES.HIVES} label="Visit a hive" />
              <QuickLink to={ROUTES.STAFF_ROOM} label="Staff Room" />
            </div>
          </CardContent>
        </Card>

        {/* ── Living Paths (primary) ─────────────────── */}
        <SectionTitle
          title="Living Paths"
          caption="A wandering naturalist's journal."
          icon={<Compass className="w-4 h-4 text-primary" />}
        />
        <div className="mb-8">
          <LivingPathsPanel userId={userId} activity={activity} />
        </div>

        {/* ── Staff Paths ────────────────────────────── */}
        <SectionTitle
          title="Staff Paths"
          caption="Resonance and lineage that walk beside you."
          icon={<Flame className="w-4 h-4 text-amber-700/80" />}
        />
        <Card className="border-border/30 bg-card/40 mb-8">
          <CardContent className="p-4 space-y-3">
            {identity.hasPermanent && identity.permanent ? (
              <>
                <p className="font-serif text-sm text-foreground/90">
                  Bound to your path:{" "}
                  <span className="text-primary">
                    {identity.permanent.name || identity.permanent.species || "Permanent Staff"}
                  </span>
                  {staff ? " — your first guide is remembered." : "."}
                </p>
                {staff && (
                  <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-relaxed">
                    {staff.blessing}
                  </p>
                )}
              </>
            ) : staff ? (
              <>
                <p className="font-serif text-sm text-foreground/90">
                  Walking beside you: <span className="text-primary">{staff.temporary_name}</span> —
                  a Borrowed Staff of the {staff.archetype_species ?? "wild"} circle, your first guide.
                </p>
                <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-relaxed">
                  {staff.blessing}
                </p>
              </>
            ) : (
              <p className="font-serif text-[11px] italic text-muted-foreground/80">
                A Borrowed Staff will be offered as your first guide when you sign in. Your
                Permanent Staff emerges later — earned, gifted, or crafted through the trees you tend.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <StaffMilestone
                title="Borrowed Staff resonance"
                line={
                  staff
                    ? "Your staff stirs near old paths and hidden hollows."
                    : "Will appear once your first guide is offered."
                }
              />
              <StaffMilestone
                title={identity.hasPermanent ? "Permanent Staff bound" : "Permanent Staff (coming)"}
                line={
                  identity.hasPermanent
                    ? "Bound through ceremony — its lineage walks with yours."
                    : "Earned through long lineage with the same trees and grove."
                }
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <QuickLink to={ROUTES.STAFF_ROOM} label="Enter the Staff Room" />
            </div>
          </CardContent>
        </Card>

        {/* ── Seasonal & Collective ──────────────────── */}
        <CollapsibleSection
          title="Seasonal & Collective Paths"
          caption="Quests that ripen with the moon and the trees."
          icon={<Leaf className="w-4 h-4 text-emerald-600/80" />}
          defaultOpen={true}
        >
          <Suspense fallback={<ChamberSkeleton />}>
            <SeasonalQuestsPanel
              season={sKey}
              activity={{
                trees: activity.trees,
                offerings: activity.offerings,
                whispers: activity.whispersSent,
                visits: activity.visits,
                globalTrees: activity.globalTrees,
                globalOfferings: activity.globalOfferings,
              }}
            />
            <div className="mt-3">
              <FourSeasonsCard
                currentSeason={sKey}
                touchedSeasons={new Set(activity.visits > 0 ? [sKey] : [])}
              />
            </div>
          </Suspense>
        </CollapsibleSection>

        {/* ── Great Quests ───────────────────────────── */}
        <CollapsibleSection
          title="Great Quests"
          caption="Long, slow, mythic — the legendary paths."
          icon={<Trophy className="w-4 h-4 text-primary" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <GreatQuestRow
              title="Meet 100 species"
              line="Breadth across the canopy of the living world."
              current={speciesCount}
              target={100}
            />
            <GreatQuestRow
              title="Walk 33 Yew paths"
              line="The slow lineage of yew, returned to."
              current={progression.hiveCounts["yew"] ?? 0}
              target={33}
            />
            <GreatQuestRow
              title="Walk 33 Oak paths"
              line="Oaks remembered across regions and seasons."
              current={progression.hiveCounts["oak"] ?? 0}
              target={33}
            />
            <GreatQuestRow
              title="Visit 12 ancient trees"
              line="Elders aged 200+ years met in person."
              current={progression.ancientCount}
              target={12}
            />
            <GreatQuestRow
              title="Pilgrim companions"
              line="Walk an old pilgrim route alongside other wanderers."
            />
            <GreatQuestRow
              title="Boundary walkers"
              line="Map trees along parish boundaries and old droving roads."
            />
            <GreatQuestRow
              title="Orchard memory routes"
              line="Carry orchard lineages forward by recording fruit-bearers."
            />
            <GreatQuestRow
              title="1,000 Ancient Friends mapped"
              line="A collective vow held by the whole forest."
              current={activity.globalTrees}
              target={1000}
            />
          </div>
        </CollapsibleSection>

        {/* ── More Chambers (preserved data layers) ───── */}
        <CollapsibleSection
          title="More Chambers"
          caption="Dream trees, path archetypes, heart flow, blooming map."
          icon={<Sparkles className="w-4 h-4 text-primary/80" />}
          defaultOpen={false}
        >
          <Suspense fallback={<ChamberSkeleton />}>
            <div className="space-y-6">
              <DreamTreesPanel />
              <PathArchetypesPanel />
              <QuestHeartFlowCard
                baseHearts={activity.totalHearts}
                bonusPrepared={0}
                speciesFlow={0}
                hearthFlow={0}
                valueTreeContribution={0}
                rewardStatus="Locked"
              />
              <SparkBugBountyPanel />
              <BloomingMapCard
                individualTrees={activity.trees}
                individualOfferings={activity.offerings}
                collectiveTrees={activity.globalTrees}
                collectiveOfferings={activity.globalOfferings}
              />
            </div>
          </Suspense>
        </CollapsibleSection>

        {/* ── Bridge back ────────────────────────────── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center mt-8">
          <p className="text-xs font-serif text-foreground/80 italic">
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

function SectionTitle({
  title, caption, icon,
}: { title: string; caption: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3 px-1">
      <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
        {icon}{title}
      </h2>
      <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 text-right">
        {caption}
      </p>
    </div>
  );
}

function ResonanceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
      <div className="text-xl font-serif text-primary">{value}</div>
      <div className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-[11px] font-serif text-foreground/80 px-2.5 py-1.5 rounded-md border border-border/40 bg-card/50 hover:border-primary/40 hover:text-primary transition-colors inline-flex items-center gap-1"
    >
      {label}<ArrowRight className="w-3 h-3" />
    </Link>
  );
}

function StaffMilestone({ title, line }: { title: string; line: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card/30 p-3">
      <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {title}
      </p>
      <p className="font-serif text-[12px] italic text-foreground/85 mt-1 leading-snug">{line}</p>
    </div>
  );
}

function GreatQuestRow({
  title, line, current, target,
}: { title: string; line: string; current?: number; target?: number }) {
  const hasProgress = typeof current === "number" && typeof target === "number";
  const pct = hasProgress ? Math.min(100, Math.round((current! / target!) * 100)) : 0;
  return (
    <div className="rounded-xl border border-amber-900/20 bg-card/40 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif text-sm text-foreground">{title}</p>
          <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-snug">{line}</p>
        </div>
        {hasProgress && (
          <span className="font-serif text-[10px] text-muted-foreground shrink-0">
            {current} / {target}
          </span>
        )}
      </div>
      {hasProgress && <Progress value={pct} className="h-1 bg-muted/40" />}
    </div>
  );
}

function CollapsibleSection({
  title, caption, icon, defaultOpen, children,
}: {
  title: string; caption: string; icon?: React.ReactNode;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="mb-6">
      <CollapsibleTrigger className="group w-full flex items-center justify-between gap-3 px-1 py-2 text-left">
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
            {icon}{title}
          </h2>
          <p className="font-serif text-[11px] italic text-muted-foreground/70 mt-0.5">
            {caption}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChamberSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-24 rounded-xl bg-card/30 animate-pulse" />
      ))}
    </div>
  );
}

