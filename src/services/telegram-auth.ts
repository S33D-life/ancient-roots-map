/**
 * Telegram Auth Service — app-side integration points for Telegram login
 * and account linking.
 *
 * Architecture:
 * - Telegram login produces a signed payload (from Telegram Login Widget)
 * - Client sends this payload to an edge function for server-side verification
 * - Edge function verifies the hash using the bot token (HMAC-SHA-256)
 * - On success: either signs in or links the Telegram identity
 *
 * Backend assumptions (TODO — edge function not yet built):
 * - Edge function `telegram-auth` accepts POST with Telegram login payload
 * - Verifies hash, then either:
 *   a) Creates/signs in a Supabase user (returns session tokens)
 *   b) Links Telegram to an existing user (requires auth header)
 * - Returns { ok, user_id, session?, error? }
 *
 * Raw Telegram IDs are hashed before storage in connected_accounts.provider_user_id
 */

import { supabase } from "@/integrations/supabase/client";

export interface TelegramLoginPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramAuthResult {
  ok: boolean;
  error?: string;
  /** Whether a new account was created */
  created?: boolean;
  /** Whether linking was performed */
  linked?: boolean;
}

/**
 * Link Telegram identity to the currently authenticated user.
 * Calls the telegram-auth edge function with link_mode=true.
 *
 * TODO: Edge function implementation pending.
 * For now this is a stub that returns a clear error.
 */
export async function linkTelegramAccount(
  _payload: TelegramLoginPayload,
): Promise<TelegramAuthResult> {
  try {
    const { data, error } = await supabase.functions.invoke("telegram-auth", {
      body: { ..._payload, action: "link" },
    });
    if (error) {
      console.warn("telegram-auth link error:", error);
      return { ok: false, error: "Telegram linking is not yet available. Coming soon." };
    }
    return data as TelegramAuthResult;
  } catch {
    return { ok: false, error: "Telegram linking is not yet available. Coming soon." };
  }
}

/**
 * Sign in with Telegram identity.
 * Calls the telegram-auth edge function with action=signin.
 *
 * TODO: Edge function implementation pending.
 */
export async function signInWithTelegram(
  _payload: TelegramLoginPayload,
): Promise<TelegramAuthResult> {
  try {
    const { data, error } = await supabase.functions.invoke("telegram-auth", {
      body: { ..._payload, action: "signin" },
    });
    if (error) {
      console.warn("telegram-auth signin error:", error);
      return { ok: false, error: "Telegram sign-in is not yet available. Coming soon." };
    }
    return data as TelegramAuthResult;
  } catch {
    return { ok: false, error: "Telegram sign-in is not yet available. Coming soon." };
  }
}

/**
 * Fetch the current user's connected accounts.
 */
export async function getConnectedAccounts() {
  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id, provider, provider_username, display_name, verified_at, linked_at")
    .order("linked_at", { ascending: true });
  if (error) {
    console.warn("Failed to fetch connected accounts:", error);
    return [];
  }
  return data ?? [];
}

/**
 * Unlink a connected account.
 */
export async function unlinkConnectedAccount(accountId: string) {
  const { error } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("id", accountId);
  return !error;
}
