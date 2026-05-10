/**
 * Mock quest data for the Quest Cave v1.
 *
 * TODO: replace each builder with Supabase-backed hooks once quest tables
 * exist. The shape returned here intentionally matches QuestCardData so the
 * UI can stay untouched when wiring goes live.
 */
import { ROUTES } from "@/lib/routes";
import type { QuestCaveActivity } from "@/hooks/use-quest-cave-activity";
import type { QuestCardData, QuestStatus } from "./types";

const statusFor = (cur: number, target: number): QuestStatus =>
  cur >= target ? "complete" : cur > 0 ? "active" : "draft";

// ── Tab 1 — My Paths (uses real activity counters where available) ──────
export function buildMyPaths(a: QuestCaveActivity): QuestCardData[] {
  return [
    {
      id: "mp-ancient-oak-100",
      title: "Ancient Oak Hundred",
      description: "Meet 100 ancient oaks over your lifetime.",
      layer: "individual",
      family: "ancient_guardians",
      status: statusFor(a.trees, 100),
      progressCurrent: Math.min(a.trees, 100),
      progressTarget: 100,
      heartsEarned: a.trees * 10,
      nextAction: "View eligible trees",
      actionTo: `${ROUTES.MAP}?quest=ancient-oak-hundred`,
      actionLabel: "Find an oak nearby",
    },
    {
      id: "mp-year-of-trees",
      title: "Year of Trees",
      description: "Map or visit one tree every week for 52 weeks.",
      layer: "individual",
      family: "pilgrimage_paths",
      status: statusFor(a.trees + a.visits, 52),
      progressCurrent: Math.min(a.trees + a.visits, 52),
      progressTarget: 52,
      heartsEarned: Math.min(a.trees + a.visits, 52) * 5,
      actionTo: ROUTES.MAP,
      actionLabel: "Visit a tree this week",
    },
    {
      id: "mp-churchyard-grove",
      title: "Churchyard Grove",
      description: "Map trees in 33 churchyards.",
      layer: "individual",
      family: "pilgrimage_paths",
      status: "draft",
      progressCurrent: 0,
      progressTarget: 33,
      progressLabel: "0 / 33 churchyards",
      actionTo: `${ROUTES.MAP}?quest=churchyard-grove`,
      actionLabel: "Open the map",
    },
    {
      id: "mp-bloom-fruit-harvest",
      title: "Bloom, Fruit & Harvest",
      description: "Record trees flowering, fruiting, seeding, and ripening.",
      layer: "individual",
      family: "bloom_fruit_harvest",
      status: a.blooms > 0 ? "active" : "draft",
      progressCurrent: a.blooms,
      progressLabel: `${a.blooms} records this year`,
      heartsEarned: a.blooms * 2,
      actionTo: ROUTES.MAP,
      actionLabel: "Record a bloom",
    },
    {
      id: "mp-staff-path",
      title: "Staff Path",
      description: "Walk with a Staff. Verify and bless trees you meet.",
      layer: "individual",
      family: "staff_paths",
      status: "draft",
      progressCurrent: 0,
      progressTarget: 11,
      actionTo: ROUTES.STAFF_ROOM,
      actionLabel: "Visit the Staff Room",
    },
  ];
}

// ── Tab 2 — Circles (mock placeholders, wire to circles tables later) ──
export const MOCK_CIRCLE_QUESTS: QuestCardData[] = [
  {
    id: "cq-friends-33",
    title: "33 Trees Together",
    description: "Your friends circle is mapping ancient friends side by side.",
    layer: "circle",
    family: "ancient_guardians",
    circleType: "friends",
    circleName: "Friends Circle",
    membersCount: 6,
    status: "active",
    progressCurrent: 8,
    progressTarget: 33,
    myContribution: 2,
    nextAction: "Add a tree your circle hasn't met",
    actionTo: ROUTES.MAP,
  },
  {
    id: "cq-family-13",
    title: "13 Seasonal Visits",
    description: "Return together across the seasons.",
    layer: "circle",
    family: "family_legacy",
    circleType: "family",
    circleName: "Family Grove",
    membersCount: 4,
    status: "active",
    progressCurrent: 4,
    progressTarget: 13,
    myContribution: 1,
    actionTo: ROUTES.MAP,
    actionLabel: "Plan a return visit",
  },
  {
    id: "cq-staff-100",
    title: "Verify 100 Trees",
    description: "Staff circle review of unverified Ancient Friend records.",
    layer: "circle",
    family: "staff_paths",
    circleType: "staff",
    circleName: "Staff Circle",
    membersCount: 9,
    status: "under_review",
    progressCurrent: 22,
    progressTarget: 100,
    myContribution: 3,
    actionTo: ROUTES.STAFF_ROOM,
    actionLabel: "Open Staff Room",
  },
  {
    id: "cq-grove-riverbank",
    title: "Riverbank Fifty",
    description: "Local grove mapping trees along the riverbank.",
    layer: "circle",
    family: "watershed_paths",
    circleType: "local_grove",
    circleName: "Local Grove",
    membersCount: 12,
    status: "active",
    progressCurrent: 19,
    progressTarget: 50,
    myContribution: 2,
    actionTo: `${ROUTES.MAP}?quest=riverbank-fifty`,
  },
];

// ── Tab 3 — Collective (network-wide; uses globalTrees/Offerings if present)
export function buildCollective(a: QuestCaveActivity): QuestCardData[] {
  return [
    {
      id: "co-ancient-oak-100",
      title: "Together, Map 100 Ancient Oaks",
      description: "A shared vow across the whole network.",
      layer: "collective",
      family: "ancient_guardians",
      status: "active",
      progressCurrent: Math.min(a.globalTrees, 100),
      progressTarget: 100,
      myContribution: a.trees,
      collectivePool: 1000,
      actionTo: `${ROUTES.MAP}?quest=ancient-oak-hundred`,
      actionLabel: "View on map",
    },
    {
      id: "co-churchyard-33",
      title: "33 Churchyard Trees",
      description: "Map ancient yew, oak, and lime in churchyards together.",
      layer: "collective",
      family: "pilgrimage_paths",
      status: "active",
      progressCurrent: 21,
      progressTarget: 33,
      myContribution: 0,
      collectivePool: 500,
      actionTo: `${ROUTES.MAP}?quest=churchyard-grove`,
    },
    {
      id: "co-riverbank-50",
      title: "50 Riverbank Trees",
      description: "Trees along living waters, mapped by the whole forest.",
      layer: "collective",
      family: "watershed_paths",
      status: "active",
      progressCurrent: 31,
      progressTarget: 50,
      myContribution: 0,
      collectivePool: 600,
      actionTo: `${ROUTES.MAP}?quest=riverbank-fifty`,
    },
    {
      id: "co-spring-bloom",
      title: "Spring Bloom Map",
      description: "Network records of first blossoms this season.",
      layer: "collective",
      family: "bloom_fruit_harvest",
      status: "active",
      progressCurrent: a.globalBlooms || 144,
      progressLabel: `${a.globalBlooms || 144} records this season`,
      myContribution: a.blooms,
      collectivePool: 300,
      actionTo: ROUTES.MAP,
      actionLabel: "Record a bloom",
    },
  ];
}

// ── Tab 5 — Seasonal ─────────────────────────────────────────────────────
export function buildSeasonal(a: QuestCaveActivity): QuestCardData[] {
  return [
    {
      id: "se-first-bloom",
      title: "First Bloom",
      description: "Record the first flower you meet this season.",
      layer: "seasonal",
      family: "bloom_fruit_harvest",
      status: a.blooms > 0 ? "active" : "draft",
      progressCurrent: Math.min(a.blooms, 1),
      progressTarget: 1,
      heartsEarned: 5,
      actionTo: ROUTES.MAP,
      actionLabel: "Record bloom",
    },
    {
      id: "se-orchard-keepers",
      title: "Orchard Keepers",
      description: "Visit five orchards as fruit ripens.",
      layer: "seasonal",
      family: "bloom_fruit_harvest",
      status: "draft",
      progressCurrent: 0,
      progressTarget: 5,
      actionTo: ROUTES.MAP,
    },
    {
      id: "se-pollinator-paths",
      title: "Pollinator Paths",
      description: "Photograph trees in flower with their visiting pollinators.",
      layer: "seasonal",
      family: "species_habitat",
      status: "draft",
      progressCurrent: 0,
      progressTarget: 7,
      actionTo: ROUTES.MAP,
    },
    {
      id: "se-full-moon-returns",
      title: "Full Moon Returns",
      description: "Return to a known tree on each full moon.",
      layer: "seasonal",
      family: "seasonal_wanderers",
      status: "draft",
      progressCurrent: 0,
      progressTarget: 12,
      actionTo: ROUTES.MAP,
    },
  ];
}
