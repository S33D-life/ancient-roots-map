/**
 * telegram-notify — Client-side service for triggering outbound Telegram notifications.
 *
 * This calls the telegram-notify edge function which handles:
 * - checking settings/toggles
 * - formatting messages
 * - sending via the Telegram connector gateway
 */
import { supabase } from "@/integrations/supabase/client";

export type TelegramEventType =
  | "new_tree"
  | "offering"
  | "whisper"
  | "heart_milestone"
  | "council_invite"
  | "ecosystem_update";

export interface TelegramEventData {
  tree_name?: string;
  tree_id?: string;
  species?: string;
  user_display?: string;
  offering_type?: string;
  whisper_preview?: string;
  hearts_total?: number;
  milestone?: string;
  council_name?: string;
  council_slug?: string;
  gathering_date?: string;
  title?: string;
  body?: string;
  link?: string;
}

/**
 * Send an ecosystem event to Telegram (if enabled in settings).
 * Fails silently — Telegram posting should never block app flows.
 */
export async function notifyTelegram(
  eventType: TelegramEventType,
  data: TelegramEventData,
): Promise<{ ok: boolean; message_id?: number }> {
  try {
    const { data: result, error } = await supabase.functions.invoke("telegram-notify", {
      body: { event_type: eventType, data },
    });

    if (error) {
      console.warn("[telegram-notify] Edge function error:", error);
      return { ok: false };
    }

    return result as { ok: boolean; message_id?: number };
  } catch (err) {
    console.warn("[telegram-notify] Failed silently:", err);
    return { ok: false };
  }
}
