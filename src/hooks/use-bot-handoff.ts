/**
 * useBotHandoff — parse, persist, and claim bot handoff context.
 *
 * URL contract:
 *   ?source=telegram&bot=openclaw&handoff=<token>&intent=map&invite=...&gift=...&returnTo=...
 *
 * Flow:
 * 1. On mount, parse params → store in localStorage as `s33d_bot_handoff`
 * 2. Resolve token from Supabase `bot_handoffs` table
 * 3. After auth, call `claimHandoff()` to mark it claimed and route user
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "s33d_bot_handoff";

export interface BotHandoffContext {
  source: string;
  bot: string | null;
  handoffToken: string | null;
  intent: string | null;
  invite: string | null;
  gift: string | null;
  returnTo: string | null;
  campaign: string | null;
}

export interface BotHandoffRecord {
  id: string;
  token: string;
  source: string;
  bot_name: string | null;
  intent: string | null;
  return_to: string | null;
  invite_code: string | null;
  gift_code: string | null;
  campaign: string | null;
  payload: Record<string, unknown>;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  expires_at: string;
}

/** Valid intents the app can route to */
const VALID_INTENTS = new Set([
  "map", "add-tree", "tree", "referrals", "gift",
  "roadmap", "dashboard", "atlas", "library",
]);

function sanitizeIntent(raw: string | null): string | null {
  if (!raw) return null;
  return VALID_INTENTS.has(raw) ? raw : null;
}

/** Map intent to a route path */
export function intentToPath(intent: string | null, returnTo?: string | null): string {
  if (returnTo) {
    // Basic safety: must start with / and not //
    if (returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/auth")) {
      return returnTo;
    }
  }
  switch (intent) {
    case "map": return "/map";
    case "add-tree": return "/add-tree";
    case "referrals": return "/referrals";
    case "gift": return "/dashboard";
    case "roadmap": return "/roadmap";
    case "dashboard": return "/dashboard";
    case "atlas": return "/atlas";
    case "library": return "/library";
    default: return "/atlas";
  }
}

/** Read stored handoff from localStorage */
export function getStoredHandoff(): BotHandoffContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Clear stored handoff */
export function clearStoredHandoff() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useBotHandoff() {
  const [searchParams] = useSearchParams();
  const [handoffRecord, setHandoffRecord] = useState<BotHandoffRecord | null>(null);
  const [resolved, setResolved] = useState(false);

  // Parse URL params on mount
  const context = useMemo<BotHandoffContext | null>(() => {
    const source = searchParams.get("source");
    if (!source) {
      // Check localStorage for previously stored handoff
      return getStoredHandoff();
    }
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

  // Store handoff context in localStorage to survive auth redirect
  useEffect(() => {
    if (context?.source && searchParams.get("source")) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));

      // Also store invite/gift codes in their standard keys
      if (context.invite) {
        localStorage.setItem("s33d_invite_code", context.invite);
      }
      if (context.gift) {
        localStorage.setItem("s33d_gift_code", context.gift);
      }
    }
  }, [context, searchParams]);

  // Resolve handoff token from DB
  useEffect(() => {
    const token = context?.handoffToken;
    if (!token) { setResolved(true); return; }

    (async () => {
      const { data } = await supabase
        .from("bot_handoffs")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (data) {
        const now = new Date();
        const expires = new Date(data.expires_at);
        if (expires > now && !data.claimed_by_user_id) {
          setHandoffRecord(data as unknown as BotHandoffRecord);
          // Merge DB-side fields into context
          if (data.invite_code) localStorage.setItem("s33d_invite_code", data.invite_code);
          if (data.gift_code) localStorage.setItem("s33d_gift_code", data.gift_code);
        }
      }
      setResolved(true);
    })();
  }, [context?.handoffToken]);

  /** Claim the handoff after auth — mark in DB and clear local state */
  const claimHandoff = useCallback(async (userId: string) => {
    const stored = getStoredHandoff();
    const token = stored?.handoffToken || context?.handoffToken;
    if (!token) return;

    await supabase
      .from("bot_handoffs")
      .update({
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
      } as any)
      .eq("token", token)
      .is("claimed_by_user_id", null);

    clearStoredHandoff();
  }, [context?.handoffToken]);

  /** Get the best post-auth destination based on handoff context */
  const getDestination = useCallback((): string => {
    const stored = getStoredHandoff();
    const c = stored || context;
    if (!c) return "/atlas";

    // DB record may override URL params
    if (handoffRecord) {
      return intentToPath(
        handoffRecord.intent || c.intent,
        handoffRecord.return_to || c.returnTo,
      );
    }
    return intentToPath(c.intent, c.returnTo);
  }, [context, handoffRecord]);

  const isFromBot = !!(context?.source);
  const isTelegram = context?.source === "telegram";

  return {
    context,
    handoffRecord,
    resolved,
    isFromBot,
    isTelegram,
    claimHandoff,
    getDestination,
  };
}
