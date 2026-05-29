import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type EditHistoryRow = Database["public"]["Tables"]["tree_edit_history"]["Row"];
type ChangeLogRow = Database["public"]["Tables"]["tree_change_log"]["Row"];
type ProposalRow = Database["public"]["Tables"]["tree_edit_proposals"]["Row"];
type LocationRefinementRow = Database["public"]["Tables"]["tree_location_refinements"]["Row"];
type LocationHistoryRow = Database["public"]["Tables"]["tree_location_history"]["Row"];
type DuplicateReportRow = Database["public"]["Tables"]["tree_duplicate_reports"]["Row"];
type MergeHistoryRow = Database["public"]["Tables"]["tree_merge_history"]["Row"];
type LocationRefinementTrailRow = Pick<
  LocationRefinementRow,
  | "id"
  | "tree_id"
  | "user_id"
  | "accuracy_m"
  | "source_type"
  | "at_trunk"
  | "status"
  | "note"
  | "review_note"
  | "reviewed_at"
  | "reviewed_by"
  | "created_at"
>;

export type RefinementTrailState = "pending" | "accepted" | "rejected" | "needs_more_info" | "unknown";

export type RefinementTrailSource =
  | "tree_edit_history"
  | "tree_change_log"
  | "tree_edit_proposal"
  | "tree_location_refinement"
  | "tree_location_history"
  | "tree_duplicate_report"
  | "tree_merge_history";

export interface RefinementFieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface RefinementTrailEntry {
  id: string;
  source: RefinementTrailSource;
  occurredAt: string;
  actionType: string;
  state: RefinementTrailState;
  actorId: string | null;
  actorLabel: string;
  changedFields: string[];
  fieldChanges: RefinementFieldChange[];
  summary: string;
  reason: string | null;
}

interface UseRefinementTrailResult {
  entries: RefinementTrailEntry[];
  loading: boolean;
  error: string | null;
}

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonFields(value: Json): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function jsonValue(value: Json, key: string): unknown {
  return isRecord(value) ? value[key] : null;
}

function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeState(status: string | null | undefined): RefinementTrailState {
  switch (status) {
    case "pending":
    case "open":
      return "pending";
    case "accepted":
    case "completed":
    case "confirmed_duplicate":
      return "accepted";
    case "rejected":
    case "separate_trees":
      return "rejected";
    case "needs_more_info":
      return "needs_more_info";
    default:
      return "unknown";
  }
}

function summarizeFields(fields: string[], fallback: string): string {
  if (fields.length === 0) return fallback;
  if (fields.length === 1) return `${fields[0]} updated`;
  if (fields.length <= 3) return `${fields.join(", ")} updated`;
  return `${fields.slice(0, 3).join(", ")} and ${fields.length - 3} more updated`;
}

function buildJsonFieldChanges(changeSet: Json, previousValues: Json): RefinementFieldChange[] {
  return jsonFields(changeSet).map((field) => ({
    field,
    oldValue: stringifyValue(jsonValue(previousValues, field)),
    newValue: stringifyValue(jsonValue(changeSet, field)),
  }));
}

function proposalTimestamp(row: ProposalRow): string {
  return row.status === "pending" ? row.created_at : row.updated_at || row.created_at;
}

function locationTimestamp(row: LocationRefinementRow): string {
  return row.status === "pending" ? row.created_at : row.reviewed_at || row.created_at;
}

function duplicatePairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

function groupEditHistory(rows: EditHistoryRow[]): RefinementTrailEntry[] {
  const grouped = new Map<
    string,
    {
      id: string;
      created_at: string;
      edit_type: string;
      edit_reason: string | null;
      user_id: string;
      proposal_id: string | null;
      fieldChanges: RefinementFieldChange[];
    }
  >();

  for (const row of rows) {
    const key = [
      row.created_at,
      row.user_id,
      row.edit_type,
      row.proposal_id || "",
      row.edit_reason || "",
    ].join("|");
    const existing = grouped.get(key);
    const fieldChange = {
      field: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
    };

    if (existing) {
      existing.fieldChanges.push(fieldChange);
    } else {
      grouped.set(key, {
        id: `history:${row.id}`,
        created_at: row.created_at,
        edit_type: row.edit_type,
        edit_reason: row.edit_reason,
        user_id: row.user_id,
        proposal_id: row.proposal_id,
        fieldChanges: [fieldChange],
      });
    }
  }

  return [...grouped.values()].map((group) => {
    const changedFields = group.fieldChanges.map((change) => change.field);
    return {
      id: group.id,
      source: "tree_edit_history",
      occurredAt: group.created_at,
      actionType: group.edit_type,
      state: "accepted",
      actorId: group.user_id,
      actorLabel: group.proposal_id ? "Accepted proposal" : "Steward edit",
      changedFields,
      fieldChanges: group.fieldChanges,
      summary: summarizeFields(changedFields, "Tree record updated"),
      reason: group.edit_reason,
    };
  });
}

export function useRefinementTrail(treeId: string | undefined): UseRefinementTrailResult {
  const [entries, setEntries] = useState<RefinementTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!treeId) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchTrail = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          editHistoryRes,
          changeLogRes,
          proposalRes,
          locationRefinementRes,
          locationHistoryRes,
          duplicateReportRes,
          mergeHistoryRes,
        ] = await Promise.all([
          supabase
            .from("tree_edit_history")
            .select("id, tree_id, field_name, old_value, new_value, edit_reason, edit_type, proposal_id, user_id, created_at")
            .eq("tree_id", treeId)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("tree_change_log")
            .select("id, tree_id, change_set, previous_values, merged_from_proposal_id, merged_by, merged_at")
            .eq("tree_id", treeId)
            .order("merged_at", { ascending: false })
            .limit(50),
          supabase
            .from("tree_edit_proposals")
            .select("id, tree_id, proposed_by, proposed_changes, reason, status, confidence, flags, reviewer_note, created_at, updated_at")
            .eq("tree_id", treeId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("tree_location_refinements")
            .select("id, tree_id, user_id, accuracy_m, source_type, at_trunk, status, note, review_note, reviewed_at, reviewed_by, created_at")
            .eq("tree_id", treeId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("tree_location_history")
            .select("id, tree_id, old_confidence, new_confidence, changed_by, reason, refinement_ids, created_at")
            .eq("tree_id", treeId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("tree_duplicate_reports")
            .select("id, tree_a_id, tree_b_id, proposer_id, status, similarity_score, note, review_note, reviewed_at, reviewed_by, created_at")
            .or(`tree_a_id.eq.${treeId},tree_b_id.eq.${treeId}`)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("tree_merge_history")
            .select("id, primary_tree_id, secondary_tree_id, merged_by, merge_reason, data_migrated, created_at")
            .or(`primary_tree_id.eq.${treeId},secondary_tree_id.eq.${treeId}`)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

        if (cancelled) return;

        const firstError = [
          editHistoryRes.error,
          changeLogRes.error,
          proposalRes.error,
          locationRefinementRes.error,
          locationHistoryRes.error,
          duplicateReportRes.error,
          mergeHistoryRes.error,
        ].find(Boolean);

        const editHistoryRows = (editHistoryRes.data || []) as EditHistoryRow[];
        const changeLogRows = (changeLogRes.data || []) as ChangeLogRow[];
        const proposalRows = (proposalRes.data || []) as ProposalRow[];
        const locationRefinementRows = (locationRefinementRes.data || []) as LocationRefinementTrailRow[];
        const locationHistoryRows = (locationHistoryRes.data || []) as LocationHistoryRow[];
        const duplicateReportRows = (duplicateReportRes.data || []) as DuplicateReportRow[];
        const mergeHistoryRows = (mergeHistoryRes.data || []) as MergeHistoryRow[];

      const visibleProposalsById = new Map(proposalRows.map((proposal) => [proposal.id, proposal]));
      const proposalIdsMergedInChangeLog = new Set(
        changeLogRows
          .map((row) => row.merged_from_proposal_id)
          .filter((id): id is string => Boolean(id)),
      );
      const locationIdsAppliedInHistory = new Set(
        locationHistoryRows.flatMap((row) => row.refinement_ids || []),
      );
      const mergePairKeys = new Set(
        mergeHistoryRows.map((row) => duplicatePairKey(row.primary_tree_id, row.secondary_tree_id)),
      );

      const historyEntries = groupEditHistory(
        editHistoryRows.filter((row) => {
          if (row.edit_type === "merge" && mergeHistoryRows.length > 0) return false;
          if (row.proposal_id && proposalIdsMergedInChangeLog.has(row.proposal_id)) return false;
          return true;
        }),
      );

      const changeLogEntries: RefinementTrailEntry[] = changeLogRows.map((row) => {
        const proposal = row.merged_from_proposal_id
          ? visibleProposalsById.get(row.merged_from_proposal_id)
          : null;
        const fieldChanges = buildJsonFieldChanges(row.change_set, row.previous_values);
        const changedFields = fieldChanges.map((change) => change.field);
        return {
          id: `change-log:${row.id}`,
          source: "tree_change_log",
          occurredAt: row.merged_at,
          actionType: row.merged_from_proposal_id ? "proposal_merged" : "change_logged",
          state: "accepted",
          actorId: proposal?.proposed_by ?? row.merged_by,
          actorLabel: proposal ? "Contributor proposal" : "Steward merge",
          changedFields,
          fieldChanges,
          summary: summarizeFields(changedFields, "Proposal merged"),
          reason: proposal?.reason ?? null,
        };
      });

      const proposalEntries: RefinementTrailEntry[] = proposalRows
        .filter((row) => !(row.status === "accepted" && proposalIdsMergedInChangeLog.has(row.id)))
        .map((row) => {
          const changedFields = jsonFields(row.proposed_changes);
          return {
            id: `proposal:${row.id}`,
            source: "tree_edit_proposal",
            occurredAt: proposalTimestamp(row),
            actionType: "edit_proposal",
            state: normalizeState(row.status),
            actorId: row.proposed_by,
            actorLabel: "Contributor proposal",
            changedFields,
            fieldChanges: buildJsonFieldChanges(row.proposed_changes, {}),
            summary: row.status === "pending"
              ? summarizeFields(changedFields, "Edit proposed")
              : `Proposal ${row.status.replace(/_/g, " ")}`,
            reason: row.reason || row.reviewer_note,
          };
        });

      const locationRefinementEntries: RefinementTrailEntry[] = locationRefinementRows
        .filter((row) => !locationIdsAppliedInHistory.has(row.id))
        .map((row) => ({
          id: `location-refinement:${row.id}`,
          source: "tree_location_refinement",
          occurredAt: locationTimestamp(row),
          actionType: row.source_type === "checkin_passive" ? "checkin_location_refinement" : "location_refinement",
          state: normalizeState(row.status),
          actorId: row.user_id,
          actorLabel: "Location contributor",
          changedFields: ["location"],
          fieldChanges: [
            {
              field: "location",
              oldValue: null,
              newValue: row.accuracy_m != null ? `GPS accuracy ${Math.round(Number(row.accuracy_m))}m` : "Location observation",
            },
          ],
          summary: row.status === "pending" ? "Location refinement proposed" : `Location refinement ${row.status}`,
          reason: row.note || row.review_note,
        }));

      const locationHistoryEntries: RefinementTrailEntry[] = locationHistoryRows.map((row) => ({
        id: `location-history:${row.id}`,
        source: "tree_location_history",
        occurredAt: row.created_at,
        actionType: "location_update_applied",
        state: "accepted",
        actorId: row.changed_by,
        actorLabel: "Curator location update",
        changedFields: ["location", "location_confidence"],
        fieldChanges: [
          {
            field: "location_confidence",
            oldValue: row.old_confidence,
            newValue: row.new_confidence,
          },
        ],
        summary: "Location update applied",
        reason: row.reason,
      }));

      const duplicateEntries: RefinementTrailEntry[] = duplicateReportRows
        .filter((row) => {
          const isMerged = normalizeState(row.status) === "accepted";
          return !(isMerged && mergePairKeys.has(duplicatePairKey(row.tree_a_id, row.tree_b_id)));
        })
        .map((row) => ({
          id: `duplicate-report:${row.id}`,
          source: "tree_duplicate_report",
          occurredAt: row.reviewed_at || row.created_at,
          actionType: "duplicate_report",
          state: normalizeState(row.status),
          actorId: row.proposer_id,
          actorLabel: "Duplicate reporter",
          changedFields: ["duplicate_review"],
          fieldChanges: [
            {
              field: "duplicate_review",
              oldValue: null,
              newValue: `${Math.round(Number(row.similarity_score || 0) * 100)}% similarity`,
            },
          ],
          summary: row.status === "pending" ? "Possible duplicate reported" : `Duplicate report ${row.status.replace(/_/g, " ")}`,
          reason: row.note || row.review_note,
        }));

      const mergeEntries: RefinementTrailEntry[] = mergeHistoryRows.map((row) => ({
        id: `merge-history:${row.id}`,
        source: "tree_merge_history",
        occurredAt: row.created_at,
        actionType: "tree_merged",
        state: "accepted",
        actorId: row.merged_by,
        actorLabel: "Steward merge",
        changedFields: ["merge"],
        fieldChanges: [
          {
            field: "merge",
            oldValue: row.secondary_tree_id === treeId ? "Active duplicate record" : null,
            newValue: row.secondary_tree_id === treeId ? "Merged into primary record" : "Duplicate record merged here",
          },
        ],
        summary: row.secondary_tree_id === treeId
          ? "This duplicate record was merged into another tree"
          : "Duplicate tree merged into this record",
        reason: row.merge_reason,
      }));

      const allEntries = [
        ...historyEntries,
        ...changeLogEntries,
        ...proposalEntries,
        ...locationRefinementEntries,
        ...locationHistoryEntries,
        ...duplicateEntries,
        ...mergeEntries,
      ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

        setEntries(allEntries);
        setError(firstError?.message ?? null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setEntries([]);
        setError(err instanceof Error ? err.message : "Unable to load refinement trail");
        setLoading(false);
      }
    };

    fetchTrail();
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  return { entries, loading, error };
}
