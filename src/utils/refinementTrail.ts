/**
 * Refinement Trail — pure normalisation of a tree's evolution from its several
 * source tables into one chronological, human-readable model.
 *
 * READ-ONLY. These are pure functions: each `fromX` maps raw rows from one
 * source table into unified `RefinementTrailEntry[]`; `mergeTrail` interleaves
 * them newest-first. No I/O, no writes, no schema assumptions beyond the columns
 * read here. The fetching + name resolution lives in `use-refinement-trail.ts`.
 *
 * Sources unified:
 *   - tree_edit_history     → "direct_edit"
 *   - tree_change_log       → "proposal_accepted" (the applied result of a proposal)
 *   - tree_edit_proposals   → "proposal" (pending / rejected / needs_more_info only;
 *                              accepted ones are represented by their change_log row)
 *   - tree_location_history → "location_refined"
 *   - tree_merge_history    → "merge"
 */

export type RefinementTrailKind =
  | "direct_edit"
  | "proposal_accepted"
  | "proposal"
  | "location_refined"
  | "merge";

export interface FieldDiff {
  field: string;
  from: string | null;
  to: string | null;
}

export interface RefinementTrailEntry {
  /** Stable, source-prefixed id (e.g. "edit:<uuid>") so React keys never collide. */
  id: string;
  kind: RefinementTrailKind;
  /** ISO timestamp the change/event happened. */
  at: string;
  /** User who performed the action (proposer / editor / reviewer / merger). */
  actorId: string | null;
  /** Field-level diffs (may be empty for events like merges). */
  fields: FieldDiff[];
  /** Free-text reason / note, if any. */
  reason: string | null;
  /** Proposal lifecycle status, when kind === "proposal". */
  status?: string;
  /** Non-rendered extras (reviewer id, proposal link, refinement ids, …). */
  meta?: Record<string, unknown>;
}

const str = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);

/** Human field labels, shared with the legacy history view. */
export const TRAIL_FIELD_LABELS: Record<string, string> = {
  name: "Tree Name",
  species: "Species",
  species_key: "Species (canonical)",
  description: "Description",
  latitude: "Latitude",
  longitude: "Longitude",
  location: "Location",
  what3words: "What3Words",
  estimated_age: "Estimated Age",
  age_exact: "Age",
  girth_cm: "Girth",
  lore_text: "Lore",
  access_notes: "Access Notes",
  wish_tags: "Wish Tags",
  merged: "Merged record",
};

export const TRAIL_KIND_LABELS: Record<RefinementTrailKind, string> = {
  direct_edit: "Direct edit",
  proposal_accepted: "Suggestion accepted",
  proposal: "Suggestion",
  location_refined: "Location refined",
  merge: "Merged",
};

// ── tree_edit_history ────────────────────────────────────────────────────────
export interface EditHistoryRow {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  edit_reason: string | null;
  edit_type: string;
  user_id: string;
  created_at: string;
}

/**
 * Edit-history rows whose `edit_type` is *also* recorded in a dedicated table
 * (and surfaced by that table's mapper below). These are cross-written to
 * `tree_edit_history` so it is the one canonical provenance log, but we skip them
 * here so the trail does not display the same event twice — the richer dedicated
 * row (change_log / merge_history / location_history) is the display source.
 */
const MIRRORED_EDIT_TYPES = new Set([
  "proposal_accepted",            // → tree_change_log
  "merge",                        // → tree_merge_history
  "location_refined",             // → tree_location_history
  "location_update_applied",      // (synonym, defensive)
  "checkin_location_refinement",  // (synonym, defensive)
]);

/**
 * Direct edits are one row per field. We coalesce rows sharing the same actor +
 * timestamp + reason (a single multi-field save) into one entry. Rows whose
 * edit_type is mirrored by a dedicated table are skipped (see above) to avoid
 * double-display.
 */
export function fromEditHistory(rows: EditHistoryRow[]): RefinementTrailEntry[] {
  const groups = new Map<string, RefinementTrailEntry>();
  for (const r of rows) {
    if (MIRRORED_EDIT_TYPES.has(r.edit_type)) continue;
    const key = `${r.user_id}|${r.created_at}|${r.edit_reason ?? ""}|${r.edit_type}`;
    const existing = groups.get(key);
    const diff: FieldDiff = { field: r.field_name, from: str(r.old_value), to: str(r.new_value) };
    if (existing) {
      existing.fields.push(diff);
    } else {
      groups.set(key, {
        id: `edit:${r.id}`,
        kind: "direct_edit",
        at: r.created_at,
        actorId: r.user_id,
        fields: [diff],
        reason: r.edit_reason,
      });
    }
  }
  return [...groups.values()];
}

// ── tree_change_log (accepted proposals applied to the tree) ──────────────────
export interface ChangeLogRow {
  id: string;
  change_set: Record<string, unknown> | null;
  previous_values: Record<string, unknown> | null;
  merged_from_proposal_id: string | null;
  merged_by: string | null;
  merged_at: string;
}

export function fromChangeLog(rows: ChangeLogRow[]): RefinementTrailEntry[] {
  return rows.map((r) => {
    const changeSet = r.change_set ?? {};
    const prev = r.previous_values ?? {};
    const fields: FieldDiff[] = Object.keys(changeSet).map((k) => ({
      field: k,
      from: str(prev[k]),
      to: str(changeSet[k]),
    }));
    return {
      id: `change:${r.id}`,
      kind: "proposal_accepted",
      at: r.merged_at,
      actorId: r.merged_by,
      fields,
      reason: null,
      meta: { proposalId: r.merged_from_proposal_id },
    };
  });
}

// ── tree_edit_proposals (open / closed-not-accepted lifecycle) ────────────────
export interface ProposalRow {
  id: string;
  proposed_changes: Record<string, unknown> | null;
  reason: string | null;
  confidence: string | null;
  status: string;
  proposed_by: string;
  reviewer_id: string | null;
  reviewer_note: string | null;
  flags: string[] | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Accepted proposals are intentionally excluded here — they are represented by
 * their applied `tree_change_log` entry (avoids double-counting). Pass the raw
 * rows; this filters internally.
 */
export function fromProposals(rows: ProposalRow[]): RefinementTrailEntry[] {
  return rows
    .filter((r) => r.status !== "accepted")
    .map((r) => {
      const changes = r.proposed_changes ?? {};
      const fields: FieldDiff[] = Object.keys(changes).map((k) => ({
        field: k,
        from: null,
        to: str(changes[k]),
      }));
      // Resolved proposals (rejected / needs_more_info) are dated by their review.
      const at = r.status === "pending" ? r.created_at : r.updated_at ?? r.created_at;
      return {
        id: `proposal:${r.id}`,
        kind: "proposal",
        at,
        actorId: r.proposed_by,
        fields,
        reason: r.reason,
        status: r.status,
        meta: {
          confidence: r.confidence,
          reviewerId: r.reviewer_id,
          reviewerNote: r.reviewer_note,
          flags: r.flags ?? [],
        },
      };
    });
}

// ── tree_location_history ─────────────────────────────────────────────────────
export interface LocationHistoryRow {
  id: string;
  old_latitude: number | null;
  old_longitude: number | null;
  new_latitude: number | null;
  new_longitude: number | null;
  old_confidence: string | null;
  new_confidence: string | null;
  reason: string | null;
  changed_by: string | null;
  refinement_ids: string[] | null;
  created_at: string;
}

const coord = (lat: number | null, lng: number | null, conf: string | null): string | null => {
  if (lat == null || lng == null) return conf;
  const c = conf ? ` (${conf})` : "";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${c}`;
};

export function fromLocationHistory(rows: LocationHistoryRow[]): RefinementTrailEntry[] {
  return rows.map((r) => ({
    id: `loc:${r.id}`,
    kind: "location_refined",
    at: r.created_at,
    actorId: r.changed_by,
    fields: [
      {
        field: "location",
        from: coord(r.old_latitude, r.old_longitude, r.old_confidence),
        to: coord(r.new_latitude, r.new_longitude, r.new_confidence),
      },
    ],
    reason: r.reason,
    meta: { refinementCount: r.refinement_ids?.length ?? 0 },
  }));
}

// ── tree_merge_history ────────────────────────────────────────────────────────
export interface MergeHistoryRow {
  id: string;
  primary_tree_id: string;
  secondary_tree_id: string;
  merge_reason: string | null;
  merged_by: string | null;
  created_at: string;
}

export function fromMergeHistory(rows: MergeHistoryRow[]): RefinementTrailEntry[] {
  return rows.map((r) => ({
    id: `merge:${r.id}`,
    kind: "merge",
    at: r.created_at,
    actorId: r.merged_by,
    fields: [
      { field: "merged", from: r.secondary_tree_id, to: r.primary_tree_id },
    ],
    reason: r.merge_reason,
  }));
}

/** Interleave all source entries newest-first. Stable + pure. */
export function mergeTrail(...groups: RefinementTrailEntry[][]): RefinementTrailEntry[] {
  return groups
    .flat()
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.at).getTime();
      const tb = new Date(b.at).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    });
}
