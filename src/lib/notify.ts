/**
 * notify — tiny client-side notification writer.
 * Inserts into the existing `notifications` table when one user's action
 * touches another user's creation. Fire-and-forget; never blocks UI.
 *
 * RLS: any authenticated user may insert (with_check: auth.uid() IS NOT NULL).
 */
import { supabase } from "@/integrations/supabase/client";

export type NotifyCategory =
  | "tree_visit"
  | "whisper"
  | "resonance"
  | "invite"
  | "general";

export interface NotifyInput {
  user_id: string;          // recipient
  title: string;
  body?: string | null;
  category: NotifyCategory;
  priority?: "low" | "normal" | "high";
  deep_link?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Insert a notification. Silently swallows errors.
 * Skips when actor === recipient (no self-notifications).
 */
export async function notify(input: NotifyInput, actorUserId?: string | null) {
  if (actorUserId && actorUserId === input.user_id) return;
  try {
    await supabase.from("notifications").insert([{
      user_id: input.user_id,
      title: input.title,
      body: input.body ?? null,
      category: input.category,
      priority: input.priority ?? "normal",
      deep_link: input.deep_link ?? null,
      metadata: (input.metadata ?? {}) as never,
    }]);
  } catch {
    // best-effort
  }
}
