/**
 * Offline-aware action creators — queue mutations locally when offline,
 * or execute directly when online. Always show appropriate feedback.
 */
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { queueAction, offlineId, isOnline, type PendingAction } from "@/utils/offlineSync";
import { toast } from "sonner";

/** True when we can actually reach Supabase */
function canSync(): boolean {
  return isOnline() && isSupabaseConfigured;
}

function emitChange() {
  window.dispatchEvent(new CustomEvent("s33d-queue-change"));
}

interface OfflineOfferingInput {
  tree_id: string;
  created_by: string;
  type: string;
  content?: string;
  title?: string;
  media_url?: string;
  tree_role?: string;
  visibility?: string;
  photoDataUrl?: string; // base64 for offline
}

/** Create an offering — online or queued offline */
export async function createOfferingOfflineAware(input: OfflineOfferingInput): Promise<{ queued: boolean; error?: string }> {
  const { photoDataUrl, ...payload } = input;

  if (canSync()) {
    // Try direct insert
    const { error } = await supabase.from("offerings").insert(payload as any);
    if (error) return { queued: false, error: error.message };
    toast.success("🌿 Offering saved");
    return { queued: false };
  }

  // Queue offline
  const action: PendingAction = {
    id: offlineId(),
    type: "offering",
    status: "pending",
    table: "offerings",
    payload,
    photoDataUrl,
    photoStoragePath: photoDataUrl ? `${input.created_by}/${offlineId()}.jpg` : undefined,
    attempts: 0,
    queuedAt: new Date().toISOString(),
    label: `Offering: ${input.type}${input.title ? ` — ${input.title}` : ""}`,
  };
  await queueAction(action);
  emitChange();
  toast("📦 Saved locally — will sync when online", { duration: 4000 });
  return { queued: true };
}

interface OfflineCheckinInput {
  tree_id: string;
  user_id: string;
  season_stage: string;
  mood_score?: number;
  reflection?: string;
  canopy_proof?: boolean;
  photo_url?: string;
  photoDataUrl?: string;
}

/** Create a tree check-in — online or queued offline */
export async function createCheckinOfflineAware(input: OfflineCheckinInput): Promise<{ queued: boolean; error?: string }> {
  const { photoDataUrl, ...payload } = input;

  if (canSync()) {
    const { error } = await supabase.from("tree_checkins").insert(payload as any);
    if (error) return { queued: false, error: error.message };
    toast.success("🌳 Check-in recorded");
    return { queued: false };
  }

  const action: PendingAction = {
    id: offlineId(),
    type: "checkin",
    status: "pending",
    table: "tree_checkins",
    payload,
    photoDataUrl,
    photoStoragePath: photoDataUrl ? `${input.user_id}/checkin-${offlineId()}.jpg` : undefined,
    attempts: 0,
    queuedAt: new Date().toISOString(),
    label: `Check-in: ${input.season_stage}`,
  };
  await queueAction(action);
  emitChange();
  toast("📦 Check-in saved locally — will sync when online", { duration: 4000 });
  return { queued: true };
}

interface OfflineNoteInput {
  tree_id?: string;
  user_id: string;
  content: string;
  note_type?: string;
}

/** Create a note — online or queued offline */
export async function createNoteOfflineAware(input: OfflineNoteInput): Promise<{ queued: boolean; error?: string }> {
  if (isOnline()) {
    // Notes could go to different tables — for now, store as offering type 'note'
    const { error } = await supabase.from("offerings").insert({
      tree_id: input.tree_id,
      created_by: input.user_id,
      type: "note",
      content: input.content,
    } as any);
    if (error) return { queued: false, error: error.message };
    toast.success("📝 Note saved");
    return { queued: false };
  }

  const action: PendingAction = {
    id: offlineId(),
    type: "note",
    status: "pending",
    table: "offerings",
    payload: {
      tree_id: input.tree_id,
      created_by: input.user_id,
      type: "note",
      content: input.content,
    },
    attempts: 0,
    queuedAt: new Date().toISOString(),
    label: `Note: ${input.content.slice(0, 40)}…`,
  };
  await queueAction(action);
  emitChange();
  toast("📦 Note saved locally — will sync when online", { duration: 4000 });
  return { queued: true };
}
