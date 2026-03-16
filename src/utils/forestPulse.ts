/**
 * Forest Pulse Engine — observes existing ecosystem data
 * and surfaces living patterns across trees, groves, and regions.
 *
 * Pulse levels: quiet → stirring → growing → vibrant → forest_awakened
 */

export type PulseLevel = "quiet" | "stirring" | "growing" | "vibrant" | "forest_awakened";

export interface PulseSignal {
  id: string;
  type: "tree" | "grove" | "species" | "region";
  name: string;
  pulse: PulseLevel;
  score: number; // 0–100
  lat?: number;
  lng?: number;
  radius_m?: number;
  story?: string;
  signals: PulseSignalDetail[];
  species?: string;
  region?: string;
}

export interface PulseSignalDetail {
  label: string;
  value: number;
  icon: string;
}

export const PULSE_LABELS: Record<PulseLevel, string> = {
  quiet: "Quiet",
  stirring: "Stirring",
  growing: "Growing",
  vibrant: "Vibrant",
  forest_awakened: "Forest Awakened",
};

export const PULSE_COLORS: Record<PulseLevel, string> = {
  quiet: "text-muted-foreground border-border",
  stirring: "text-amber-600 border-amber-400/30",
  growing: "text-emerald-600 border-emerald-400/30",
  vibrant: "text-primary border-primary/30",
  forest_awakened: "text-amber-500 border-amber-400/40",
};

export const PULSE_OPACITY: Record<PulseLevel, number> = {
  quiet: 0.05,
  stirring: 0.10,
  growing: 0.16,
  vibrant: 0.22,
  forest_awakened: 0.30,
};

export const PULSE_ANIM_DURATION: Record<PulseLevel, number> = {
  quiet: 0,
  stirring: 22,
  growing: 18,
  vibrant: 14,
  forest_awakened: 10,
};

function scoreToPulse(score: number): PulseLevel {
  if (score >= 80) return "forest_awakened";
  if (score >= 55) return "vibrant";
  if (score >= 30) return "growing";
  if (score >= 10) return "stirring";
  return "quiet";
}

function generateStory(type: string, name: string, pulse: PulseLevel, signals: PulseSignalDetail[]): string {
  const activeSignals = signals.filter(s => s.value > 0);
  if (activeSignals.length === 0) return `${name} rests in stillness.`;

  const verbs: Record<PulseLevel, string> = {
    quiet: "rests quietly",
    stirring: "is beginning to stir",
    growing: "is growing in vitality",
    vibrant: "pulses with life",
    forest_awakened: "has awakened",
  };

  return `${name} ${verbs[pulse]}.`;
}

/* ── Tree Pulse ── */
export interface TreeActivity {
  tree_id: string;
  name: string;
  species?: string;
  lat: number;
  lng: number;
  nation?: string;
  visit_count_7d: number;
  offering_count_7d: number;
  whisper_count_7d: number;
}

export function computeTreePulse(activity: TreeActivity): PulseSignal {
  const visitScore = Math.min(30, activity.visit_count_7d * 10);
  const offeringScore = Math.min(35, activity.offering_count_7d * 12);
  const whisperScore = Math.min(35, activity.whisper_count_7d * 15);
  const score = Math.round(visitScore + offeringScore + whisperScore);
  const pulse = scoreToPulse(score);

  const signals: PulseSignalDetail[] = [
    { label: "Visits", value: activity.visit_count_7d, icon: "👣" },
    { label: "Offerings", value: activity.offering_count_7d, icon: "🎵" },
    { label: "Whispers", value: activity.whisper_count_7d, icon: "💨" },
  ];

  return {
    id: `tree-${activity.tree_id}`,
    type: "tree",
    name: activity.name,
    pulse,
    score,
    lat: activity.lat,
    lng: activity.lng,
    signals,
    species: activity.species,
    region: activity.nation,
    story: generateStory("tree", activity.name, pulse, signals),
  };
}

/* ── Grove Pulse ── */
export interface GroveActivity {
  grove_id: string;
  name: string;
  grove_type: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  tree_count: number;
  visit_count_7d: number;
  offering_count_7d: number;
  whisper_count_7d: number;
  new_trees_7d: number;
  species?: string;
}

export function computeGrovePulse(activity: GroveActivity): PulseSignal {
  const visitScore = Math.min(25, activity.visit_count_7d * 5);
  const offeringScore = Math.min(25, activity.offering_count_7d * 8);
  const whisperScore = Math.min(15, activity.whisper_count_7d * 10);
  const growthScore = Math.min(20, activity.new_trees_7d * 10);
  const sizeBonus = Math.min(15, Math.floor(activity.tree_count / 3) * 5);
  const score = Math.round(visitScore + offeringScore + whisperScore + growthScore + sizeBonus);
  const pulse = scoreToPulse(score);

  const signals: PulseSignalDetail[] = [
    { label: "Visits", value: activity.visit_count_7d, icon: "👣" },
    { label: "Offerings", value: activity.offering_count_7d, icon: "🎵" },
    { label: "Whispers", value: activity.whisper_count_7d, icon: "💨" },
    { label: "New trees", value: activity.new_trees_7d, icon: "🌱" },
  ];

  return {
    id: `grove-${activity.grove_id}`,
    type: "grove",
    name: activity.name,
    pulse,
    score,
    lat: activity.center_lat,
    lng: activity.center_lng,
    radius_m: activity.radius_m,
    signals,
    species: activity.species,
    story: generateStory("grove", activity.name, pulse, signals),
  };
}

/* ── Region Pulse ── */
export interface RegionActivity {
  region: string;
  center_lat: number;
  center_lng: number;
  tree_count: number;
  new_trees_7d: number;
  visit_count_7d: number;
  offering_count_7d: number;
  grove_count: number;
  new_groves_7d: number;
}

export function computeRegionPulse(activity: RegionActivity): PulseSignal {
  const treeGrowth = Math.min(25, activity.new_trees_7d * 5);
  const visitScore = Math.min(25, activity.visit_count_7d * 4);
  const offeringScore = Math.min(20, activity.offering_count_7d * 6);
  const groveScore = Math.min(15, activity.new_groves_7d * 15);
  const sizeBonus = Math.min(15, Math.floor(activity.tree_count / 10) * 3);
  const score = Math.round(treeGrowth + visitScore + offeringScore + groveScore + sizeBonus);
  const pulse = scoreToPulse(score);

  const signals: PulseSignalDetail[] = [
    { label: "New trees", value: activity.new_trees_7d, icon: "🌱" },
    { label: "Visits", value: activity.visit_count_7d, icon: "👣" },
    { label: "Offerings", value: activity.offering_count_7d, icon: "🎵" },
    { label: "New groves", value: activity.new_groves_7d, icon: "🌳" },
  ];

  return {
    id: `region-${activity.region}`,
    type: "region",
    name: activity.region,
    pulse,
    score,
    lat: activity.center_lat,
    lng: activity.center_lng,
    radius_m: 50000,
    signals,
    region: activity.region,
    story: generateStory("region", activity.region, pulse, signals),
  };
}

/* ── Species Pulse ── */
export interface SpeciesActivity {
  species: string;
  tree_count: number;
  new_trees_7d: number;
  grove_count: number;
  visit_count_7d: number;
  center_lat: number;
  center_lng: number;
}

export function computeSpeciesPulse(activity: SpeciesActivity): PulseSignal {
  const growth = Math.min(30, activity.new_trees_7d * 8);
  const groveSignal = Math.min(25, activity.grove_count * 10);
  const visits = Math.min(25, activity.visit_count_7d * 5);
  const sizeBonus = Math.min(20, Math.floor(activity.tree_count / 5) * 4);
  const score = Math.round(growth + groveSignal + visits + sizeBonus);
  const pulse = scoreToPulse(score);

  const signals: PulseSignalDetail[] = [
    { label: "Trees", value: activity.tree_count, icon: "🌳" },
    { label: "New this week", value: activity.new_trees_7d, icon: "🌱" },
    { label: "Groves", value: activity.grove_count, icon: "🌿" },
    { label: "Visits", value: activity.visit_count_7d, icon: "👣" },
  ];

  return {
    id: `species-${activity.species}`,
    type: "species",
    name: `${activity.species} Trees`,
    pulse,
    score,
    lat: activity.center_lat,
    lng: activity.center_lng,
    radius_m: 30000,
    signals,
    species: activity.species,
    story: generateStory("species", `${activity.species}`, pulse, signals),
  };
}
