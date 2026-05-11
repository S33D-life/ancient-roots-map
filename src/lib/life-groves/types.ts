/**
 * Life Groves — shared types and constants.
 * Living tree-libraries for life events. Outer form: an ethereal tree.
 * Inner form: the Heartwood library of offerings.
 */

export type GroveType =
  | "birth"
  | "memorial"
  | "christening"
  | "birthday"
  | "union"
  | "companion"
  | "family"
  | "community"
  | "custom";

export type TreeArchetype =
  | "oak"
  | "yew"
  | "hazel"
  | "apple"
  | "olive"
  | "beech"
  | "ash"
  | "other";

export type PlantingType =
  | "symbolic_ethereal_tree"
  | "dedicate_existing_tree"
  | "plant_new_tree";

export type Privacy = "private_family" | "invite_only" | "public";

export type PlantingPackage = "symbolic" | "seedling" | "young_tree" | "grove_circle";

export type OfferingType =
  | "story"
  | "photo"
  | "song"
  | "book"
  | "poem"
  | "recipe"
  | "letter"
  | "voice_note"
  | "video";

export const GROVE_TYPES: Array<{ value: GroveType; label: string; hint: string }> = [
  { value: "birth", label: "Birth Grove", hint: "Welcoming a new life" },
  { value: "memorial", label: "Memorial Grove", hint: "Holding a life remembered" },
  { value: "christening", label: "Christening Grove", hint: "A naming or blessing" },
  { value: "birthday", label: "Birthday Grove", hint: "A year well lived" },
  { value: "union", label: "Union Grove", hint: "Wedding, partnership, vow" },
  { value: "companion", label: "Companion Grove", hint: "A pet or animal friend" },
  { value: "family", label: "Family Grove", hint: "An ongoing lineage" },
  { value: "community", label: "Community Grove", hint: "A shared milestone" },
  { value: "custom", label: "Other", hint: "Your own meaningful moment" },
];

export const TREE_ARCHETYPES: Array<{
  value: TreeArchetype;
  label: string;
  description: string;
  hueA: number; // base leaf hue
  hueB: number; // bark / accent hue
}> = [
  { value: "oak", label: "Oak", description: "Endurance, lineage, the long memory.", hueA: 95, hueB: 30 },
  { value: "yew", label: "Yew", description: "Threshold tree — between worlds.", hueA: 145, hueB: 200 },
  { value: "hazel", label: "Hazel", description: "Wisdom, listening, gentle counsel.", hueA: 70, hueB: 40 },
  { value: "apple", label: "Apple", description: "Sweetness, gathering, family table.", hueA: 110, hueB: 0 },
  { value: "olive", label: "Olive", description: "Peace, anointing, lasting light.", hueA: 75, hueB: 55 },
  { value: "beech", label: "Beech", description: "Quiet strength, books of the forest.", hueA: 90, hueB: 35 },
  { value: "ash", label: "Ash", description: "Spear of sky and earth, world-tree.", hueA: 130, hueB: 220 },
  { value: "other", label: "Other", description: "A tree only you know.", hueA: 100, hueB: 30 },
];

export const PRIVACY_OPTIONS: Array<{ value: Privacy; label: string; hint: string }> = [
  { value: "private_family", label: "Private — family only", hint: "Only you and chosen kin." },
  { value: "invite_only", label: "Invite only", hint: "Anyone with the invite link can leave an offering." },
  { value: "public", label: "Public", hint: "Open to all who wander past." },
];

export const PLANTING_PACKAGES: Array<{
  value: PlantingPackage;
  label: string;
  pricePence: number;
  hint: string;
}> = [
  { value: "symbolic", label: "Symbolic Ethereal Tree", pricePence: 0, hint: "A tree held in Heartwood." },
  { value: "seedling", label: "Seedling", pricePence: 3300, hint: "A small offering toward planting." },
  { value: "young_tree", label: "Young Tree", pricePence: 9900, hint: "A young tree dedicated in your name." },
  { value: "grove_circle", label: "Grove Circle", pricePence: 33300, hint: "A small grove circle dedicated together." },
];

export const OFFERING_TYPES: Array<{
  value: OfferingType;
  label: string;
  glyph: string;
}> = [
  { value: "story", label: "Story", glyph: "🍃" },
  { value: "photo", label: "Photo", glyph: "🖼️" },
  { value: "song", label: "Song", glyph: "🎵" },
  { value: "book", label: "Book", glyph: "📖" },
  { value: "poem", label: "Poem", glyph: "📜" },
  { value: "recipe", label: "Recipe", glyph: "🍎" },
  { value: "letter", label: "Letter", glyph: "✉️" },
  { value: "voice_note", label: "Voice note", glyph: "🏮" },
  { value: "video", label: "Video", glyph: "🪟" },
];

export interface LifeGrove {
  id: string;
  created_by: string;
  grove_type: GroveType;
  grove_title: string;
  remembered_or_celebrated_name: string | null;
  relationship_label: string | null;
  tree_name: string | null;
  tree_archetype_species: TreeArchetype;
  tree_species_detail: string | null;
  planting_type: PlantingType;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  event_date: string | null;
  birth_date: string | null;
  passing_date: string | null;
  story_intro: string | null;
  privacy: Privacy;
  planting_package: PlantingPackage;
  package_price_pence: number;
  hearts_applied: number;
  discount_pence: number;
  cover_photo_url: string | null;
  generated_tree_image_url: string | null;
  invite_token: string;
  created_at: string;
  updated_at: string;
}

export interface LifeGroveOffering {
  id: string;
  life_grove_id: string;
  contributor_user_id: string | null;
  contributor_name: string;
  contributor_email: string | null;
  offering_type: OfferingType;
  title: string | null;
  body_text: string | null;
  media_url: string | null;
  visibility: "family_only" | "public";
  memory_position_data: unknown | null;
  created_at: string;
}

/** Hearts → discount maths. 1 heart = £0.01, capped at 33% of package. */
export function calcHeartsDiscount(packagePence: number, heartsApplied: number) {
  const requestedPence = Math.max(0, Math.floor(heartsApplied));
  const cap = Math.floor(packagePence * 0.33);
  const discountPence = Math.min(requestedPence, cap);
  const totalPence = Math.max(0, packagePence - discountPence);
  return { discountPence, totalPence, capPence: cap };
}

export function formatGBP(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}
