/**
 * Durable OAuth sign-in adapter.
 *
 * `src/integrations/lovable/index.ts` is auto-generated and may be rewritten at
 * any time, so no correctness-critical behaviour may live there. That generated
 * wrapper only reports *thrown* `setSession` failures; when `setSession` returns
 * an error object instead (Safari storage locks, refresh failures) it returns a
 * "success" result while no session was ever persisted, and the sign-in screen
 * silently does nothing.
 *
 * This adapter closes that gap from outside the generated file: after a
 * non-redirect sign-in it confirms a session actually exists in *this* storage
 * context, and converts anything else into a plain error for the caller.
 * Regenerating the Lovable file cannot undo this.
 */
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export type OAuthSignInResult = {
  redirected?: boolean;
  error?: Error;
};

const toError = (value: unknown): Error => {
  if (value instanceof Error) return value;
  const message = (value as { message?: string } | null)?.message;
  return new Error(String(message ?? value ?? "Sign-in failed"));
};

export const SESSION_NOT_PERSISTED_MESSAGE =
  "Your sign-in could not be saved on this device. Please try again.";

export async function signInWithOAuthChecked(
  provider: "google" | "apple",
  opts?: { redirect_uri?: string; extraParams?: Record<string, string> },
): Promise<OAuthSignInResult> {
  let result: { redirected?: boolean; error?: unknown } | undefined;

  try {
    result = await lovable.auth.signInWithOAuth(provider, opts);
  } catch (e) {
    return { error: toError(e) };
  }

  if (result?.redirected) return { redirected: true };
  if (result?.error) return { error: toError(result.error) };

  // Never trust the generated wrapper's silence: prove the session landed here.
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { error: toError(error) };
    if (!data?.session) return { error: new Error(SESSION_NOT_PERSISTED_MESSAGE) };
  } catch (e) {
    return { error: toError(e) };
  }

  return {};
}
