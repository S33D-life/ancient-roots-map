/**
 * telegram-handoff — Bot-initiated magic-link handoff for Telegram-first entry.
 *
 * Actions:
 *   create_handoff    → Bot creates a one-time token for connect or create flows
 *   create_account    → Creates a new S33D account from a verified Telegram handoff
 *   link_after_signin → Links Telegram to an existing authenticated account
 *   login_via_telegram → Establishes session for already-linked identity
 *   radio             → Returns a recent song offering from the forest
 *   continue          → Returns resume-where-you-left-off destination
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

/** Hash a Telegram user ID for safe storage */
async function hashTelegramId(telegramId: number | bigint): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`telegram:${telegramId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Send a Telegram message via the gateway */
async function sendTelegramMessage(chatId: number | string, text: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const telegramKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !telegramKey) {
    console.warn("Cannot send Telegram welcome: missing API keys");
    return;
  }
  try {
    await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": telegramKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.warn("Failed to send Telegram welcome:", e);
  }
}

/** Send post-link welcome message (once only, deduplicated via provider_metadata) */
async function sendWelcomeIfNeeded(
  supabase: ReturnType<typeof createClient>,
  connectedAccountId: string,
  telegramUserId: number,
) {
  // Check if welcome was already sent
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, provider_metadata")
    .eq("id", connectedAccountId)
    .single();

  const meta = (account?.provider_metadata as Record<string, unknown>) || {};
  if (meta.welcome_sent) return;

  // Mark welcome as sent FIRST (prevents duplicates on race)
  await supabase
    .from("connected_accounts")
    .update({ provider_metadata: { ...meta, welcome_sent: true } })
    .eq("id", connectedAccountId);

  // Send the welcome message
  await sendTelegramMessage(
    telegramUserId,
    "🌿 <b>You're now connected.</b>\n\n" +
    "I'll meet you here and in the forest.\n\n" +
    "When you visit a tree, leave an offering, or something grows — the path can remember.\n\n" +
    "Try /radio to hear what the forest is listening to, or /continue to pick up where you left off.",
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      /* ────────────────────────────────────────────────────
       * create_handoff — called by telegram-poll when bot
       * receives /connect, /new, /gardener, /wanderer, /login.
       * ──────────────────────────────────────────────────── */
      case "create_handoff": {
        const { telegram_user_id, telegram_username, flow, intent, extra_payload } = body;

        if (!telegram_user_id || !flow) {
          return jsonResponse({ ok: false, error: "telegram_user_id and flow required" }, 400);
        }

        const validFlows = ["connect", "create", "create_gardener", "create_wanderer", "login"];
        if (!validFlows.includes(flow)) {
          return jsonResponse({ ok: false, error: "Invalid flow type" }, 400);
        }

        const hashedId = await hashTelegramId(telegram_user_id);

        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (flow === "login") {
          if (!existingLink) {
            return jsonResponse({
              ok: false, error: "not_linked",
              message: "Your Telegram is not yet connected to an S33D account. Use /connect first.",
            });
          }
        } else if (flow === "connect" && existingLink) {
          return jsonResponse({
            ok: false, error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Use /login to sign in.",
          });
        } else if (flow.startsWith("create") && existingLink) {
          return jsonResponse({
            ok: false, error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Use /login to sign in.",
          });
        }

        const flowName = flow === "connect" ? "telegram_connect"
          : flow === "login" ? "telegram_login"
          : `telegram_${flow}`;

        const safeExtra: Record<string, string> = {};
        if (extra_payload && typeof extra_payload === "object") {
          for (const key of ["invite_code", "tree_id", "room"]) {
            if (typeof extra_payload[key] === "string" && extra_payload[key].length < 200) {
              safeExtra[key] = extra_payload[key];
            }
          }
        }

        const resolvedIntent = intent || "dashboard";

        const { data: handoff, error: rpcErr } = await supabase.rpc("create_bot_handoff", {
          p_source: "telegram",
          p_bot_name: "teotag",
          p_intent: resolvedIntent,
          p_external_user_hash: hashedId,
          p_flow_name: flowName,
          p_payload: {
            telegram_user_id,
            telegram_username: telegram_username || null,
            flow,
            ...safeExtra,
          },
          p_expires_minutes: 30,
        });

        if (rpcErr) {
          console.error("create_bot_handoff RPC error:", JSON.stringify(rpcErr));
          return jsonResponse({ ok: false, error: "Failed to create handoff", detail: rpcErr.message || rpcErr.code }, 500);
        }

        const result = handoff as { ok: boolean; token: string; expires_at: string };
        const appUrl = Deno.env.get("APP_URL") || "https://ancient-roots-map.lovable.app";

        const urlParams = new URLSearchParams({ token: result.token, flow });
        if (safeExtra.invite_code) urlParams.set("invite", safeExtra.invite_code);
        if (safeExtra.tree_id) urlParams.set("tree", safeExtra.tree_id);
        if (safeExtra.room) urlParams.set("room", safeExtra.room);

        const handoffUrl = `${appUrl}/telegram-handoff?${urlParams.toString()}`;

        return jsonResponse({
          ok: true,
          handoff_url: handoffUrl,
          token: result.token,
          expires_at: result.expires_at,
          flow,
          intent: resolvedIntent,
        });
      }

      /* ────────────────────────────────────────────────────
       * create_account — creates a new S33D account from
       * a verified Telegram handoff.
       * ──────────────────────────────────────────────────── */
      case "create_account": {
        const { token, identity_path } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        const resolvedPath = identity_path && ["gardener", "wanderer"].includes(identity_path)
          ? identity_path : "wanderer";

        const { data: handoffRow, error: readErr } = await supabase
          .from("bot_handoffs")
          .select("id, token, status, expires_at, payload, external_user_hash, claimed_by_user_id")
          .eq("token", token)
          .single();

        if (readErr || !handoffRow) {
          return jsonResponse({ ok: false, error: "not_found" });
        }

        if (handoffRow.status === "claimed") {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }
        if (handoffRow.status === "invalidated") {
          return jsonResponse({ ok: false, error: "invalidated" });
        }
        if (new Date(handoffRow.expires_at) < new Date()) {
          return jsonResponse({ ok: false, error: "expired" });
        }

        const { data: claimResult, error: claimErr } = await supabase
          .from("bot_handoffs")
          .update({ status: "claimed", claimed_at: new Date().toISOString() })
          .eq("token", token)
          .in("status", ["created", "opened"])
          .select("id")
          .maybeSingle();

        if (claimErr || !claimResult) {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }

        const payload = handoffRow.payload as {
          telegram_user_id?: number;
          telegram_username?: string;
        } | null;

        if (!payload?.telegram_user_id) {
          return jsonResponse({ ok: false, error: "No Telegram identity in handoff" }, 400);
        }

        const hashedId = await hashTelegramId(payload.telegram_user_id);

        const { data: existing } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened" })
            .eq("id", claimResult.id);

          return jsonResponse({
            ok: false, error: "already_linked",
            message: "This Telegram account is already connected to an S33D account. Please sign in instead.",
          });
        }

        const placeholderEmail = `tg_${hashedId.slice(0, 12)}@telegram.s33d.local`;
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();

        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: placeholderEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            source: "telegram",
            telegram_username: payload.telegram_username || null,
            first_step: resolvedPath,
          },
        });

        if (createErr) {
          console.error("Failed to create user:", createErr);
          if (createErr.message?.includes("already been registered")) {
            return jsonResponse({
              ok: false, error: "already_linked",
              message: "An account for this Telegram identity already exists. Please sign in.",
            });
          }
          return jsonResponse({ ok: false, error: "Failed to create account" }, 500);
        }

        // Link Telegram identity
        const { data: insertedAccount } = await supabase.from("connected_accounts").insert({
          user_id: newUser.user.id,
          provider: "telegram",
          provider_user_id: hashedId,
          provider_username: payload.telegram_username || null,
          display_name: payload.telegram_username ? `@${payload.telegram_username}` : "Telegram User",
          verified_at: new Date().toISOString(),
          provider_metadata: { welcome_sent: false },
        }).select("id").single();

        await supabase
          .from("bot_handoffs")
          .update({ claimed_by_user_id: newUser.user.id })
          .eq("id", claimResult.id);

        // Send post-link welcome (fire-and-forget)
        if (insertedAccount) {
          sendWelcomeIfNeeded(supabase, insertedAccount.id, payload.telegram_user_id).catch(() => {});
        }

        const { data: magicLink, error: magicErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: placeholderEmail,
        });

        if (magicErr || !magicLink) {
          console.error("Failed to generate magic link:", magicErr);
          return jsonResponse({
            ok: true, user_id: newUser.user.id, needs_manual_signin: true,
            identity_path: resolvedPath,
            message: "Account created but session link failed. Please sign in.",
          });
        }

        return jsonResponse({
          ok: true, user_id: newUser.user.id,
          access_token: magicLink.properties?.access_token,
          refresh_token: magicLink.properties?.refresh_token,
          identity_path: resolvedPath,
        });
      }

      /* ────────────────────────────────────────────────────
       * link_after_signin — links Telegram to existing account
       * ──────────────────────────────────────────────────── */
      case "link_after_signin": {
        const { token } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return jsonResponse({ ok: false, error: "Authentication required" }, 401);
        }
        const jwtToken = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(jwtToken);
        if (!user) {
          return jsonResponse({ ok: false, error: "Invalid session" }, 401);
        }

        const { data: handoff } = await supabase
          .from("bot_handoffs")
          .select("id, status, expires_at, payload, claimed_by_user_id")
          .eq("token", token)
          .single();

        if (!handoff) {
          return jsonResponse({ ok: false, error: "not_found" });
        }

        if (handoff.status === "claimed") {
          if (handoff.claimed_by_user_id === user.id) {
            return jsonResponse({ ok: true, linked: true, already_linked: true });
          }
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }

        if (handoff.status === "invalidated") {
          return jsonResponse({ ok: false, error: "invalidated" });
        }
        if (new Date(handoff.expires_at) < new Date()) {
          return jsonResponse({ ok: false, error: "expired" });
        }

        const payload = handoff.payload as {
          telegram_user_id?: number;
          telegram_username?: string;
        } | null;

        if (!payload?.telegram_user_id) {
          return jsonResponse({ ok: false, error: "No Telegram identity in handoff" });
        }

        const hashedId = await hashTelegramId(payload.telegram_user_id);

        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existingLink && existingLink.user_id !== user.id) {
          return jsonResponse({
            ok: false, error: "telegram_linked_elsewhere",
            message: "This Telegram account is already connected to a different S33D account.",
          });
        }

        if (existingLink && existingLink.user_id === user.id) {
          await supabase
            .from("bot_handoffs")
            .update({ status: "claimed", claimed_by_user_id: user.id, claimed_at: new Date().toISOString() })
            .eq("id", handoff.id);
          return jsonResponse({ ok: true, linked: true, already_linked: true });
        }

        const { data: userTg } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider", "telegram")
          .maybeSingle();

        if (userTg) {
          return jsonResponse({
            ok: false, error: "already_has_telegram",
            message: "You already have a different Telegram account linked. Unlink it first from your settings.",
          });
        }

        const { data: claimResult, error: claimErr } = await supabase
          .from("bot_handoffs")
          .update({
            status: "claimed",
            claimed_by_user_id: user.id,
            claimed_at: new Date().toISOString(),
          })
          .eq("token", token)
          .in("status", ["created", "opened"])
          .select("id")
          .maybeSingle();

        if (claimErr || !claimResult) {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }

        const { data: insertedAccount, error: linkErr } = await supabase.from("connected_accounts").insert({
          user_id: user.id,
          provider: "telegram",
          provider_user_id: hashedId,
          provider_username: payload.telegram_username || null,
          display_name: payload.telegram_username ? `@${payload.telegram_username}` : "Telegram User",
          verified_at: new Date().toISOString(),
          provider_metadata: { welcome_sent: false },
        }).select("id").single();

        if (linkErr) {
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);

          if (linkErr.code === "23505") {
            return jsonResponse({ ok: false, error: "telegram_linked_elsewhere", message: "This Telegram is already linked to an account." });
          }
          return jsonResponse({ ok: false, error: "Failed to link account" }, 500);
        }

        // Send post-link welcome (fire-and-forget)
        if (insertedAccount) {
          sendWelcomeIfNeeded(supabase, insertedAccount.id, payload.telegram_user_id).catch(() => {});
        }

        return jsonResponse({
          ok: true, linked: true,
          user_email: user.email,
          telegram_username: payload.telegram_username || null,
        });
      }

      /* ────────────────────────────────────────────────────
       * login_via_telegram — establishes session for linked identity
       * ──────────────────────────────────────────────────── */
      case "login_via_telegram": {
        const { token } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        const { data: handoffRow, error: readErr } = await supabase
          .from("bot_handoffs")
          .select("id, token, status, expires_at, payload, external_user_hash, flow_name, claimed_by_user_id")
          .eq("token", token)
          .single();

        if (readErr || !handoffRow) {
          return jsonResponse({ ok: false, error: "not_found" });
        }

        if (handoffRow.status === "claimed") {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }
        if (handoffRow.status === "invalidated") {
          return jsonResponse({ ok: false, error: "invalidated" });
        }
        if (new Date(handoffRow.expires_at) < new Date()) {
          return jsonResponse({ ok: false, error: "expired" });
        }

        if (handoffRow.flow_name !== "telegram_login") {
          return jsonResponse({ ok: false, error: "invalid_flow", message: "This link is not for login." }, 400);
        }

        const payload = handoffRow.payload as {
          telegram_user_id?: number;
          telegram_username?: string;
        } | null;

        if (!payload?.telegram_user_id) {
          return jsonResponse({ ok: false, error: "No Telegram identity in handoff" }, 400);
        }

        const hashedId = await hashTelegramId(payload.telegram_user_id);

        const { data: linkedAccount } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (!linkedAccount) {
          return jsonResponse({
            ok: false, error: "not_linked",
            message: "This Telegram is not connected to any S33D account.",
          });
        }

        const { data: claimResult, error: claimErr } = await supabase
          .from("bot_handoffs")
          .update({
            status: "claimed",
            claimed_by_user_id: linkedAccount.user_id,
            claimed_at: new Date().toISOString(),
          })
          .eq("token", token)
          .in("status", ["created", "opened"])
          .select("id")
          .maybeSingle();

        if (claimErr || !claimResult) {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }

        const { data: { user: linkedUser }, error: userErr } = await supabase.auth.admin.getUserById(linkedAccount.user_id);

        if (userErr || !linkedUser?.email) {
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);
          return jsonResponse({ ok: false, error: "User account not found" }, 500);
        }

        const { data: magicLink, error: magicErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: linkedUser.email,
        });

        if (magicErr || !magicLink) {
          console.error("Failed to generate login magic link:", magicErr);
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);
          return jsonResponse({ ok: false, error: "Failed to create session" }, 500);
        }

        return jsonResponse({
          ok: true, user_id: linkedAccount.user_id,
          access_token: magicLink.properties?.access_token,
          refresh_token: magicLink.properties?.refresh_token,
        });
      }

      /* ────────────────────────────────────────────────────
       * radio — returns a recent song offering from the forest
       * ──────────────────────────────────────────────────── */
      case "radio": {
        const { telegram_user_id } = body;

        if (!telegram_user_id) {
          return jsonResponse({ ok: false, error: "telegram_user_id required" }, 400);
        }

        const hashedId = await hashTelegramId(telegram_user_id);

        // Check if linked
        const { data: link } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        // Try user's own songs first (if linked)
        let song = null;
        if (link) {
          const { data } = await supabase
            .from("offerings")
            .select("title, content, media_url, youtube_url, tree_id, trees!inner(name, species)")
            .eq("type", "song")
            .eq("created_by", link.user_id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (data && data.length > 0) {
            // Pick a random one from recent 5 for variety
            song = data[Math.floor(Math.random() * data.length)];
          }
        }

        // Fallback: recent song from the whole forest
        if (!song) {
          const { data } = await supabase
            .from("offerings")
            .select("title, content, media_url, youtube_url, tree_id, trees!inner(name, species)")
            .eq("type", "song")
            .order("created_at", { ascending: false })
            .limit(10);

          if (data && data.length > 0) {
            song = data[Math.floor(Math.random() * data.length)];
          }
        }

        if (!song) {
          return jsonResponse({ ok: true, empty: true, message: "The forest is quiet just now — no songs have been offered yet." });
        }

        // Parse artist from content field (format: "Artist — Album")
        const contentStr = song.content || "";
        const artist = contentStr.split("—")[0]?.trim() || contentStr.split("-")[0]?.trim() || null;
        const tree = (song as any).trees;

        // Build media link
        let mediaLink = song.youtube_url || null;
        if (!mediaLink && song.media_url) {
          // Apple Music preview URLs are playable but short
          mediaLink = song.media_url;
        }

        return jsonResponse({
          ok: true,
          song: {
            title: song.title,
            artist,
            tree_name: tree?.name || null,
            species: tree?.species || null,
            media_url: mediaLink,
          },
        });
      }

      /* ────────────────────────────────────────────────────
       * continue — returns best resume destination for user
       * ──────────────────────────────────────────────────── */
      case "continue": {
        const { telegram_user_id } = body;

        if (!telegram_user_id) {
          return jsonResponse({ ok: false, error: "telegram_user_id required" }, 400);
        }

        const hashedId = await hashTelegramId(telegram_user_id);

        const { data: link } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (!link) {
          return jsonResponse({ ok: false, error: "not_linked" });
        }

        const appUrl = Deno.env.get("APP_URL") || "https://ancient-roots-map.lovable.app";

        // Signal 1: most recent offering → its tree
        const { data: recentOffering } = await supabase
          .from("offerings")
          .select("tree_id, trees!inner(name)")
          .eq("created_by", link.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentOffering?.tree_id) {
          const tree = (recentOffering as any).trees;
          return jsonResponse({
            ok: true,
            destination: `${appUrl}/map?tree=${recentOffering.tree_id}`,
            signal: "last_offering",
            label: tree?.name || "your last tree",
          });
        }

        // Signal 2: most recent handoff destination
        const { data: lastHandoff } = await supabase
          .from("bot_handoffs")
          .select("intent, return_to")
          .eq("claimed_by_user_id", link.user_id)
          .eq("status", "claimed")
          .order("claimed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastHandoff?.return_to) {
          return jsonResponse({
            ok: true,
            destination: `${appUrl}${lastHandoff.return_to}`,
            signal: "last_handoff",
            label: "where you left off",
          });
        }

        // Fallback: hearth/dashboard
        return jsonResponse({
          ok: true,
          destination: `${appUrl}/dashboard`,
          signal: "default",
          label: "your hearth",
        });
      }

      /* ────────────────────────────────────────────────────
       * council — returns Council of Life entry point
       * enriched with any recent participation or plant data
       * ──────────────────────────────────────────────────── */
      case "council": {
        const { telegram_user_id } = body;

        if (!telegram_user_id) {
          return jsonResponse({ ok: false, error: "telegram_user_id required" }, 400);
        }

        const hashedId = await hashTelegramId(telegram_user_id);
        const appUrl = Deno.env.get("APP_URL") || "https://ancient-roots-map.lovable.app";

        // Check if linked
        const { data: link } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        // Check for user's most recent council participation
        let lastGathering: { gathering_date: string; notes: string | null } | null = null;
        if (link) {
          const { data } = await supabase
            .from("council_participation_rewards")
            .select("gathering_date, notes")
            .eq("user_id", link.user_id)
            .order("gathering_date", { ascending: false })
            .limit(1)
            .maybeSingle();
          lastGathering = data;
        }

        // Check for any recent seasonal marker (acts as "plant of the season")
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const { data: seasonalPlant } = await supabase
          .from("bioregion_seasonal_markers")
          .select("name, emoji, description, marker_type")
          .lte("typical_month_start", currentMonth)
          .gte("typical_month_end", currentMonth)
          .eq("marker_type", "flowering")
          .limit(1)
          .maybeSingle();

        return jsonResponse({
          ok: true,
          council_url: `${appUrl}/council`,
          linked: !!link,
          last_gathering: lastGathering ? {
            date: lastGathering.gathering_date,
            notes: lastGathering.notes,
          } : null,
          seasonal_plant: seasonalPlant ? {
            name: seasonalPlant.name,
            emoji: seasonalPlant.emoji,
            description: seasonalPlant.description,
          } : null,
        });
      }

      default:
        return jsonResponse({ ok: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    console.error("telegram-handoff error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
