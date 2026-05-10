/**
 * Quest Cave shared types.
 * Frontend-first; designed so each field can later map to a Supabase row
 * without restructuring the UI.
 */
export type QuestLayer =
  | "individual"
  | "circle"
  | "collective"
  | "tetol"
  | "seasonal";

export type QuestFamily =
  | "ancient_guardians"
  | "watershed_paths"
  | "seasonal_wanderers"
  | "species_habitat"
  | "pilgrimage_paths"
  | "family_legacy"
  | "bloom_fruit_harvest"
  | "staff_paths";

export type CircleType =
  | "friends"
  | "family"
  | "staff"
  | "local_grove"
  | "council";

export type QuestStatus =
  | "draft"
  | "active"
  | "under_review"
  | "complete"
  | "archived";

export interface QuestCardData {
  id: string;
  title: string;
  description: string;
  layer: QuestLayer;
  family: QuestFamily;
  status: QuestStatus;
  progressCurrent: number;
  progressTarget?: number;
  progressLabel?: string;
  heartsEarned?: number;
  myContribution?: number;
  collectivePool?: number;
  nextAction?: string;
  /** Where the primary CTA leads. Defaults to /map when omitted. */
  actionTo?: string;
  actionLabel?: string;
  circleType?: CircleType;
  circleName?: string;
  membersCount?: number;
  relatedTreeIds?: string[];
}

export const FAMILY_LABEL: Record<QuestFamily, string> = {
  ancient_guardians: "Ancient Guardians",
  watershed_paths: "Watershed Paths",
  seasonal_wanderers: "Seasonal Wanderers",
  species_habitat: "Species & Habitat",
  pilgrimage_paths: "Pilgrimage Paths",
  family_legacy: "Family & Legacy",
  bloom_fruit_harvest: "Bloom, Fruit & Harvest",
  staff_paths: "Staff Paths",
};

export const CIRCLE_LABEL: Record<CircleType, string> = {
  friends: "Friends Circle",
  family: "Family Grove",
  staff: "Staff Circle",
  local_grove: "Local Grove",
  council: "Council Circle",
};
