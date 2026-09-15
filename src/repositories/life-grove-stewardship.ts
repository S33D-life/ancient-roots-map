/**
 * life-grove-stewardship repository.
 *
 * Every authority check lives in the database. These helpers only call the
 * security-definer functions and the RLS-protected tables; they never decide
 * permissions themselves.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  GroveEditProposal,
  GroveFieldKey,
  GroveIdentity,
  GroveSteward,
  GroveTendingEntry,
} from "@/lib/life-groves/stewardship";
import { isGroveContentField } from "@/lib/life-groves/stewardship";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

/* ---------- membership (contributor capability) ---------- */

/** Redeem an ordinary grove invitation. Grants contributor access only. */
export async function joinGroveWithToken(token: string): Promise<string> {
  const { data, error } = await db.rpc("join_life_grove_with_token", { p_token: token });
  if (error) throw error;
  return data as string;
}

/* ---------- authority ---------- */

export async function isGroveSteward(groveId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await db.rpc("is_grove_steward", { _grove_id: groveId, _user_id: userId });
  if (error) return false;
  return !!data;
}

export async function isGrovePrimarySteward(groveId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await db.rpc("is_grove_primary_steward", { _grove_id: groveId, _user_id: userId });
  if (error) return false;
  return !!data;
}

export async function isGroveContributor(groveId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await db.rpc("is_grove_contributor", { _grove_id: groveId, _user_id: userId });
  if (error) return false;
  return !!data;
}

/* ---------- stewards ---------- */

export async function listGroveStewards(groveId: string): Promise<GroveSteward[]> {
  const { data, error } = await db
    .from("life_grove_stewards")
    .select("*")
    .eq("life_grove_id", groveId)
    .is("revoked_at", null)
    .order("granted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GroveSteward[];
}

export async function grantGroveSteward(groveId: string, userId: string, note?: string) {
  const { error } = await db.rpc("grant_grove_steward", {
    p_grove_id: groveId,
    p_user_id: userId,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function revokeGroveSteward(groveId: string, userId: string) {
  const { error } = await db.rpc("revoke_grove_steward", { p_grove_id: groveId, p_user_id: userId });
  if (error) throw error;
}

/* ---------- tending ---------- */

export async function tendGroveField(
  groveId: string,
  field: GroveFieldKey,
  value: string | null,
  note?: string,
) {
  if (!isGroveContentField(field)) throw new Error("That is not something the grove can tend.");
  const { error } = await db.rpc("tend_grove_field", {
    p_grove_id: groveId,
    p_field: field,
    p_value: value,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function setGroveRootedTree(groveId: string, treeId: string | null, note?: string) {
  const { error } = await db.rpc("set_grove_rooted_tree", {
    p_grove_id: groveId,
    p_tree_id: treeId,
    p_note: note ?? null,
  });
  if (error) throw error;
}

/* ---------- proposals ---------- */

export async function listGroveProposals(groveId: string): Promise<GroveEditProposal[]> {
  const { data, error } = await db
    .from("life_grove_edit_proposals")
    .select("*")
    .eq("life_grove_id", groveId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GroveEditProposal[];
}

export async function proposeGroveEdit(input: {
  groveId: string;
  proposedBy: string;
  field: GroveFieldKey;
  currentValue: string | null;
  proposedValue: string;
  explanation?: string;
}) {
  if (!isGroveContentField(input.field)) throw new Error("That is not something the grove can tend.");
  const { error } = await db.from("life_grove_edit_proposals").insert({
    life_grove_id: input.groveId,
    proposed_by: input.proposedBy,
    field_name: input.field,
    current_value: input.currentValue,
    proposed_value: input.proposedValue,
    explanation: input.explanation ?? null,
    status: "pending",
  });
  if (error) throw error;
}

export async function acceptGroveProposal(proposalId: string, overrideValue?: string, note?: string) {
  const { error } = await db.rpc("apply_grove_proposal", {
    p_proposal_id: proposalId,
    p_override_value: overrideValue ?? null,
    p_reviewer_note: note ?? null,
  });
  if (error) throw error;
}

export async function declineGroveProposal(proposalId: string, note?: string) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await db
    .from("life_grove_edit_proposals")
    .update({
      status: "declined",
      reviewer_id: auth.user?.id ?? null,
      reviewer_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proposalId);
  if (error) throw error;
}

/* ---------- history ---------- */

export async function listGroveTendingHistory(groveId: string): Promise<GroveTendingEntry[]> {
  const { data, error } = await db
    .from("life_grove_tending_history")
    .select("*")
    .eq("life_grove_id", groveId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as GroveTendingEntry[];
}

/* ---------- identities ---------- */

/** Display identities for offering attribution. Never includes email. */
export async function listGroveIdentities(groveId: string): Promise<GroveIdentity[]> {
  const { data, error } = await db.rpc("get_life_grove_offering_identities", { p_grove_id: groveId });
  if (error) return [];
  return (data ?? []) as GroveIdentity[];
}

/** Steward-only: contributor contact details for this grove. */
export async function listGroveContributorContacts(groveId: string): Promise<GroveIdentity[]> {
  const { data, error } = await db.rpc("get_life_grove_contributors", { p_grove_id: groveId });
  if (error) throw error;
  return (data ?? []) as GroveIdentity[];
}
