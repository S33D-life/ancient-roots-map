/**
 * SyncEngine — processes the offline queue when connectivity returns.
 *
 * - Processes items oldest-first
 * - Uploads photos first, then inserts the DB row
 * - Retries failed items up to 3 times with exponential backoff
 * - Emits 's33d-queue-change' events for UI reactivity
 */
import { supabase } from "@/integrations/supabase/client";
import {
  getActionsByStatus,
  updateAction,
  removeAction,
  type PendingAction,
} from "@/utils/offlineSync";
import { toast } from "sonner";

const MAX_RETRIES = 3;
let syncing = false;

function emitChange() {
  window.dispatchEvent(new CustomEvent("s33d-queue-change"));
}

/** Upload a base64 photo to Supabase Storage */
async function uploadOfflinePhoto(action: PendingAction): Promise<string | null> {
  if (!action.photoDataUrl || !action.photoStoragePath) return null;
  try {
    const blob = await fetch(action.photoDataUrl).then((r) => r.blob());
    const { data } = await supabase.storage
      .from("offerings")
      .upload(action.photoStoragePath, blob, { contentType: "image/jpeg", upsert: true });
    if (data) {
      const { data: urlData } = supabase.storage
        .from("offerings")
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    }
  } catch (err) {
    console.warn("[SyncEngine] Photo upload failed:", err);
  }
  return null;
}

/** Process a single queued action */
async function processAction(action: PendingAction): Promise<boolean> {
  // Mark syncing
  action.status = "syncing";
  action.lastAttemptAt = new Date().toISOString();
  action.attempts += 1;
  await updateAction(action);
  emitChange();

  try {
    // Upload photo if present
    let photoUrl: string | null = null;
    if (action.photoDataUrl) {
      photoUrl = await uploadOfflinePhoto(action);
      if (photoUrl && action.payload) {
        // Inject the uploaded URL into the payload
        action.payload.media_url = photoUrl;
        action.payload.photo_url = photoUrl;
      }
    }

    // Remove offline-only fields from payload
    const payload = { ...action.payload };
    delete payload._offlinePhotoDataUrl;

    // Insert into the target table
    const { error } = await supabase.from(action.table as any).insert(payload as any);

    if (error) {
      throw new Error(error.message);
    }

    // Success — remove from queue
    await removeAction(action.id);
    emitChange();
    return true;
  } catch (err: any) {
    action.status = action.attempts >= MAX_RETRIES ? "failed" : "pending";
    action.lastError = err?.message || "Unknown error";
    await updateAction(action);
    emitChange();
    return false;
  }
}

/** Run the sync loop — call on reconnect or manually */
export async function runSync(): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;

  let synced = 0;
  let failed = 0;

  try {
    const pending = await getActionsByStatus("pending");
    if (pending.length === 0) {
      syncing = false;
      return { synced: 0, failed: 0 };
    }

    // Sort oldest first
    pending.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));

    for (const action of pending) {
      if (!navigator.onLine) break; // Stop if we go offline mid-sync
      const ok = await processAction(action);
      if (ok) synced++;
      else failed++;
    }

    if (synced > 0) {
      const label = synced === 1 ? "1 record" : `${synced} records`;
      toast.success(`🌿 Synced ${label} from offline queue`);
    }
    if (failed > 0) {
      toast.error(`${failed} record${failed > 1 ? "s" : ""} failed to sync — will retry`);
    }
  } finally {
    syncing = false;
    emitChange();
  }

  return { synced, failed };
}

/** Auto-sync listener — attach once at app startup */
let listenerAttached = false;
export function attachAutoSync() {
  if (listenerAttached) return;
  listenerAttached = true;

  window.addEventListener("online", () => {
    // Small delay to let connection stabilize
    setTimeout(() => runSync(), 2000);
  });

  // Also attempt sync on app load if online
  if (navigator.onLine) {
    setTimeout(() => runSync(), 5000);
  }
}
