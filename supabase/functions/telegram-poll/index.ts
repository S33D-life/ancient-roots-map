/**
 * telegram-poll — Inbound message polling from Telegram.
 *
 * Called by pg_cron every minute. Polls getUpdates in a loop for ~55s,
 * storing incoming messages in telegram_inbound_queue.
 *
 * Also handles verification code messages: when a user sends a 6-digit code
 * matching a pending verification, marks it as verified with their Telegram identity.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

/** Check if a message text is a 6-digit verification code */
function extractVerificationCode(text: string | null): string | null {
  if (!text) return null;
  // Match standalone 6-digit code, or /verify 123456
  const match = text.trim().match(/^(?:\/verify\s+)?(\d{6})$/);
  return match ? match[1] : null;
}

Deno.serve(async () => {
  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if Telegram integration is enabled
  const { data: settings } = await supabase
    .from("telegram_settings")
    .select("enabled")
    .eq("id", 1)
    .single();

  if (!settings?.enabled) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "disabled" }));
  }

  let totalProcessed = 0;
  let codesVerified = 0;
  let currentOffset: number;

  const { data: state, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  currentOffset = state.update_offset;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ["message"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 502 });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Process each update
    for (const update of updates) {
      if (!update.message) continue;

      const msg = update.message;
      const code = extractVerificationCode(msg.text);

      // Handle verification codes (private messages to the bot)
      if (code && msg.chat?.type === "private" && msg.from?.id) {
        const telegramUserId = msg.from.id;
        const telegramUsername = msg.from.username || null;

        // Find a pending code that matches
        const { data: pendingCode } = await supabase
          .from("telegram_verification_codes")
          .select("id, expires_at")
          .eq("code", code)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingCode) {
          // Mark as verified with Telegram identity
          await supabase
            .from("telegram_verification_codes")
            .update({
              status: "verified",
              telegram_user_id: telegramUserId,
              telegram_username: telegramUsername,
              verified_at: new Date().toISOString(),
            })
            .eq("id", pendingCode.id);

          codesVerified++;

          // Send confirmation to user via Telegram
          await fetch(`${GATEWAY_URL}/sendMessage`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": TELEGRAM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              text: "✅ <b>Code verified!</b>\n\nReturn to S33D to complete the linking process.",
              parse_mode: "HTML",
            }),
          });
        } else {
          // No matching code — inform the user
          await fetch(`${GATEWAY_URL}/sendMessage`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": TELEGRAM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              text: "🌱 That code wasn't recognised. Please check it and try again, or generate a new one from S33D.",
              parse_mode: "HTML",
            }),
          });
        }
      }
    }

    // Store messages in inbound queue
    const rows = updates
      .filter((u: any) => u.message)
      .map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message.chat.id,
        from_user_id: u.message.from?.id || null,
        from_username: u.message.from?.username || null,
        message_text: u.message.text ?? null,
        raw_update: u,
      }));

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("telegram_inbound_queue")
        .upsert(rows, { onConflict: "update_id" });

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
      }
      totalProcessed += rows.length;
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;

    const { error: offsetErr } = await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (offsetErr) {
      return new Response(JSON.stringify({ error: offsetErr.message }), { status: 500 });
    }

    currentOffset = newOffset;
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, codesVerified, finalOffset: currentOffset }),
  );
});
