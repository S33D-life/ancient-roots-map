/**
 * Mycelial Whispers — group/channel-aware whisper hooks.
 *
 * Extends the existing tree_whispers system with:
 *   - channel_type: 'tree' | 'species' | 'mycelium'
 *   - audience_type: 'individual' | 'group'
 *   - group_id, hearts_cost, is_active
 *   - whisper_group_recipients tracking
 *
 * All writes go through SECURITY DEFINER RPCs:
 *   - charge_whisper_send  (validates balance, deducts cost, seeds recipients)
 *   - open_group_whisper   (validates channel match, awards hearts, echoes sender)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WhisperChannelType = "tree" | "species" | "mycelium";
export type WhisperAudienceType = "individual" | "group";

export interface WhisperGroup {
  id: string;
  owner_id: string;
  name: string;
  group_type: "family" | "council" | "custom";
  member_count?: number;
}

export interface MycelialWhisperRecipient {
  id: string;
  whisper_id: string;
  recipient_user_id: string;
  opened_at: string | null;
  opened_tree_id: string | null;
  hearts_earned: number;
  created_at: string;
}

export interface MycelialWhisper {
  id: string;
  sender_user_id: string;
  message_content: string;
  tree_anchor_id: string;
  channel_type: WhisperChannelType;
  channel_id: string | null;
  audience_type: WhisperAudienceType;
  group_id: string | null;
  hearts_cost: number;
  is_active: boolean;
  is_mycelial: boolean;
  created_at: string;
}

export const CHANNEL_COST: Record<WhisperChannelType, number> = {
  tree: 3,
  species: 5,
  mycelium: 7,
};

export const CHANNEL_REWARD: Record<WhisperChannelType, number> = {
  tree: 3,
  species: 5,
  mycelium: 7,
};

/** Send a whisper through the channel layer. Free for individual, costs hearts for group. */
export async function sendMycelialWhisper(params: {
  channelType: WhisperChannelType;
  channelId: string | null;
  audienceType: WhisperAudienceType;
  groupId?: string | null;
  treeAnchorId: string;
  messageContent: string;
  recipientUserId?: string | null;
  isActive?: boolean;
  expiresAt?: string | null;
}) {
  const { data, error } = await supabase.rpc("charge_whisper_send" as any, {
    _channel_type: params.channelType,
    _channel_id: params.channelId,
    _audience_type: params.audienceType,
    _group_id: params.groupId ?? null,
    _tree_anchor_id: params.treeAnchorId,
    _message_content: params.messageContent,
    _recipient_user_id: params.recipientUserId ?? null,
    _is_active: params.isActive ?? true,
    _expires_at: params.expiresAt ?? null,
  });
  return { data: data as { ok: boolean; whisper_id?: string; cost?: number; error?: string; balance?: number } | null, error };
}

/** Open a group whisper at a tree. Validates channel + awards hearts server-side. */
export async function openGroupWhisper(whisperId: string, currentTreeId: string) {
  const { data, error } = await supabase.rpc("open_group_whisper" as any, {
    _whisper_id: whisperId,
    _current_tree_id: currentTreeId,
  });
  return {
    data: data as {
      ok: boolean;
      message?: string;
      sender_user_id?: string;
      reward?: number;
      channel_type?: WhisperChannelType;
      already_opened?: boolean;
      capped?: boolean;
      error?: string;
    } | null,
    error,
  };
}

/** Groups the user owns or belongs to. */
export function useUserWhisperGroups(userId: string | null) {
  const [groups, setGroups] = useState<WhisperGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setGroups([]); setLoading(false); return; }
    setLoading(true);

    // Owned + member groups (RLS handles visibility)
    const { data: owned } = await supabase
      .from("whisper_groups" as any)
      .select("id, owner_id, name, group_type")
      .order("created_at", { ascending: false });

    setGroups((owned as unknown as WhisperGroup[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { groups, loading, refetch: fetch };
}

/** Create a new whisper group (owner = current user). */
export async function createWhisperGroup(name: string, groupType: WhisperGroup["group_type"]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };
  const { data, error } = await supabase
    .from("whisper_groups" as any)
    .insert({ owner_id: user.id, name, group_type: groupType } as any)
    .select()
    .single();
  return { data: data as unknown as WhisperGroup, error };
}

/** Add a member to a group (owner only). */
export async function addGroupMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from("whisper_group_members" as any)
    .insert({ group_id: groupId, user_id: userId } as any);
  return { error };
}

/** Group whispers waiting for the user (not yet opened). */
export function useWaitingMycelialWhispers(userId: string | null) {
  const [rows, setRows] = useState<Array<MycelialWhisperRecipient & { whisper: MycelialWhisper }>>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setRows([]); setLoading(false); return; }
    setLoading(true);

    const { data: recipients } = await supabase
      .from("whisper_group_recipients" as any)
      .select("*")
      .eq("recipient_user_id", userId)
      .is("opened_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!recipients?.length) {
      setRows([]); setLoading(false); return;
    }

    const ids = (recipients as any[]).map(r => r.whisper_id);
    const { data: whispers } = await supabase
      .from("tree_whispers" as any)
      .select("id, sender_user_id, message_content, tree_anchor_id, channel_type, channel_id, audience_type, group_id, hearts_cost, is_active, is_mycelial, created_at")
      .in("id", ids)
      .eq("is_active", true);

    const wMap = new Map((whispers as any[] || []).map(w => [w.id, w]));
    setRows(
      (recipients as any[])
        .filter(r => wMap.has(r.whisper_id))
        .map(r => ({ ...(r as MycelialWhisperRecipient), whisper: wMap.get(r.whisper_id) as MycelialWhisper }))
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { rows, loading, refetch: fetch };
}

/** Group whispers the user has SENT, with opened-recipient counts. */
export function useSentMycelialWhispers(userId: string | null) {
  const [whispers, setWhispers] = useState<Array<MycelialWhisper & { opened_count: number; total_count: number }>>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setWhispers([]); setLoading(false); return; }
    setLoading(true);

    const { data: ws } = await supabase
      .from("tree_whispers" as any)
      .select("id, sender_user_id, message_content, tree_anchor_id, channel_type, channel_id, audience_type, group_id, hearts_cost, is_active, is_mycelial, created_at")
      .eq("sender_user_id", userId)
      .eq("audience_type", "group")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ws?.length) { setWhispers([]); setLoading(false); return; }

    const ids = (ws as any[]).map(w => w.id);
    const { data: rcps } = await supabase
      .from("whisper_group_recipients" as any)
      .select("whisper_id, opened_at")
      .in("whisper_id", ids);

    const counts = new Map<string, { opened: number; total: number }>();
    (rcps as any[] || []).forEach(r => {
      const c = counts.get(r.whisper_id) || { opened: 0, total: 0 };
      c.total += 1;
      if (r.opened_at) c.opened += 1;
      counts.set(r.whisper_id, c);
    });

    setWhispers((ws as any[]).map(w => ({
      ...(w as MycelialWhisper),
      opened_count: counts.get(w.id)?.opened ?? 0,
      total_count: counts.get(w.id)?.total ?? 0,
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { whispers, loading, refetch: fetch };
}

/** Check whispers waiting for user that can be opened at a specific tree. */
export async function findOpenableAtTree(
  userId: string,
  treeId: string,
  treeSpeciesKey: string,
): Promise<Array<MycelialWhisperRecipient & { whisper: MycelialWhisper }>> {
  const { data: recipients } = await supabase
    .from("whisper_group_recipients" as any)
    .select("*")
    .eq("recipient_user_id", userId)
    .is("opened_at", null);

  if (!recipients?.length) return [];

  const ids = (recipients as any[]).map(r => r.whisper_id);
  const { data: whispers } = await supabase
    .from("tree_whispers" as any)
    .select("id, sender_user_id, message_content, tree_anchor_id, channel_type, channel_id, audience_type, group_id, hearts_cost, is_active, is_mycelial, created_at")
    .in("id", ids)
    .eq("is_active", true);

  const wMap = new Map((whispers as any[] || []).map(w => [w.id, w as MycelialWhisper]));

  return (recipients as any[])
    .map(r => ({ row: r as MycelialWhisperRecipient, whisper: wMap.get(r.whisper_id) }))
    .filter(({ whisper }) => {
      if (!whisper) return false;
      if (whisper.channel_type === "mycelium") return true;
      if (whisper.channel_type === "tree") return whisper.channel_id === treeId;
      if (whisper.channel_type === "species") return whisper.channel_id === treeSpeciesKey;
      return false;
    })
    .map(({ row, whisper }) => ({ ...row, whisper: whisper as MycelialWhisper }));
}
