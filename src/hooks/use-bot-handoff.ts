/**
 * useBotHandoff — RPC-based bot handoff resolution and claiming.
 *
 * Canonical entry URL:
 *   /auth?source=telegram&bot=openclaw&handoff=<token>
 *
 * Contract:
 * - `handoff` is the ONLY authoritative lookup key
 * - URL params (intent, invite, gift, returnTo) are informational / diagnostic only
 * - App resolves via `resolve_bot_handoff(token)` RPC before auth
 * - App claims via `claim_bot_handoff(token)` RPC after auth
 * - Direct client reads/writes to bot_handoffs are forbidden
 *
 * Status vocabulary: created → opened → claimed | expired | invalidated
 * Intent vocabulary: map, add-tree, tree, gift, invite, referrals, roadmap, journey, support, dashboard, atlas, library
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "s33d_bot_handoff";

/* ── Types ─────────────────────────────────────────────── */

export interface BotHandoffContext {
  source: string;
  bot: string | null;
  handoffToken: string | null;
  /** Informational only — not routing authority */
  intent: string | null;
  invite: string | null;
  gift: string | null;
  returnTo: string | null;
  campaign: string | null;
}

/** Resolved handoff record returned by the RPC */
export interface ResolvedHandoff {
  ok: boolean;
  error?: "not_found" | "expired" | "already_claimed" | "invalidated";
  id?: string;
  token?: string;
  source?: string;
  bot_name?: string | null;
  intent?: string | null;
  return_to?: string | null;
  invite_code?: string | null;
  gift_code?: string | null;
  campaign?: string | null;
  flow_name?: string | null;
  step_key?: string | null;
  payload?: Record<string, unknown> | null;
  status?: string;
  /** Set on idempotent re-claim */
  already_yours?: boolean;
}

/* ── Intent vocabulary ─────────────────────────────────── */

const VALID_INTENTS = new Set([
  "map", "add-tree", "tree", "referrals", "gift", "invite",
  "roadmap", "dashboard", "atlas", "library",
  "journey", "support", "council",
]);

function sanitizeIntent(raw: string | null): string | null {
  if (!raw) return null;
  return VALID_INTENTS.has(raw) ? raw : null;
}

/* ── Route mapping ─────────────────────────────────────── */

/**
 * Map an intent to a route path.
 * /map is the canonical map route (not /atlas — atlas is the country index).
 */
export function intentToPath(intent: string | null, returnTo?: string | null): string {
  // returnTo from RPC is trusted; validate shape only
  if (returnTo) {
    if (returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/auth")) {
      return returnTo;
    }
  }
  switch (intent) {
    case "map":       return "/map";
    case "add-tree":  return "/add-tree";
    case "tree":      return "/map"; // tree detail needs an ID; fallback to map
    case "referrals": return "/referrals";
    case "invite":    return "/referrals";
    case "gift":      return "/dashboard";
    case "roadmap":   return "/roadmap";
    case "dashboard": return "/dashboard";
    case "atlas":     return "/atlas";
    case "library":   return "/library";
    case "journey":   return "/map";
    case "support":   return "/support";
    default:          return "/atlas";
  }
}

/* ── localStorage helpers ──────────────────────────────── */

export function getStoredHandoff(): BotHandoffContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredHandoff() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Resolve via RPC (pre-auth safe) ───────────────────── */

export async function resolveHandoffToken(token: string): Promise<ResolvedHandoff> {
  try {
    const { data, error } = await supabase.rpc("resolve_bot_handoff", { p_token: token });
    if (error) {
      console.warn("resolve_bot_handoff RPC error:", error.message);
      return { ok: false, error: "not_found" };
    }
    return (data as unknown as ResolvedHandoff) ?? { ok: false, error: "not_found" };
  } catch (e) {
    console.warn("resolve_bot_handoff failed:", e);
    return { ok: false, error: "not_found" };
  }
}

/* ── Claim via RPC (auth required) ─────────────────────── */

export async function claimHandoffToken(token: string): Promise<ResolvedHandoff> {
  try {
    const { data, error } = await supabase.rpc("claim_bot_handoff", { p_token: token });
    if (error) {
      console.warn("claim_bot_handoff RPC error:", error.message);
      return { ok: false, error: "not_found" };
    }
    return (data as unknown as ResolvedHandoff) ?? { ok: false, error: "not_found" };
  } catch (e) {
    console.warn("claim_bot_handoff failed:", e);
    return { ok: false, error: "not_found" };
  }
}

/* ── Main hook ─────────────────────────────────────────── */

export function useBotHandoff() {
  const [searchParams] = useSearchParams();
  const [resolvedHandoff, setResolvedHandoff] = useState<ResolvedHandoff | null>(null);
  const [resolved, setResolved] = useState(false);

  // Parse URL params on mount (informational)
  const context = useMemo<BotHandoffContext | null>(() => {
    const source = searchParams.get("source");
    if (!source) return getStoredHandoff();
    return {
      source,
      bot: searchParams.get("bot"),
      handoffToken: searchParams.get("handoff"),
      intent: sanitizeIntent(searchParams.get("intent")),
      invite: searchParams.get("invite"),
      gift: searchParams.get("gift"),
      returnTo: searchParams.get("returnTo"),
      campaign: searchParams.get("campaign"),
    };
  }, [searchParams]);

  // Persist context to survive auth redirect
  useEffect(() => {
    if (context?.source && searchParams.get("source")) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
      if (context.invite) localStorage.setItem("s33d_invite_code", context.invite);
      if (context.gift) localStorage.setItem("s33d_gift_code", context.gift);
    }
  }, [context, searchParams]);

  // Resolve handoff token via RPC
  useEffect(() => {
    const token = context?.handoffToken;
    if (!token) { setResolved(true); return; }

    (async () => {
      const result = await resolveHandoffToken(token);
      if (result.ok) {
        setResolvedHandoff(result);
        // Merge DB-authoritative invite/gift codes
        if (result.invite_code) localStorage.setItem("s33d_invite_code", result.invite_code);
        if (result.gift_code) localStorage.setItem("s33d_gift_code", result.gift_code);
      }
      setResolved(true);
    })();
  }, [context?.handoffToken]);

  /** Claim after auth — uses RPC, not direct update */
  const claimHandoff = useCallback(async (_userId: string) => {
    const stored = getStoredHandoff();
    const token = stored?.handoffToken || context?.handoffToken;
    if (!token) return;

    const result = await claimHandoffToken(token);
    if (result.ok) {
      // Update resolved handoff with claim result for routing
      setResolvedHandoff(prev => prev ? { ...prev, ...result } : result);
    }
    // Don't clear yet — BotContinuationBanner may still need it
  }, [context?.handoffToken]);

  /** Get post-auth destination — ONLY from RPC-resolved data */
  const getDestination = useCallback((): string => {
    // Trust RPC-resolved handoff over URL params
    if (resolvedHandoff?.ok) {
      return intentToPath(resolvedHandoff.intent ?? null, resolvedHandoff.return_to ?? null);
    }
    // Fallback: use stored context (informational)
    const stored = getStoredHandoff();
    const c = stored || context;
    if (!c) return "/atlas";
    return intentToPath(c.intent, c.returnTo);
  }, [context, resolvedHandoff]);

  const isFromBot = !!context?.source;
  const isTelegram = context?.source === "telegram";
  const handoffError = resolvedHandoff && !resolvedHandoff.ok ? resolvedHandoff.error : null;

  return {
    context,
    resolvedHandoff,
    resolved,
    isFromBot,
    isTelegram,
    handoffError,
    claimHandoff,
    getDestination,
  };
}
