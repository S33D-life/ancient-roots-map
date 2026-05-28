/**
 * notify — tiny client-side notification writer.
 * Calls the `send-notification` edge function which validates the actor's
 * JWT and writes the row using the service role. Fire-and-forget; never blocks UI.
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
 * Send a notification. Silently swallows errors.
 * Skips when actor === recipient (no self-notifications).
 */
export async function notify(input: NotifyInput, actorUserId?: string | null) {
  if (actorUserId && actorUserId === input.user_id) return;
  try {
    await supabase.functions.invoke("send-notification", {
      body: {
        user_id: input.user_id,
        title: input.title,
        body: input.body ?? null,
        category: input.category,
        priority: input.priority ?? "normal",
        deep_link: input.deep_link ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch {
    // best-effort
  }
}
