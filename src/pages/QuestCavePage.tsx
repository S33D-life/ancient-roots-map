/**
 * QuestCavePage — /heartwood/quest-cave
 *
 * Chamber-based, immersive UX. Reads like entering a living cave beneath
 * the Heartwood: progressive revelation, spatial hierarchy, mystery first,
 * dense data only after a chamber is opened.
 *
 * Structure:
 *   1. Cave Entrance hero (atmosphere + Current Path chamber)
 *   2. TEOTAG guidance panel
 *   3. Regalia chamber
 *   4. Pathway gateways: Explore · Steward · Learn · Grow the Commons
 *   5. Living Notice Board
 *   6. Deeper Chambers (preserved data layers, lazy)
 *   7. Bridge back to Heartwood
 *
 * All previously-rendered chambers (Seasonal, Dream Trees, Heart Flow,
 * Spark/Bug Bounty, Blooming Map, Path Archetypes) remain available inside
 * "Deeper Chambers" so no data-driven feature is lost.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Mountain, Compass, Sparkles, Leaf, Trophy, ArrowRight,
  Footprints, Hand, BookOpen, Sprout,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuestCaveActivity } from "@/hooks/use-quest-cave-activity";
import { useLivingProgression } from "@/hooks/use-living-progression";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { ROUTES } from "@/lib/routes";
import { ChamberSkeleton } from "@/components/library/HeartwoodChamber";
import {
  currentSeason, nextMilestone, SPECIES_MILESTONES,
} from "@/lib/quest-cave/livingPaths";

import CaveAtmosphere from "@/components/quest-cave/CaveAtmosphere";
import CurrentPathChamber from "@/components/quest-cave/CurrentPathChamber";
import TeotagGuidancePanel, {
  type TeotagHint,
} from "@/components/quest-cave/TeotagGuidancePanel";
import RegaliaChamber from "@/components/quest-cave/RegaliaChamber";
import PathwayGateway from "@/components/quest-cave/PathwayGateway";
import QuestChamberCard from "@/components/quest-cave/QuestChamberCard";
import OpportunitiesBoard, {
  type OpportunityNote,
} from "@/components/quest-cave/OpportunitiesBoard";

// Heavier chambers are lazy — only mounted when the user opens them.
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
  const speciesPct = Math.min(100, Math.round((speciesCount / Math.max(1, speciesNext)) * 100));

  // Derive a "current path" from the wanderer's actual lean.
  const currentPath = derivePath(progression.hiveCounts, progression.ancientCount);
  const streakLine =
    activity.visits > 0
      ? `${activity.visits} visit${activity.visits === 1 ? "" : "s"} woven`
      : "Awaiting your first visit";

  const teotagHints = useMemo<TeotagHint[]>(() => {
    const hints: TeotagHint[] = [];
    if (speciesNext - speciesCount <= 5 && speciesNext > speciesCount) {
      hints.push({
        kind: "Resonance",
        line: `Only ${speciesNext - speciesCount} species more to break a new seal.`,
      });
    }
    hints.push({
      kind: "Season",
      line: `${season} stirs in the canopy — what's leafing, blooming, or letting go near you?`,
    });
    if (activity.globalTrees > 0) {
      hints.push({
        kind: "Commons",
        line: `${activity.globalTrees.toLocaleString()} ancient friends already mapped by the wider grove.`,
      });
    }
    if (!staff && !identity.hasPermanent) {
      hints.push({
        kind: "Nearby",
        line: "A Borrowed Staff waits to walk beside you — sign in to receive your first guide.",
      });
    } else if (staff) {
      hints.push({
        kind: "Whisper",
        line: `${staff.temporary_name} stirs near old paths and hidden hollows.`,
      });
    }
    return hints;
  }, [speciesCount, speciesNext, season, activity.globalTrees, staff, identity.hasPermanent]);

  const noticeBoard = useMemo<OpportunityNote[]>(() => {
    const notes: OpportunityNote[] = [];
    notes.push({
      id: "season-walk",
      kind: "Seasonal",
      title: `${season} walk`,
      line: "Visit one tree this week and note what's changed.",
      to: ROUTES.MAP,
      accent: "hsl(150 50% 45%)",
    });
    notes.push({
      id: "council",
      kind: "Council",
      title: "Council of Life",
      line: "Bi-weekly gathering at the New & Full Moon.",
      to: ROUTES.COUNCIL,
      accent: "hsl(265 45% 55%)",
    });
    notes.push({
      id: "hives",
      kind: "Species DAO",
      title: "Visit a hive",
      line: "Tend the lineage of a single species across the world.",
      to: ROUTES.HIVES,
      accent: "hsl(38 80% 55%)",
    });
    if (activity.trees === 0) {
      notes.push({
        id: "first-tree",
        kind: "Local",
        title: "Map your first ancient friend",
        line: "A tree near you is waiting to be remembered.",
        to: ROUTES.ADD_TREE,
        accent: "hsl(195 55% 50%)",
      });
    }
    return notes;
  }, [season, activity.trees]);

  return (
    <div className="min-h-screen relative overflow-hidden botanical-heartwood">
      <Header />
      <div
        className="relative z-10 max-w-3xl mx-auto px-4 pb-32"
        style={{ paddingTop: "var(--content-top)" }}
      >
        {/* ── 1. Cave Entrance hero ──────────────────── */}
        <section className="relative rounded-3xl overflow-hidden border border-amber-900/30 mb-6">
          <CaveAtmosphere spores={18} />
          <div className="relative px-5 sm:px-7 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 border border-amber-700/40 mb-3 backdrop-blur-sm">
              <Mountain className="w-6 h-6 text-amber-700/90 dark:text-amber-300/90" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground tracking-wide">
              Quest Cave
            </h1>
            <p className="text-sm sm:text-base font-serif text-muted-foreground mt-2 italic max-w-md mx-auto leading-relaxed">
              Choose your path through the living commons.
            </p>
          </div>
        </section>

        {/* Current Path chamber (hero card) */}
        <div className="mb-5">
          <CurrentPathChamber
            pathName={currentPath.name}
            level={currentPath.level}
            percent={speciesPct}
            streak={streakLine}
            nextMilestone={
              speciesNext > speciesCount
                ? `${speciesNext - speciesCount} species to next seal`
                : "All seals broken — keep wandering"
            }
            resonanceBonuses={currentPath.bonuses}
            ctaLabel="Continue your path"
            ctaTo={ROUTES.MAP}
          />
        </div>

        {/* ── 2. TEOTAG guidance ─────────────────────── */}
        <div className="mb-6">
          <TeotagGuidancePanel hints={teotagHints} />
        </div>

        {/* ── 3. Regalia ─────────────────────────────── */}
        <div className="mb-6">
          <RegaliaChamber
            staffName={
              identity.permanent?.name ??
              identity.permanent?.species ??
              staff?.temporary_name ??
              null
            }
            staffSpecies={
              identity.permanent?.species ?? staff?.archetype_species ?? null
            }
            isPermanent={identity.hasPermanent}
            speciesCount={speciesCount}
            visits={activity.visits}
            affinityDepth={deepestHive(progression.hiveCounts)}
            affinitySpecies={(progression.recentSpecies ?? []).slice(0, 6)}
            sigils={deriveSigils(activity, speciesCount, progression.ancientCount)}
            streak={streakLine}
          />
        </div>

        {/* ── 4. Pathway Gateways ────────────────────── */}
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Pathways
          </h2>
          <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Four cave entrances
          </p>
        </div>
        <div className="space-y-3 mb-8">
          <PathwayGateway
            title="Explore"
            subtitle="Wander, witness, remember."
            teaser="Visit ancient friends, walk seasonal trails, find what's near."
            icon={<Footprints className="w-5 h-5 text-foreground/85" />}
            glow="hsl(195 60% 55% / 0.55)"
          >
            <QuestChamberCard
              title="Walk a seasonal trail"
              poeticLine="Step into what the season is teaching."
              rewardPreview="+11 hearts · seasonal resonance"
              current={activity.visits}
              target={Math.max(3, activity.visits + 1)}
              roots={["Wonder", "Place"]}
              branches={["Visits", "Memory"]}
              lore="The season changes the same path twice. Walk it once now and once later — what differs becomes a small act of remembering."
              ctaTo={ROUTES.MAP}
              accent="hsl(195 60% 55%)"
            />
            <QuestChamberCard
              title="Meet a new species"
              poeticLine="Add one unfamiliar leaf to your knowing."
              rewardPreview={`${speciesCount}/${speciesNext} to next seal`}
              current={speciesCount}
              target={speciesNext}
              roots={["Wonder", "Knowledge"]}
              branches={["Species", "Hives"]}
              lore="Breadth across the canopy. A new species learnt is a new neighbour kept."
              ctaTo={ROUTES.HIVES}
              accent="hsl(195 60% 55%)"
            />
          </PathwayGateway>

          <PathwayGateway
            title="Steward"
            subtitle="Tend, verify, protect."
            teaser="Map ancient friends, refine locations, hold council."
            icon={<Hand className="w-5 h-5 text-foreground/85" />}
            glow="hsl(150 50% 45% / 0.55)"
          >
            <QuestChamberCard
              title="Map an ancient friend"
              poeticLine="A tree near you is waiting to be remembered."
              rewardPreview="+11 hearts · stewardship"
              current={activity.trees}
              target={Math.max(1, activity.trees + 1)}
              roots={["Care", "Place"]}
              branches={["Atlas", "Lineage"]}
              lore="Mapping is a quiet ceremony. Stand beneath the canopy, mark the place, and the tree enters the living atlas."
              ctaTo={ROUTES.ADD_TREE}
              accent="hsl(150 50% 45%)"
            />
            <QuestChamberCard
              title="Sit with the Council"
              poeticLine="Hold a moon-cycle gathering with the grove."
              rewardPreview="Council resonance"
              roots={["Care", "Community"]}
              branches={["Council", "Lineage"]}
              lore="Bi-weekly at New and Full Moon. A small circle of stewards meets to listen for what the trees are asking."
              ctaTo={ROUTES.COUNCIL}
              accent="hsl(150 50% 45%)"
            />
          </PathwayGateway>

          <PathwayGateway
            title="Learn"
            subtitle="Read the roots, study the lineage."
            teaser="Open the bookshelf, the staff room, and species lore."
            icon={<BookOpen className="w-5 h-5 text-foreground/85" />}
            glow="hsl(38 80% 55% / 0.55)"
          >
            <QuestChamberCard
              title="Enter the Staff Room"
              poeticLine="Trace the lineage that walks beside you."
              rewardPreview="Lineage unlocks"
              roots={["Knowledge", "Lineage"]}
              branches={["Staff", "Memory"]}
              lore={
                staff
                  ? `${staff.temporary_name} carries the resonance of the ${staff.archetype_species ?? "wild"} circle.`
                  : "Your first guide will be offered when you sign in."
              }
              ctaTo={ROUTES.STAFF_ROOM}
              accent="hsl(38 80% 55%)"
            />
            <QuestChamberCard
              title="Visit a Species Hive"
              poeticLine="One species, all its kin across the world."
              rewardPreview="Hive insight"
              roots={["Knowledge", "Wonder"]}
              branches={["Species", "Hives"]}
              ctaTo={ROUTES.HIVES}
              accent="hsl(38 80% 55%)"
            />
          </PathwayGateway>

          <PathwayGateway
            title="Grow the Commons"
            subtitle="Offerings, seeds, and shared craft."
            teaser="Make offerings, send seeds, support the living atlas."
            icon={<Sprout className="w-5 h-5 text-foreground/85" />}
            glow="hsl(335 50% 60% / 0.55)"
          >
            <QuestChamberCard
              title="Make an offering"
              poeticLine="A poem, a song, a photo, a whispered thank-you."
              rewardPreview="+11 hearts · creator path"
              current={activity.offerings}
              target={Math.max(1, activity.offerings + 1)}
              roots={["Craft", "Care"]}
              branches={["Offerings", "Memory"]}
              lore="Offerings are the breath of the commons — small acts that prove the trees are loved."
              ctaTo={ROUTES.MAP}
              accent="hsl(335 50% 60%)"
            />
            <QuestChamberCard
              title="Hold a Life Grove"
              poeticLine="Gather a small circle around a few rooted trees."
              rewardPreview="Grove formation"
              roots={["Care", "Community"]}
              branches={["Groves", "Council"]}
              ctaTo="/heartwood/life-groves"
              accent="hsl(335 50% 60%)"
            />
            <QuestChamberCard
              title="1,000 Ancient Friends"
              poeticLine="A vow held by the whole forest."
              rewardPreview="Collective seal"
              current={activity.globalTrees}
              target={1000}
              roots={["Care", "Place"]}
              branches={["Atlas", "Council"]}
              lore="Not a personal goal — a shared one. Every map you draw moves the whole grove forward."
              ctaTo={ROUTES.MAP}
              accent="hsl(335 50% 60%)"
            />
          </PathwayGateway>
        </div>

        {/* ── 5. Living Notice Board ─────────────────── */}
        <div className="mb-8">
          <OpportunitiesBoard notes={noticeBoard} />
        </div>

        {/* ── 6. Deeper Chambers (preserved data layers) ── */}
        <details className="group rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden mb-6 focus-within:border-primary/40">
          <summary
            className="cursor-pointer list-none p-4 flex items-center gap-2 min-h-[56px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
            aria-label="Deeper Chambers — seasonal quests, dream trees, heart flow, blooming map"
          >
            <Sparkles className="w-4 h-4 text-primary/80" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base text-foreground">Deeper Chambers</p>
              <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-snug">
                Seasonal quests, dream trees, heart flow, blooming map.
              </p>
            </div>
            <span className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 group-open:hidden">
              Open
            </span>
            <span className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 hidden group-open:inline">
              Close
            </span>
          </summary>
          <div className="px-4 pb-5 space-y-6">
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
              <FourSeasonsCard
                currentSeason={sKey}
                touchedSeasons={new Set(activity.visits > 0 ? [sKey] : [])}
              />
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
            </Suspense>
          </div>
        </details>

        {/* ── 7. Bridge back ─────────────────────────── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <Trophy className="w-4 h-4 text-primary/80 mx-auto mb-1.5" />
          <p className="text-xs font-serif text-foreground/80 italic">
            Your steps echo through the chambers.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <Button asChild size="sm" variant="outline" className="font-serif text-xs">
              <Link to="/library">
                <Leaf className="w-3 h-3 mr-1" /> Heartwood
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="font-serif text-xs">
              <Link to={ROUTES.MAP}>
                Open Map <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────

function derivePath(
  hives: Record<string, number>,
  ancientCount: number,
): { name: string; level: string; bonuses: string[] } {
  const top = Object.entries(hives).sort((a, b) => b[1] - a[1])[0];
  if (ancientCount >= 3) {
    return {
      name: "Ancient Avenue Walker",
      level: levelFor(ancientCount, [1, 3, 6, 12, 24]),
      bonuses: [
        "Elders aged 200+ years counted twice",
        "Council whispers travel further from your steps",
      ],
    };
  }
  if (top && top[1] >= 2) {
    const species = top[0].charAt(0).toUpperCase() + top[0].slice(1);
    return {
      name: `${species} Path Wanderer`,
      level: levelFor(top[1], [1, 3, 6, 12, 24]),
      bonuses: [
        `${species} encounters resonate with the hive`,
        "Lineage cards appear when you sit with kin",
      ],
    };
  }
  return {
    name: "Threshold Wanderer",
    level: "Level 1 Resonance",
    bonuses: ["First steps are remembered", "The cave listens patiently"],
  };
}

function levelFor(value: number, thresholds: number[]): string {
  let lvl = 1;
  for (const t of thresholds) if (value >= t) lvl++;
  return `Level ${lvl} Resonance`;
}

function deriveSigils(
  activity: { trees: number; offerings: number; whispersSent: number; visits: number },
  speciesCount: number,
  ancientCount: number,
): string[] {
  const sigils: string[] = [];
  if (activity.trees >= 1) sigils.push("First mapping");
  if (activity.offerings >= 1) sigils.push("First offering");
  if (activity.whispersSent >= 1) sigils.push("First whisper");
  if (activity.visits >= 5) sigils.push("Returning steps");
  if (speciesCount >= 5) sigils.push("Species seal I");
  if (speciesCount >= 12) sigils.push("Species seal II");
  if (ancientCount >= 1) sigils.push("Met an elder");
  return sigils;
}
