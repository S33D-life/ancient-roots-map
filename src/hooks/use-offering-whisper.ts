/**
 * use-offering-whisper — Sending and fetching offering-linked whispers.
 *
 * An offering whisper is a tree_whispers row with offering_id set.
 * The offering itself is never duplicated — only referenced.
 *
 * Delivery scopes:
 *   SPECIFIC_TREE   → anyone who next encounters this specific tree
 *   SPECIES_MATCH   → anyone who next encounters this species
 *   ANY_TREE        → a specific wanderer (requires recipient_user_id)
 *   FOREST_WIDE     → any wanderer at any tree (open broadcast)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];

// ─── Types ─────────────────────────────────────────────────────────────────

export type OfferingWhisperScope =
  | "SPECIFIC_TREE"   // anyone who encounters this tree
  | "SPECIES_MATCH"   // anyone who encounters this species
  | "SPECIFIC_WANDERER" // a named recipient (recipient_user_id required)
  | "FOREST_WIDE";    // open broadcast — any wanderer, any tree

export type SenderVisibility = "signed" | "anonymous_until_encounter";

export interface SendOfferingWhisperParams {
  senderUserId: string;
  offeringId: string;
  /** The tree the offering was made at — always the anchor */
  treeAnchorId: string;
  treeSpeciesKey?: string | null;
  scope: OfferingWhisperScope;
  /** Required when scope = SPECIFIC_WANDERER */
  recipientUserId?: string | null;
  personalMessage?: string;
  senderVisibility?: SenderVisibility;
  expiresAt?: string | null;
}

export interface OfferingWhisperRow {
  id: string;
  offering_id: string | null;
  sender_user_id: string;
  sender_visibility: SenderVisibility;
  personal_message: string | null;
  message_content: string;
  tree_anchor_id: string;
  delivery_scope: string;
  delivery_tree_id: string | null;
  delivery_species_key: string | null;
  recipient_scope: string;
  recipient_user_id: string | null;
  status: string;
  created_at: string;
  collected_at: string | null;
  // Joined offering (optional, fetched separately)
  offering?: Offering | null;
}

// ─── Send ──────────────────────────────────────────────────────────────────

/**
 * Send an offering as a whisper.
 * Creates a tree_whispers row with offering_id set.
 * Does NOT touch the offerings table.
 */
export async function sendOfferingWhisper(params: SendOfferingWhisperParams): Promise<{
  data: OfferingWhisperRow | null;
  error: Error | null;
}> {
  const {
    senderUserId,
    offeringId,
    treeAnchorId,
    treeSpeciesKey,
    scope,
    recipientUserId,
    personalMessage,
    senderVisibility = "signed",
    expiresAt,
  } = params;

  // Map scope → tree_whispers columns
  const deliveryScope: string =
    scope === "SPECIFIC_TREE"     ? "SPECIFIC_TREE" :
    scope === "SPECIES_MATCH"     ? "SPECIES_MATCH"  :
    scope === "FOREST_WIDE"       ? "FOREST_WIDE"    :
    /* SPECIFIC_WANDERER */         "ANY_TREE";

  const recipientScope: string =
    scope === "SPECIFIC_WANDERER" ? "PRIVATE" : "PUBLIC";

  // Auto-summary for message_content (keeps legacy consumers readable)
  const messageSummary = personalMessage?.trim()
    ? personalMessage.trim()
    : "✨ I wanted to share this offering with you through the tree.";

  const { data, error } = await supabase
    .from("tree_whispers" as any)
    .insert({
      sender_user_id: senderUserId,
      offering_id: offeringId,
      tree_anchor_id: treeAnchorId,
      message_content: messageSummary,
      personal_message: personalMessage?.trim() || null,
      sender_visibility: senderVisibility,
      recipient_scope: recipientScope,
      recipient_user_id: recipientUserId || null,
      delivery_scope: deliveryScope,
      delivery_tree_id: scope === "SPECIFIC_TREE" ? treeAnchorId : null,
      delivery_species_key: scope === "SPECIES_MATCH" ? treeSpeciesKey : null,
      is_active: true,
      is_mycelial: false,
      hearts_cost: 0,
      channel_type: "tree",
      audience_type: recipientUserId ? "individual" : "group",
      expires_at: expiresAt || null,
      status: "active",
    })
    .select()
    .single();

  return {
    data: data as OfferingWhisperRow | null,
    error: error as Error | null,
  };
}

// ─── Fetch offering for a whisper ─────────────────────────────────────────

/**
 * Fetch the offering attached to a whisper.
 * Returns null if no offering_id or offering was deleted.
 */
export function useWhisperOffering(offeringId: string | null | undefined) {
  return useQuery<Offering | null>({
    queryKey: ["whisper-offering", offeringId],
    enabled: !!offeringId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      if (!offeringId) return null;
      const { data, error } = await supabase
        .from("offerings")
        .select("*")
        .eq("id", offeringId)
        .maybeSingle();
      if (error) throw error;
      return data as Offering | null;
    },
  });
}

/**
 * Fetch all offering-linked whispers anchored at a tree.
 * Used to surface "offering whispers" in the tree detail page.
 */
export function useTreeOfferingWhispers(treeId: string | undefined) {
  return useQuery<OfferingWhisperRow[]>({
    queryKey: ["tree-offering-whispers", treeId],
    enabled: !!treeId,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("tree_whispers" as any)
        .select("*")
        .eq("tree_anchor_id", treeId)
        .not("offering_id", "is", null)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as OfferingWhisperRow[];
    },
  });
}
