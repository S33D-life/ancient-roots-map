/**
 * grove-roots repository — Ancestral Roots.
 *
 * A Root is the relationship. An Inscription is the mark it leaves.
 *
 * Every authority and privacy decision lives in the database functions below.
 * These helpers only carry the request; they never decide who may do what.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SignatureStrokes } from "@/components/life-groves/RootSignaturePad";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

export type RootStatus = "proposed" | "pending" | "active" | "declined" | "removed";
export type InscriptionVisibility = "private" | "public";
export type PortalDisclosure = "mark_only" | "named";
export type EntryMode = "members_only" | "as_grove_permits";

/** A Root as its Grove sees it. */
export interface GroveRootRow {
  root_id: string;
  tree_id: string;
  tree_name: string | null;
  tree_species: string | null;
  status: RootStatus;
  inscription_text: string | null;
  signature_strokes: SignatureStrokes | null;
  inscription_visibility: InscriptionVisibility;
  portal_disclosure: PortalDisclosure;
  entry_mode: EntryMode;
  review_note: string | null;
  created_by: string;
  created_at: string;
}

/** A mark as the Ancient Friend's digital bark shows it. */
export interface TreeInscription {
  root_id: string;
  life_grove_id: string;
  inscription_text: string | null;
  inscription_style: string | null;
  signature_strokes: SignatureStrokes | null;
  /** Only present when the Root discloses it, or the viewer belongs to the grove. */
  remembered_name: string | null;
  grove_title: string | null;
  dedication: string | null;
  rooted_year: number | null;
  can_enter: boolean;
}

export async function listGroveRoots(groveId: string): Promise<GroveRootRow[]> {
  const { data, error } = await db.rpc("list_grove_roots", { p_grove_id: groveId });
  if (error) throw error;
  return (data ?? []) as GroveRootRow[];
}

export async function listTreeInscriptions(treeId: string): Promise<TreeInscription[]> {
  const { data, error } = await db.rpc("list_tree_inscriptions", { p_tree_id: treeId });
  if (error) throw error;
  return (data ?? []) as TreeInscription[];
}

export interface CreateRootInput {
  groveId: string;
  treeId: string;
  inscriptionText: string;
  dedication?: string | null;
  inscriptionVisibility?: InscriptionVisibility;
  portalDisclosure?: PortalDisclosure;
  entryMode?: EntryMode;
  signatureStrokes?: SignatureStrokes | null;
}

export async function createGroveRoot(input: CreateRootInput): Promise<string> {
  const { data, error } = await db.rpc("create_grove_root", {
    p_grove_id: input.groveId,
    p_tree_id: input.treeId,
    p_inscription_text: input.inscriptionText,
    p_dedication: input.dedication ?? null,
    p_inscription_visibility: input.inscriptionVisibility ?? "private",
    p_portal_disclosure: input.portalDisclosure ?? "mark_only",
    p_entry_mode: input.entryMode ?? "members_only",
    // V1 only ever creates ancestral roots, though the schema holds others.
    p_root_type: "ancestral",
    p_signature_strokes: input.signatureStrokes?.length ? input.signatureStrokes : null,
  });
  if (error) throw error;
  return data as string;
}

export interface TendRootInscriptionInput {
  rootId: string;
  inscriptionText?: string | null;
  signatureStrokes?: SignatureStrokes | null;
  clearSignature?: boolean;
}

export async function tendGroveRootInscription(input: TendRootInscriptionInput): Promise<void> {
  const { error } = await db.rpc("tend_grove_root_inscription", {
    p_root_id: input.rootId,
    p_inscription_text: input.inscriptionText ?? null,
    p_signature_strokes: input.signatureStrokes?.length ? input.signatureStrokes : null,
    p_clear_signature: input.clearSignature ?? false,
  });
  if (error) throw error;
}

/** A grove steward takes up, or sets aside, a suggested root. */
export async function reviewGroveRootProposal(
  rootId: string,
  decision: "accept" | "decline",
  note?: string,
): Promise<void> {
  const { error } = await db.rpc("review_grove_root_proposal", {
    p_root_id: rootId,
    p_decision: decision,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function removeGroveRoot(rootId: string, note?: string): Promise<void> {
  const { error } = await db.rpc("remove_grove_root", { p_root_id: rootId, p_note: note ?? null });
  if (error) throw error;
}

export async function reviewGroveRoot(
  rootId: string,
  decision: "active" | "declined",
  note?: string,
): Promise<void> {
  const { error } = await db.rpc("review_grove_root", {
    p_root_id: rootId,
    p_decision: decision,
    p_note: note ?? null,
  });
  if (error) throw error;
}

/** Ancient Friends a steward may root into: search the atlas by name or species. */
export interface AncientFriendResult {
  id: string;
  name: string | null;
  species: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function searchAncientFriends(term: string): Promise<AncientFriendResult[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const { data, error } = await db
    .from("trees")
    .select("id,name,species,latitude,longitude")
    .is("merged_into_tree_id", null)
    .or(`name.ilike.%${q}%,species.ilike.%${q}%`)
    .limit(8);
  if (error) throw error;
  return (data ?? []) as AncientFriendResult[];
}

/** May I, as an Ancient Friend's keeper, welcome roots reaching towards it? */
export async function isTreeRootAuthority(treeId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await db.rpc("is_tree_root_authority", {
    _tree_id: treeId,
    _user_id: userId,
  });
  if (error) return false;
  return !!data;
}

export interface PendingTreeRoot {
  id: string;
  life_grove_id: string;
  inscription_text: string | null;
  dedication: string | null;
  created_at: string;
}

/** Roots waiting at this Ancient Friend. Row access is enforced by the database. */
export async function listPendingTreeRoots(treeId: string): Promise<PendingTreeRoot[]> {
  const { data, error } = await db
    .from("grove_roots")
    .select("id,life_grove_id,inscription_text,dedication,created_at")
    .eq("tree_id", treeId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PendingTreeRoot[];
}
