/**
 * telegram-auth — Bot-assisted Telegram identity verification and account linking.
 *
 * Actions:
 *   generate_code  → Creates a 6-digit verification code for account linking
 *   check_code     → Polls whether the code has been verified by the bot
 *   claim_code     → Claims a verified code, linking the Telegram identity
 *
 * Security:
 *   - Codes expire after 10 minutes
 *   - Rate limit: max 5 code generations per user per hour
 *   - Telegram IDs are hashed (SHA-256) before storage in connected_accounts
 *   - One Telegram identity per S33D account (enforced by UNIQUE constraints)
 *   - Duplicate detection: if Telegram already linked to another user, reject
 *   - Old pending codes are auto-expired on new generation
 *   - Stale code cleanup: codes older than 1 hour are purged on each generate call
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CODES_PER_HOUR = 5;

/** Hash a Telegram user ID for safe storage */
async function hashTelegramId(telegramId: number | bigint): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`telegram:${telegramId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a 6-digit code */
function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, code_id } = await req.json();

    // Extract user from auth header for authenticated actions
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    switch (action) {
      case "generate_code": {
        if (!userId) {
          return jsonResponse({ ok: false, error: "Authentication required" }, 401);
        }

        // ── Rate limit: max N codes per user per hour ──
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentCount } = await supabase
          .from("telegram_verification_codes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", oneHourAgo);

        if ((recentCount ?? 0) >= MAX_CODES_PER_HOUR) {
          return jsonResponse({
            ok: false,
            error: "Too many verification attempts. Please wait before trying again.",
          }, 429);
        }

        // ── Cleanup: expire pending codes and purge old rows ──
        await supabase
          .from("telegram_verification_codes")
          .update({ status: "expired" })
          .eq("user_id", userId)
          .eq("status", "pending");

        // Purge stale rows older than 1 hour (all statuses except claimed)
        await supabase
          .from("telegram_verification_codes")
          .delete()
          .eq("user_id", userId)
          .neq("status", "claimed")
          .lt("created_at", oneHourAgo);

        // ── Check if already linked ──
        const { data: existing } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("provider", "telegram")
          .maybeSingle();

        if (existing) {
          return jsonResponse({
            ok: false,
            error: "A Telegram account is already linked. Unlink it first to connect a different one.",
          });
        }

        // ── Generate new code ──
        const code = generateCode();

        const { data: codeRow, error: insertErr } = await supabase
          .from("telegram_verification_codes")
          .insert({
            user_id: userId,
            code,
            action: "link",
          })
          .select("id, code, expires_at")
          .single();

        if (insertErr) {
          console.error("Failed to create verification code:", insertErr);
          return jsonResponse({ ok: false, error: "Failed to create verification code" }, 500);
        }

        // Get bot username from settings
        const { data: settings } = await supabase
          .from("telegram_settings")
          .select("bot_username")
          .eq("id", 1)
          .single();

        return jsonResponse({
          ok: true,
          code_id: codeRow.id,
          code: codeRow.code,
          expires_at: codeRow.expires_at,
          bot_username: settings?.bot_username || null,
        });
      }

      case "check_code": {
        if (!userId) {
          return jsonResponse({ ok: false, error: "Authentication required" }, 401);
        }
        if (!code_id) {
          return jsonResponse({ ok: false, error: "code_id required" }, 400);
        }

        const { data: codeRow } = await supabase
          .from("telegram_verification_codes")
          .select("status, expires_at, telegram_username")
          .eq("id", code_id)
          .eq("user_id", userId)
          .single();

        if (!codeRow) {
          return jsonResponse({ ok: false, error: "Code not found" });
        }

        // Check expiry
        if (new Date(codeRow.expires_at) < new Date() && codeRow.status === "pending") {
          await supabase
            .from("telegram_verification_codes")
            .update({ status: "expired" })
            .eq("id", code_id);
          return jsonResponse({ ok: true, status: "expired" });
        }

        return jsonResponse({
          ok: true,
          status: codeRow.status,
          telegram_username: codeRow.telegram_username,
        });
      }

      case "claim_code": {
        if (!userId) {
          return jsonResponse({ ok: false, error: "Authentication required" }, 401);
        }
        if (!code_id) {
          return jsonResponse({ ok: false, error: "code_id required" }, 400);
        }

        const { data: codeRow } = await supabase
          .from("telegram_verification_codes")
          .select("*")
          .eq("id", code_id)
          .eq("user_id", userId)
          .eq("status", "verified")
          .single();

        if (!codeRow) {
          return jsonResponse({
            ok: false,
            error: "No verified code found. Please send the code to the S33D bot first.",
          });
        }

        if (!codeRow.telegram_user_id) {
          return jsonResponse({
            ok: false,
            error: "Telegram identity not yet confirmed. Please send the code to the bot.",
          });
        }

        // Check for collision: Telegram ID already linked to another user
        const hashedId = await hashTelegramId(codeRow.telegram_user_id);

        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("id, user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existingLink) {
          if (existingLink.user_id === userId) {
            // Already linked to this user — idempotent success
            await supabase
              .from("telegram_verification_codes")
              .update({ status: "claimed", claimed_at: new Date().toISOString() })
              .eq("id", code_id);
            return jsonResponse({ ok: true, linked: true, already_linked: true });
          }
          return jsonResponse({
            ok: false,
            error: "This Telegram account is already connected to a different S33D account. Each Telegram identity can only be linked to one account.",
          });
        }

        // Check user doesn't already have a different Telegram linked
        const { data: userTelegram } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("provider", "telegram")
          .maybeSingle();

        if (userTelegram) {
          return jsonResponse({
            ok: false,
            error: "You already have a Telegram account linked. Please unlink it first.",
          });
        }

        // Link the account
        const { error: linkErr } = await supabase
          .from("connected_accounts")
          .insert({
            user_id: userId,
            provider: "telegram",
            provider_user_id: hashedId,
            provider_username: codeRow.telegram_username || null,
            display_name: codeRow.telegram_username
              ? `@${codeRow.telegram_username}`
              : "Telegram User",
            verified_at: new Date().toISOString(),
          });

        if (linkErr) {
          console.error("Failed to link Telegram account:", linkErr);
          if (linkErr.code === "23505") {
            return jsonResponse({
              ok: false,
              error: "This Telegram account is already linked to an S33D account.",
            });
          }
          return jsonResponse({ ok: false, error: "Failed to link account. Please try again." }, 500);
        }

        // Mark code as claimed
        await supabase
          .from("telegram_verification_codes")
          .update({ status: "claimed", claimed_at: new Date().toISOString() })
          .eq("id", code_id);

        return jsonResponse({ ok: true, linked: true });
      }

      default:
        return jsonResponse({ ok: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    console.error("telegram-auth error:", error);
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
