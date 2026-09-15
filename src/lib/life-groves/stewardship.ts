/**
 * Life Groves — stewardship, proposals and tending history.
 *
 * Offerings grow the branches. Stewardship tends the tree.
 *
 * The field allow-list here mirrors the database function
 * `life_grove_content_fields()`. The database is authoritative; this copy
 * only shapes the UI. Never send a raw column name from user input.
 */

export type GroveFieldKey =
  | "grove_title"
  | "remembered_or_celebrated_name"
  | "relationship_label"
  | "tree_name"
  | "tree_archetype_species"
  | "tree_species_detail"
  | "story_intro"
  | "location_text"
  | "event_date"
  | "birth_date"
  | "passing_date"
  | "grove_type"
  | "cover_photo_url"
  | "planted_tree_location_text"
  | "planting_notes";

export interface GroveFieldDef {
  key: GroveFieldKey;
  label: string;
  hint?: string;
  input: "text" | "longtext" | "date" | "archetype" | "grove_type";
}

/** Fields a steward may tend and a contributor may propose. */
export const GROVE_CONTENT_FIELDS: GroveFieldDef[] = [
  { key: "grove_title", label: "Grove name", input: "text" },
  { key: "remembered_or_celebrated_name", label: "Who this grove is for", input: "text" },
  { key: "relationship_label", label: "Relationship", hint: "Grandmother, friend, companion…", input: "text" },
  { key: "tree_name", label: "Tree name", input: "text" },
  { key: "tree_archetype_species", label: "Tree kind", input: "archetype" },
  { key: "tree_species_detail", label: "Tree species detail", input: "text" },
  { key: "grove_type", label: "Kind of grove", input: "grove_type" },
  { key: "story_intro", label: "The story", input: "longtext" },
  { key: "location_text", label: "Place", input: "text" },
  { key: "event_date", label: "Date of the moment", input: "date" },
  { key: "birth_date", label: "Born", input: "date" },
  { key: "passing_date", label: "Passed", input: "date" },
  { key: "planted_tree_location_text", label: "Where the tree stands", input: "text" },
  { key: "planting_notes", label: "Planting notes", input: "longtext" },
];

export const GROVE_FIELD_KEYS = GROVE_CONTENT_FIELDS.map((f) => f.key);

export function isGroveContentField(key: string): key is GroveFieldKey {
  return (GROVE_FIELD_KEYS as string[]).includes(key);
}

export function groveFieldLabel(key: string): string {
  if (key === "linked_tree_id") return "Rooted Ancient Friend";
  if (key === "stewardship") return "Stewardship";
  return GROVE_CONTENT_FIELDS.find((f) => f.key === key)?.label ?? key;
}

export type ProposalStatus = "pending" | "accepted" | "edited_and_accepted" | "declined" | "withdrawn";

export interface GroveEditProposal {
  id: string;
  life_grove_id: string;
  proposed_by: string;
  field_name: string;
  current_value: string | null;
  proposed_value: string | null;
  explanation: string | null;
  status: ProposalStatus;
  reviewer_id: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface GroveSteward {
  id: string;
  life_grove_id: string;
  user_id: string;
  granted_by: string | null;
  steward_role: string;
  granted_at: string;
  revoked_at: string | null;
  note: string | null;
}

export interface GroveTendingEntry {
  id: string;
  life_grove_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  actor_user_id: string | null;
  source: string;
  proposal_id: string | null;
  note: string | null;
  created_at: string;
}

export interface GroveIdentity {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  /** Only ever populated for stewards of this same grove. */
  email?: string | null;
}

export function tendingSourceLabel(source: string): string {
  switch (source) {
    case "accepted_proposal": return "accepted proposal";
    case "rooted_tree_change": return "rooted tree";
    case "steward_grant": return "stewardship granted";
    case "steward_revoke": return "stewardship withdrawn";
    default: return "tended directly";
  }
}
