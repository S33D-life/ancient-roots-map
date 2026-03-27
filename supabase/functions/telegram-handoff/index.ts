/**
 * telegram-handoff — Bot-initiated magic-link handoff for Telegram-first entry.
 *
 * Actions:
 *   create_handoff  → Bot creates a one-time token for connect or create flows
 *   create_account  → Creates a new S33D account from a verified Telegram handoff
 *
 * Called by: telegram-poll (bot commands) and the app (account creation)
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
       * receives /connect or /new commands.
       * Only callable with service_role (internal).
       * ──────────────────────────────────────────────────── */
      case "create_handoff": {
        const { telegram_user_id, telegram_username, flow } = body;

        if (!telegram_user_id || !flow) {
          return jsonResponse({ ok: false, error: "telegram_user_id and flow required" }, 400);
        }

        if (!["connect", "create_gardener", "create_wanderer"].includes(flow)) {
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

        // For "connect" flow: if already linked, inform user
        if (flow === "connect" && existingLink) {
          return jsonResponse({
            ok: false,
            error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Open S33D to continue.",
          });
        }

        // For "create" flows: if already linked, redirect to connect
        if ((flow === "create_gardener" || flow === "create_wanderer") && existingLink) {
          return jsonResponse({
            ok: false,
            error: "already_linked",
            message: "Your Telegram is already connected to an S33D account. Use /connect instead.",
          });
        }

        // Determine intent based on flow
        const intent = flow === "connect" ? "dashboard" : "dashboard";
        const flowName = flow === "connect" ? "telegram_connect" : `telegram_${flow}`;

        // Create handoff via RPC
        const { data: handoff, error: rpcErr } = await supabase.rpc("create_bot_handoff", {
          p_source: "telegram",
          p_bot_name: "openclaw",
          p_intent: intent,
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

        // Build the magic link URL
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
       * the user lands on the handoff page and chooses to
       * create a new account.
       * ──────────────────────────────────────────────────── */
      case "create_account": {
        const { token } = body;

        if (!token) {
          return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        // Resolve the handoff to get Telegram identity
        const { data: handoff, error: resolveErr } = await supabase.rpc("resolve_bot_handoff", {
          p_token: token,
        });

        if (resolveErr || !handoff?.ok) {
          const errMsg = handoff?.error || "invalid_token";
          return jsonResponse({ ok: false, error: errMsg });
        }

        const payload = handoff.payload as {
          telegram_user_id?: number;
          telegram_username?: string;
          flow?: string;
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
          email_confirm: true, // auto-confirm since verified via Telegram
          user_metadata: {
            source: "telegram",
            telegram_username: payload.telegram_username || null,
            identity_path: payload.flow === "create_gardener" ? "gardener" : "wanderer",
          },
        });

        if (createErr) {
          console.error("Failed to create user:", createErr);
          return jsonResponse({ ok: false, error: "Failed to create account" }, 500);
        }

        // Link Telegram identity immediately
        const { error: linkErr } = await supabase.from("connected_accounts").insert({
          user_id: newUser.user.id,
          provider: "telegram",
          provider_user_id: hashedId,
          provider_username: payload.telegram_username || null,
          display_name: payload.telegram_username ? `@${payload.telegram_username}` : "Telegram User",
          verified_at: new Date().toISOString(),
        });

        if (linkErr) {
          console.error("Failed to link Telegram:", linkErr);
          // User was created but linking failed — still continue
        }

        // Claim the handoff for this new user
        // Use service role to claim since user isn't authenticated yet in client
        await supabase
          .from("bot_handoffs")
          .update({
            status: "claimed",
            claimed_by_user_id: newUser.user.id,
            claimed_at: new Date().toISOString(),
          })
          .eq("token", token)
          .in("status", ["created", "opened"]);

        // Generate a magic link for the new user to sign in
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
            message: "Account created but session link failed. Please sign in.",
          });
        }

        return jsonResponse({
          ok: true,
          user_id: newUser.user.id,
          // Return the token properties needed for client-side session establishment
          access_token: magicLink.properties?.access_token,
          refresh_token: magicLink.properties?.refresh_token,
          identity_path: payload.flow === "create_gardener" ? "gardener" : "wanderer",
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

        // Resolve the handoff
        const { data: handoff } = await supabase
          .from("bot_handoffs")
          .select("*")
          .eq("token", token)
          .in("status", ["created", "opened"])
          .single();

        if (!handoff) {
          return jsonResponse({ ok: false, error: "Invalid or expired handoff" });
        }

        // Check expiry
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
          // Already linked to this user — idempotent success
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
          if (linkErr.code === "23505") {
            return jsonResponse({ ok: false, error: "This Telegram is already linked to an account." });
          }
          return jsonResponse({ ok: false, error: "Failed to link account" }, 500);
        }

        // Claim the handoff
        await supabase
          .from("bot_handoffs")
          .update({ status: "claimed", claimed_by_user_id: user.id, claimed_at: new Date().toISOString() })
          .eq("id", handoff.id);

        return jsonResponse({ ok: true, linked: true });
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
