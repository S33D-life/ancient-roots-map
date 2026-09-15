/**
 * Shared allow-list of tree fields a person may change directly or propose.
 * Mirrors the database function public.tree_editable_fields() — the database
 * remains authoritative; this list only shapes the form.
 *
 * Ownership, identifiers, timestamps, merge pointers and other administrative
 * columns must never appear here.
 */
export type TreeFieldKey =
  | "name"
  | "species"
  | "description"
  | "lore_text"
  | "estimated_age"
  | "latitude"
  | "longitude"
  | "what3words"
  | "access_notes"
  | "girth_cm"
  | "planted_year"
  | "variety_name";

export const TREE_EDITABLE_FIELDS: TreeFieldKey[] = [
  "name",
  "species",
  "description",
  "lore_text",
  "estimated_age",
  "latitude",
  "longitude",
  "what3words",
  "access_notes",
  "girth_cm",
  "planted_year",
  "variety_name",
];

export interface TreeTextField {
  key: Exclude<TreeFieldKey, "latitude" | "longitude">;
  label: string;
  hint?: string;
  long?: boolean;
  numeric?: boolean;
}

/** Fields offered on the Details tab, in the order a person reads them. */
export const TREE_TEXT_FIELDS: TreeTextField[] = [
  { key: "name", label: "Tree name" },
  { key: "species", label: "Species" },
  { key: "variety_name", label: "Variety", hint: "Optional" },
  { key: "estimated_age", label: "Estimated age (years)", numeric: true },
  { key: "planted_year", label: "Planted year", numeric: true },
  { key: "girth_cm", label: "Girth (cm)", numeric: true },
  { key: "what3words", label: "what3words", hint: "Optional — e.g. ///word.word.word" },
  { key: "description", label: "Description", long: true },
  { key: "lore_text", label: "Lore & stories", long: true },
  { key: "access_notes", label: "Access notes", long: true, hint: "How a visitor reaches this tree" },
];

/**
 * Interactions that count as another person helping grow a tree's digital twin.
 * Mirrors the triggers feeding public.tree_growth_events.
 */
export const TREE_GROWTH_EVENT_SOURCES = [
  "offering",
  "checkin",
  "contribution",
  "location_refinement",
  "phenology_observation",
  "stewardship_action",
] as const;
