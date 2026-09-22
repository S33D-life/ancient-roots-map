/**
 * pwaHandoff — installed-app (standalone) Google sign-in recovery.
 *
 * On iPhone, the installed web app and Safari do not share storage. A Google
 * sign-in started inside the installed app finishes in Safari, so the session
 * lands in Safari's storage and the installed app stays signed out.
 *
 * This module carries a short-lived, single-use handoff instead:
 *   - the installed app keeps a random secret locally and sends only its hash,
 *   - the return page in Safari binds the completed identity to that handoff,
 *   - the installed app claims once with the secret and redeems the ticket in
 *     its own storage context.
 *
 * Nothing sensitive travels in a URL. Safari and desktop sign-in are untouched.
 */
import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "s33d_pwa_auth_handoff";
export const HANDOFF_RETURN_PATH = "/auth/handoff";

export type PendingHandoff = {
  id: string;
  verifier: string;
  createdAt: number;
  /** Where the app should land once the session is restored. */
  returnPath: string;
};

export type ClaimResult =
  | { status: "signed-in" }
  | { status: "pending" }
  | { status: "none" }
  | { status: "failed"; reason: string };

/** True when the page is running as the installed (standalone) web app. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayStandalone =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches);
  return iosStandalone || displayStandalone;
}

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function readPendingHandoff(): PendingHandoff | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingHandoff;
    if (!parsed?.id || !parsed?.verifier) return null;
    // Expired locally — the server copy is dead too, so stop waiting.
    if (Date.now() - parsed.createdAt > 5 * 60_000) {
      clearPendingHandoff();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingHandoff() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* storage unavailable */ }
}

async function callHandoff(body: Record<string, unknown>) {
  return supabase.functions.invoke<Record<string, unknown>>("auth-handoff", { body });
}

/**
 * Opens a pending handoff and returns the return URL the OAuth flow should use.
 * The URL carries only an opaque identifier — never a token.
 */
export async function beginHandoff(returnPath: string): Promise<string | null> {
  const verifier = randomSecret();
  const verifierHash = await sha256Hex(verifier);
  const { data, error } = await callHandoff({ action: "create", verifier_hash: verifierHash });
  const id = typeof data?.handoff_id === "string" ? data.handoff_id : null;
  if (error || !id) return null;

  const pending: PendingHandoff = { id, verifier, createdAt: Date.now(), returnPath };
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch { return null; }

  return `${window.location.origin}${HANDOFF_RETURN_PATH}?h=${encodeURIComponent(id)}`;
}

/** Called in the browser that completed Google, holding the new session. */
export async function bindHandoff(handoffId: string): Promise<{ ok: boolean; reason?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { ok: false, reason: "no-session" };
  const { data, error } = await callHandoff({ action: "bind", handoff_id: handoffId });
  if (error || data?.ok !== true) return { ok: false, reason: "bind-failed" };
  return { ok: true };
}

/**
 * Called in the installed app after it is reopened. Consumes the handoff once
 * and creates the session in this context's own storage.
 */
export async function claimHandoff(): Promise<ClaimResult> {
  const pending = readPendingHandoff();
  if (!pending) return { status: "none" };

  const { data, error } = await callHandoff({
    action: "claim",
    handoff_id: pending.id,
    verifier: pending.verifier,
  });

  if (data?.status === "pending") return { status: "pending" };

  const tokenHash = typeof data?.token_hash === "string" ? data.token_hash : null;
  if (error || !tokenHash) {
    clearPendingHandoff();
    return { status: "failed", reason: "handoff-unavailable" };
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  clearPendingHandoff();
  if (verifyError) return { status: "failed", reason: "verify-failed" };
  return { status: "signed-in" };
}
