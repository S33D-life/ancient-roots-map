/**
 * telegram-poll — Inbound message polling from Telegram.
 *
 * Called by pg_cron every minute. Polls getUpdates in a loop for ~55s,
 * storing incoming messages in telegram_inbound_queue.
 *
 * Handles:
 * - Verification code messages (6-digit codes for account linking)
 * - Bot commands (/connect, /new, /gardener, /wanderer, /start, /help)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

/** Check if a message text is a 6-digit verification code */
function extractVerificationCode(text: string | null): string | null {
  if (!text) return null;
  const match = text.trim().match(/^(?:\/verify\s+)?(\d{6})$/);
  return match ? match[1] : null;
}

/** Extract bot command from message */
function extractCommand(text: string | null): string | null {
  if (!text) return null;
  const match = text.trim().match(/^\/(\w+)(?:\s|$)/);
  return match ? match[1].toLowerCase() : null;
}

/** Send a message via the Telegram gateway */
async function sendMessage(
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
  replyMarkup?: object,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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
  let commandsHandled = 0;
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
      const isPrivate = msg.chat?.type === "private";
      const chatId = msg.chat?.id;
      const telegramUserId = msg.from?.id;
      const telegramUsername = msg.from?.username || null;

      if (!isPrivate || !chatId || !telegramUserId) continue;

      // ── Check for verification codes ──
      const code = extractVerificationCode(msg.text);
      if (code) {
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

          await sendMessage(
            chatId,
            "✅ <b>Code verified!</b>\n\nReturn to S33D to complete the linking process.",
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
        } else {
          await sendMessage(
            chatId,
            "🌱 That code wasn't recognised. Please check it and try again, or generate a new one from S33D.",
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
        }
        continue;
      }

      // ── Check for bot commands ──
      const command = extractCommand(msg.text);
      if (!command) continue;

      commandsHandled++;

      switch (command) {
        case "start":
        case "help": {
          await sendMessage(
            chatId,
            "🌳 <b>Welcome to S33D</b>\n\n" +
            "I can help you enter the living forest.\n\n" +
            "🔗 /connect — Link your existing S33D account\n" +
            "🌱 /gardener — Create a new Gardener identity\n" +
            "🧭 /wanderer — Create a new Wanderer identity\n\n" +
            "If you have a verification code from S33D, just send me the 6-digit number.",
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
          break;
        }

        case "connect": {
          // Create a handoff for connecting existing account
          try {
            const handoffResp = await supabase.functions.invoke("telegram-handoff", {
              body: {
                action: "create_handoff",
                telegram_user_id: telegramUserId,
                telegram_username: telegramUsername,
                flow: "connect",
              },
            });

            const result = handoffResp.data;
            if (result?.ok) {
              await sendMessage(
                chatId,
                "🔗 <b>Connect your S33D account</b>\n\n" +
                "Open this link to sign in and connect your Telegram:\n\n" +
                `<a href="${result.handoff_url}">Enter S33D</a>\n\n` +
                "⏳ This link expires in 30 minutes.",
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
                {
                  inline_keyboard: [[
                    { text: "🌳 Enter S33D", url: result.handoff_url },
                  ]],
                },
              );
            } else if (result?.error === "already_linked") {
              const appUrl = Deno.env.get("APP_URL") || "https://s33d.life";
              await sendMessage(
                chatId,
                "✅ Your Telegram is already connected to S33D!\n\n" +
                `<a href="${appUrl}/dashboard">Open your Hearth</a>`,
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
                {
                  inline_keyboard: [[
                    { text: "🏠 Open Hearth", url: `${appUrl}/dashboard` },
                  ]],
                },
              );
            } else {
              await sendMessage(
                chatId,
                "❌ Something went wrong. Please try again in a moment.",
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
              );
            }
          } catch (e) {
            console.error("Failed to create connect handoff:", e);
            await sendMessage(
              chatId,
              "❌ Could not create the link right now. Please try again.",
              LOVABLE_API_KEY,
              TELEGRAM_API_KEY,
            );
          }
          break;
        }

        case "gardener":
        case "wanderer":
        case "new": {
          // /new → neutral "create" flow (user chooses Gardener/Wanderer in-app)
          // /gardener or /wanderer → pre-selected but still confirmed in-app
          const flow = command === "wanderer" ? "create_wanderer"
                     : command === "gardener" ? "create_gardener"
                     : "create"; // neutral for /new
          try {
            const handoffResp = await supabase.functions.invoke("telegram-handoff", {
              body: {
                action: "create_handoff",
                telegram_user_id: telegramUserId,
                telegram_username: telegramUsername,
                flow,
              },
            });

            const result = handoffResp.data;
            if (result?.ok) {
              const isNeutral = command === "new";
              const label = command === "wanderer" ? "Wanderer"
                          : command === "gardener" ? "Gardener"
                          : "";
              const emoji = command === "wanderer" ? "🧭" : command === "gardener" ? "🌱" : "🌳";
              const heading = isNeutral
                ? "🌳 <b>Create your S33D identity</b>"
                : `${emoji} <b>Create your ${label} identity</b>`;
              const cta = isNeutral ? "Choose your path" : "Begin your journey";

              await sendMessage(
                chatId,
                `${heading}\n\n` +
                "Open this link to enter S33D:\n\n" +
                `<a href="${result.handoff_url}">${cta}</a>\n\n` +
                "⏳ This link expires in 30 minutes.",
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
                {
                  inline_keyboard: [[
                    { text: `${emoji} ${cta}`, url: result.handoff_url },
                  ]],
                },
              );
            } else if (result?.error === "already_linked") {
              await sendMessage(
                chatId,
                "🌿 Your Telegram is already connected to an S33D account.\n\nUse /connect to sign in, or open S33D directly.",
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
              );
            } else {
              await sendMessage(
                chatId,
                "❌ Something went wrong. Please try again in a moment.",
                LOVABLE_API_KEY,
                TELEGRAM_API_KEY,
              );
            }
          } catch (e) {
            console.error("Failed to create new identity handoff:", e);
            await sendMessage(
              chatId,
              "❌ Could not create the link right now. Please try again.",
              LOVABLE_API_KEY,
              TELEGRAM_API_KEY,
            );
          }
          break;
        }

        default: {
          await sendMessage(
            chatId,
            "🌱 I didn't recognise that command.\n\nTry /help to see what I can do.",
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
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
    JSON.stringify({ ok: true, processed: totalProcessed, codesVerified, commandsHandled, finalOffset: currentOffset }),
  );
});
