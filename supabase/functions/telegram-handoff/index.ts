/**
 * telegram-handoff — Bot-initiated magic-link handoff for Telegram-first entry.
 *
 * Actions:
 *   create_handoff    → Bot creates a one-time token for connect or create flows
 *   create_account    → Creates a new S33D account from a verified Telegram handoff
 *   link_after_signin → Links Telegram to an existing authenticated account
 *
 * Called by: telegram-poll (bot commands) and the app (account creation / linking)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Hash a Telegram user ID for safe storage */
async function hashTelegramId(telegramId: number | bigint): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`telegram:${telegramId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
       * Only callable internally (service_role).
       * ──────────────────────────────────────────────────── */
      case "create_handoff": {
        const { telegram_user_id, telegram_username, flow } = body;

        if (!telegram_user_id || !flow) {
          return jsonResponse({ ok: false, error: "telegram_user_id and flow required" }, 400);
        }

        const validFlows = ["connect", "create", "create_gardener", "create_wanderer", "login"];
        if (!validFlows.includes(flow)) {
          return jsonResponse({ ok: false, error: "Invalid flow type" }, 400);
        }

        const hashedId = await hashTelegramId(telegram_user_id);

        // Check if this Telegram identity is already linked
        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        // Login flow REQUIRES an existing link
        if (flow === "login") {
          if (!existingLink) {
            return jsonResponse({
              ok: false,
              error: "not_linked",
              message: "Your Telegram is not yet connected to an S33D account. Use /connect first.",
            });
          }
        } else if (flow === "connect" && existingLink) {
          return jsonResponse({
            ok: false,
            error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Use /login to sign in.",
          });
        } else if (flow.startsWith("create") && existingLink) {
          return jsonResponse({
            ok: false,
            error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Use /login to sign in.",
          });
        }

        const flowName = flow === "connect" ? "telegram_connect"
          : flow === "login" ? "telegram_login"
          : `telegram_${flow}`;

        const { data: handoff, error: rpcErr } = await supabase.rpc("create_bot_handoff", {
          p_source: "telegram",
          p_bot_name: "openclaw",
          p_intent: "dashboard",
          p_external_user_hash: hashedId,
          p_flow_name: flowName,
          p_payload: {
            telegram_user_id,
            telegram_username: telegram_username || null,
            flow,
          },
          p_expires_minutes: 30,
        });

        if (rpcErr) {
          console.error("create_bot_handoff RPC error:", rpcErr);
          return jsonResponse({ ok: false, error: "Failed to create handoff" }, 500);
        }

        const result = handoff as { ok: boolean; token: string; expires_at: string };
        const appUrl = Deno.env.get("APP_URL") || "https://s33d.life";
        const handoffUrl = `${appUrl}/telegram-handoff?token=${result.token}&flow=${flow}`;

        return jsonResponse({
          ok: true,
          handoff_url: handoffUrl,
          token: result.token,
          expires_at: result.expires_at,
          flow,
        });
      }

      /* ────────────────────────────────────────────────────
       * create_account — called by the app frontend after
       * the user chooses their first step on the handoff page.
       *
       * identity_path is a soft participation hint ("gardener" or "wanderer"),
       * NOT a permanent role. Users can always do both.
       * ──────────────────────────────────────────────────── */
      case "create_account": {
        const { token, identity_path } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        // Accept identity_path as an optional soft hint; default to "wanderer"
        const resolvedPath = identity_path && ["gardener", "wanderer"].includes(identity_path)
          ? identity_path
          : "wanderer";

        // Read the handoff directly to check status atomically
        const { data: handoffRow, error: readErr } = await supabase
          .from("bot_handoffs")
          .select("id, token, status, expires_at, payload, external_user_hash, claimed_by_user_id")
          .eq("token", token)
          .single();

        if (readErr || !handoffRow) {
          return jsonResponse({ ok: false, error: "not_found" });
        }

        // Reject already-claimed tokens (prevents duplicate account creation)
        if (handoffRow.status === "claimed") {
          return jsonResponse({ ok: false, error: "already_claimed", message: "This link has already been used." });
        }

        if (handoffRow.status === "invalidated") {
          return jsonResponse({ ok: false, error: "invalidated" });
        }

        if (new Date(handoffRow.expires_at) < new Date()) {
          return jsonResponse({ ok: false, error: "expired" });
        }

        // Atomically claim the handoff BEFORE creating the account
        // This prevents race conditions across tabs/devices
        const { data: claimResult, error: claimErr } = await supabase
          .from("bot_handoffs")
          .update({
            status: "claimed",
            claimed_at: new Date().toISOString(),
          })
          .eq("token", token)
          .in("status", ["created", "opened"])
          .select("id")
          .maybeSingle();

        if (claimErr || !claimResult) {
          // Another tab/device already claimed it
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

        // Double-check: is this Telegram already linked?
        const { data: existing } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existing) {
          // Unclaim so user can try connect flow instead
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened" })
            .eq("id", claimResult.id);

          return jsonResponse({
            ok: false,
            error: "already_linked",
            message: "This Telegram account is already connected to an S33D account. Please sign in instead.",
          });
        }

        // Create a new user with a placeholder email
        const placeholderEmail = `tg_${hashedId.slice(0, 12)}@telegram.s33d.local`;
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();

        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: placeholderEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            source: "telegram",
            telegram_username: payload.telegram_username || null,
            first_step: resolvedPath, // Soft participation hint, not a permanent role
          },
        });

        if (createErr) {
          console.error("Failed to create user:", createErr);
          // If user already exists with this placeholder email, guide to sign in
          if (createErr.message?.includes("already been registered")) {
            return jsonResponse({
              ok: false,
              error: "already_linked",
              message: "An account for this Telegram identity already exists. Please sign in.",
            });
          }
          return jsonResponse({ ok: false, error: "Failed to create account" }, 500);
        }

        // Link Telegram identity immediately
        await supabase.from("connected_accounts").insert({
          user_id: newUser.user.id,
          provider: "telegram",
          provider_user_id: hashedId,
          provider_username: payload.telegram_username || null,
          display_name: payload.telegram_username ? `@${payload.telegram_username}` : "Telegram User",
          verified_at: new Date().toISOString(),
        });

        // Update handoff with claimed user
        await supabase
          .from("bot_handoffs")
          .update({ claimed_by_user_id: newUser.user.id })
          .eq("id", claimResult.id);

        // Generate a magic link for session establishment
        const { data: magicLink, error: magicErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: placeholderEmail,
        });

        if (magicErr || !magicLink) {
          console.error("Failed to generate magic link:", magicErr);
          return jsonResponse({
            ok: true,
            user_id: newUser.user.id,
            needs_manual_signin: true,
            identity_path: resolvedPath,
            message: "Account created but session link failed. Please sign in.",
          });
        }

        return jsonResponse({
          ok: true,
          user_id: newUser.user.id,
          access_token: magicLink.properties?.access_token,
          refresh_token: magicLink.properties?.refresh_token,
          identity_path: resolvedPath,
        });
      }

      /* ────────────────────────────────────────────────────
       * link_after_signin — called after an existing user
       * signs in on the handoff page to link Telegram.
       * Requires auth header.
       * ──────────────────────────────────────────────────── */
      case "link_after_signin": {
        const { token } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        // Get authenticated user
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return jsonResponse({ ok: false, error: "Authentication required" }, 401);
        }
        const jwtToken = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(jwtToken);
        if (!user) {
          return jsonResponse({ ok: false, error: "Invalid session" }, 401);
        }

        // Read the handoff
        const { data: handoff } = await supabase
          .from("bot_handoffs")
          .select("id, status, expires_at, payload, claimed_by_user_id")
          .eq("token", token)
          .single();

        if (!handoff) {
          return jsonResponse({ ok: false, error: "not_found" });
        }

        // Already claimed — check if by same user (idempotent)
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

        // Check collision: Telegram already linked to different user
        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existingLink && existingLink.user_id !== user.id) {
          return jsonResponse({
            ok: false,
            error: "telegram_linked_elsewhere",
            message: "This Telegram account is already connected to a different S33D account.",
          });
        }

        if (existingLink && existingLink.user_id === user.id) {
          // Already linked to this user — idempotent, claim token
          await supabase
            .from("bot_handoffs")
            .update({ status: "claimed", claimed_by_user_id: user.id, claimed_at: new Date().toISOString() })
            .eq("id", handoff.id);
          return jsonResponse({ ok: true, linked: true, already_linked: true });
        }

        // Check user doesn't already have a different Telegram linked
        const { data: userTg } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider", "telegram")
          .maybeSingle();

        if (userTg) {
          return jsonResponse({
            ok: false,
            error: "already_has_telegram",
            message: "You already have a different Telegram account linked. Unlink it first from your settings.",
          });
        }

        // Atomically claim BEFORE linking (prevents race across tabs)
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

        // Link the Telegram identity
        const { error: linkErr } = await supabase.from("connected_accounts").insert({
          user_id: user.id,
          provider: "telegram",
          provider_user_id: hashedId,
          provider_username: payload.telegram_username || null,
          display_name: payload.telegram_username ? `@${payload.telegram_username}` : "Telegram User",
          verified_at: new Date().toISOString(),
        });

        if (linkErr) {
          // Rollback claim on link failure
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);

          if (linkErr.code === "23505") {
            return jsonResponse({ ok: false, error: "telegram_linked_elsewhere", message: "This Telegram is already linked to an account." });
          }
          return jsonResponse({ ok: false, error: "Failed to link account" }, 500);
        }

        return jsonResponse({
          ok: true,
          linked: true,
          user_email: user.email,
          telegram_username: payload.telegram_username || null,
        });
      }

      /* ────────────────────────────────────────────────────
       * login_via_telegram — establishes a session for an
       * already-linked Telegram identity. No auth header needed;
       * the handoff token + linked identity IS the proof.
       * ──────────────────────────────────────────────────── */
      case "login_via_telegram": {
        const { token } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        // Read the handoff
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

        // Verify this is a login-flow handoff
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

        // Look up the linked S33D account
        const { data: linkedAccount } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (!linkedAccount) {
          return jsonResponse({
            ok: false,
            error: "not_linked",
            message: "This Telegram is not connected to any S33D account.",
          });
        }

        // Atomically claim the handoff
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

        // Get user email for magic link generation
        const { data: { user: linkedUser }, error: userErr } = await supabase.auth.admin.getUserById(linkedAccount.user_id);

        if (userErr || !linkedUser?.email) {
          // Rollback claim
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);
          return jsonResponse({ ok: false, error: "User account not found" }, 500);
        }

        // Generate a magic link for session establishment
        const { data: magicLink, error: magicErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: linkedUser.email,
        });

        if (magicErr || !magicLink) {
          console.error("Failed to generate login magic link:", magicErr);
          // Rollback claim
          await supabase
            .from("bot_handoffs")
            .update({ status: "opened", claimed_by_user_id: null, claimed_at: null })
            .eq("id", claimResult.id);
          return jsonResponse({ ok: false, error: "Failed to create session" }, 500);
        }

        return jsonResponse({
          ok: true,
          user_id: linkedAccount.user_id,
          access_token: magicLink.properties?.access_token,
          refresh_token: magicLink.properties?.refresh_token,
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
