/**
 * Telegram Auth Service — client-side integration for Telegram account linking.
 *
 * Architecture (bot-assisted verification):
 * 1. User clicks "Link Telegram" → generates a 6-digit code via edge function
 * 2. User sends code to S33D Telegram bot
 * 3. Bot verifies and marks the code as verified
 * 4. Client polls check_code, then calls claim_code to complete linking
 *
 * Raw Telegram IDs are hashed before storage in connected_accounts.provider_user_id
 */

import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

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
  created?: boolean;
  linked?: boolean;
  already_linked?: boolean;
}

export interface GenerateCodeResult {
  ok: boolean;
  code_id?: string;
  code?: string;
  expires_at?: string;
  bot_username?: string | null;
  instruction?: string;
  error?: string;
}

export interface CheckCodeResult {
  ok: boolean;
  status?: "pending" | "verified" | "claimed" | "expired";
  telegram_username?: string | null;
  error?: string;
}

/* ── Verification code flow ── */

/**
 * Generate a verification code for Telegram account linking.
 * The user must send this code to the S33D bot on Telegram.
 */
export async function generateVerificationCode(): Promise<GenerateCodeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("telegram-auth", {
      body: { action: "generate_code" },
    });
    if (error) {
      console.warn("telegram-auth generate_code error:", error);
      return { ok: false, error: "Failed to generate verification code" };
    }
    return data as GenerateCodeResult;
  } catch {
    return { ok: false, error: "Failed to generate verification code" };
  }
}

/**
 * Check if a verification code has been confirmed by the bot.
 */
export async function checkVerificationCode(codeId: string): Promise<CheckCodeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("telegram-auth", {
      body: { action: "check_code", code_id: codeId },
    });
    if (error) {
      return { ok: false, error: "Failed to check verification status" };
    }
    return data as CheckCodeResult;
  } catch {
    return { ok: false, error: "Failed to check verification status" };
  }
}

/**
 * Claim a verified code and link the Telegram identity to the current user.
 */
export async function claimVerificationCode(codeId: string): Promise<TelegramAuthResult> {
  try {
    const { data, error } = await supabase.functions.invoke("telegram-auth", {
      body: { action: "claim_code", code_id: codeId },
    });
    if (error) {
      return { ok: false, error: "Failed to link Telegram account" };
    }
    return data as TelegramAuthResult;
  } catch {
    return { ok: false, error: "Failed to link Telegram account" };
  }
}

/* ── Connected accounts ── */

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
