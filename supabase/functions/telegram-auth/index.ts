/**
 * telegram-auth — Bot-assisted Telegram identity verification and account linking.
 *
 * Actions:
 *   generate_code  → Creates a 6-digit verification code for account linking
 *   check_code     → Polls whether the code has been verified by the bot
 *   claim_code     → Claims a verified code, linking the Telegram identity
 *   signin_handoff → Creates a handoff token for bot-initiated sign-in
 *
 * Security:
 *   - Codes expire after 10 minutes
 *   - Telegram IDs are hashed (SHA-256) before storage in connected_accounts
 *   - One Telegram identity per S33D account (enforced by UNIQUE constraints)
 *   - Duplicate detection: if Telegram already linked to another user, reject
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

        // Expire any existing pending codes for this user
        await supabase
          .from("telegram_verification_codes")
          .update({ status: "expired" })
          .eq("user_id", userId)
          .eq("status", "pending");

        // Check if user already has Telegram linked
        const { data: existing } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("provider", "telegram")
          .maybeSingle();

        if (existing) {
          return jsonResponse({ ok: false, error: "Telegram is already linked to your account" });
        }

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
          instruction: `Send this code to the S33D bot on Telegram: ${codeRow.code}`,
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
          .select("*")
          .eq("id", code_id)
          .eq("user_id", userId)
          .single();

        if (!codeRow) {
          return jsonResponse({ ok: false, error: "Code not found" });
        }

        // Check expiry
        if (new Date(codeRow.expires_at) < new Date()) {
          await supabase
            .from("telegram_verification_codes")
            .update({ status: "expired" })
            .eq("id", code_id);
          return jsonResponse({ ok: false, status: "expired", error: "Code has expired" });
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
          return jsonResponse({ ok: false, error: "No verified code found. Please wait for bot verification." });
        }

        if (!codeRow.telegram_user_id) {
          return jsonResponse({ ok: false, error: "Telegram identity not yet confirmed by bot" });
        }

        // Check if this Telegram ID is already linked to another user
        const hashedId = await hashTelegramId(codeRow.telegram_user_id);

        const { data: existingLink } = await supabase
          .from("connected_accounts")
          .select("id, user_id")
          .eq("provider", "telegram")
          .eq("provider_user_id", hashedId)
          .maybeSingle();

        if (existingLink) {
          if (existingLink.user_id === userId) {
            // Already linked to this user — idempotent
            await supabase
              .from("telegram_verification_codes")
              .update({ status: "claimed", claimed_at: new Date().toISOString() })
              .eq("id", code_id);
            return jsonResponse({ ok: true, linked: true, already_linked: true });
          }
          return jsonResponse({
            ok: false,
            error: "This Telegram account is already linked to a different S33D account",
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
              : `Telegram User`,
            verified_at: new Date().toISOString(),
          });

        if (linkErr) {
          console.error("Failed to link Telegram account:", linkErr);
          // Handle unique constraint violation
          if (linkErr.code === "23505") {
            return jsonResponse({
              ok: false,
              error: "This Telegram account is already linked",
            });
          }
          return jsonResponse({ ok: false, error: "Failed to link account" }, 500);
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
