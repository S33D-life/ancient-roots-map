/**
 * telegram-poll — Inbound message polling from Telegram.
 *
 * Called by pg_cron every minute. Polls getUpdates in a loop for ~55s,
 * storing incoming messages in telegram_inbound_queue.
 *
 * Handles:
 * - Verification code messages (6-digit codes for account linking)
 * - Bot commands (/connect, /new, /gardener, /wanderer, /start, /help)
 * - Deep-link /start payloads (invite_CODE, login, connect, tree_ID, room_*, etc.)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

/* ── Start param parser ─────────────────────────────────── */

interface ParsedStartParam {
  /** Which flow to request from telegram-handoff */
  flow: string;
  /** App-level intent for post-auth routing */
  intent: string;
  /** Optional extra context (tree ID, invite code, room name) */
  context: Record<string, string>;
}

/**
 * Parse a Telegram /start payload into a structured intent.
 * Returns null for bare /start (treated as help).
 */
function parseStartPayload(payload: string | null): ParsedStartParam | null {
  if (!payload) return null;
  const trimmed = payload.trim();
  if (!trimmed) return null;

  // invite_CODE → preserve invite code, onboard or connect
  if (trimmed.startsWith("invite_")) {
    const code = trimmed.slice(7);
    if (code) {
      return { flow: "create", intent: "invite", context: { invite_code: code } };
    }
  }

  // tree_UUID → open specific tree after auth
  if (trimmed.startsWith("tree_")) {
    const treeId = trimmed.slice(5);
    if (treeId) {
      return { flow: "login", intent: "tree", context: { tree_id: treeId } };
    }
  }

  // room_* → open a specific room after auth
  if (trimmed.startsWith("room_")) {
    const room = trimmed.slice(5);
    const validRooms: Record<string, string> = {
      music: "library",
      library: "library",
      council: "dashboard",
    };
    if (validRooms[room]) {
      return { flow: "login", intent: validRooms[room], context: { room } };
    }
  }

  // Exact-match keywords
  switch (trimmed) {
    case "login":
      return { flow: "login", intent: "dashboard", context: {} };
    case "connect":
      return { flow: "connect", intent: "dashboard", context: {} };
    case "new_gardener":
      return { flow: "create_gardener", intent: "add-tree", context: {} };
    case "new_wanderer":
      return { flow: "create_wanderer", intent: "atlas", context: {} };
    default:
      return null;
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

/** Check if a message text is a 6-digit verification code */
function extractVerificationCode(text: string | null): string | null {
  if (!text) return null;
  const match = text.trim().match(/^(?:\/verify\s+)?(\d{6})$/);
  return match ? match[1] : null;
}

/** Extract bot command and payload from message */
function extractCommand(text: string | null): { command: string; payload: string | null } | null {
  if (!text) return null;
  const match = text.trim().match(/^\/(\w+)(?:\s+(.+))?$/);
  if (!match) return null;
  return { command: match[1].toLowerCase(), payload: match[2]?.trim() || null };
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

/** Create a handoff and send the user a link */
async function createAndSendHandoff(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  telegramUserId: number,
  telegramUsername: string | null,
  flow: string,
  intent: string,
  extraPayload: Record<string, string>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  try {
    const handoffResp = await supabase.functions.invoke("telegram-handoff", {
      body: {
        action: "create_handoff",
        telegram_user_id: telegramUserId,
        telegram_username: telegramUsername,
        flow,
        intent,
        extra_payload: extraPayload,
      },
    });

    const result = handoffResp.data;
    if (!result?.ok) {
      if (result?.error === "not_linked") {
        await sendMessage(
          chatId,
          "🌱 Your Telegram isn't linked to S33D yet.\n\n" +
          "I can help — use /connect to link an existing account, or /new to begin a new path.",
          lovableKey, telegramKey,
        );
      } else if (result?.error === "already_linked") {
        await sendMessage(
          chatId,
          "✅ You're already connected to S33D.\n\nUse /login and I'll open the gate for you.",
          lovableKey, telegramKey,
        );
      } else {
        await sendMessage(chatId, "🌿 Something went awry. Try again in a moment — I'll be here.", lovableKey, telegramKey);
      }
      return false;
    }

    // Build contextual message
    const isLogin = flow === "login";
    const isConnect = flow === "connect";
    const isCreate = flow.startsWith("create");

    let heading: string;
    let cta: string;
    let emoji: string;

    if (isLogin) {
      heading = "🔑 <b>Enter S33D</b>";
      cta = "Open the gate";
      emoji = "🌳";
    } else if (isConnect) {
      heading = "🔗 <b>Link your S33D account</b>";
      cta = "Connect & enter";
      emoji = "🌳";
    } else if (flow === "create_gardener") {
      heading = "🌱 <b>Begin as a Gardener</b>";
      cta = "Plant your first seed";
      emoji = "🌱";
    } else if (flow === "create_wanderer") {
      heading = "🧭 <b>Begin as a Wanderer</b>";
      cta = "Start walking";
      emoji = "🧭";
    } else {
      heading = "🌳 <b>Enter S33D</b>";
      cta = "Step into the forest";
      emoji = "🌳";
    }

    // Add context to message
    let extra = "";
    if (extraPayload.invite_code) {
      extra = "\n\n🎋 You've been invited by a fellow wanderer.";
    } else if (extraPayload.tree_id) {
      extra = "\n\n🌳 A tree is waiting for you.";
    } else if (extraPayload.room) {
      const roomNames: Record<string, string> = { music: "Earth Radio", library: "Heartwood Library", council: "Council of Life" };
      extra = `\n\n📍 Heading to: ${roomNames[extraPayload.room] || extraPayload.room}`;
    }

    await sendMessage(
      chatId,
      `${heading}${extra}\n\nI've prepared a path for you:\n\n` +
      `<a href="${result.handoff_url}">${cta}</a>\n\n` +
      "⏳ This path stays open for 30 minutes.",
      lovableKey, telegramKey,
      { inline_keyboard: [[ { text: `${emoji} ${cta}`, url: result.handoff_url } ]] },
    );
    return true;
  } catch (e) {
    console.error("Failed to create handoff:", e);
    await sendMessage(chatId, "🌿 I couldn't prepare the path right now. Please try again in a moment.", lovableKey, telegramKey);
    return false;
  }
}

/* ── Main handler ────────────────────────────────────────── */

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
      const parsed = extractCommand(msg.text);
      if (!parsed) continue;

      commandsHandled++;
      const { command, payload } = parsed;

      // ── /start with a deep-link payload ──
      if (command === "start" && payload) {
        const startParam = parseStartPayload(payload);
        if (startParam) {
          await createAndSendHandoff(
            supabase, chatId, telegramUserId, telegramUsername,
            startParam.flow, startParam.intent, startParam.context,
            LOVABLE_API_KEY, TELEGRAM_API_KEY,
          );
          continue;
        }
        // Unknown payload → fall through to help
      }

      switch (command) {
        case "start":
        case "help": {
          await sendMessage(
            chatId,
            "🌳 <b>Welcome to S33D</b>\n\n" +
            "I can help you enter the living forest.\n\n" +
            "🔑 /login — Sign in to your S33D account\n" +
            "🔗 /connect — Link your existing S33D account\n" +
            "🌳 /new — Create a new S33D identity\n\n" +
            "If you have a verification code from S33D, just send me the 6-digit number.",
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
          break;
        }

        case "login": {
          await createAndSendHandoff(
            supabase, chatId, telegramUserId, telegramUsername,
            "login", "dashboard", {},
            LOVABLE_API_KEY, TELEGRAM_API_KEY,
          );
          break;
        }

        case "connect": {
          await createAndSendHandoff(
            supabase, chatId, telegramUserId, telegramUsername,
            "connect", "dashboard", {},
            LOVABLE_API_KEY, TELEGRAM_API_KEY,
          );
          break;
        }

        case "gardener":
        case "wanderer":
        case "new": {
          const flow = command === "wanderer" ? "create_wanderer"
                     : command === "gardener" ? "create_gardener"
                     : "create";
          const intent = command === "gardener" ? "add-tree" : "atlas";
          await createAndSendHandoff(
            supabase, chatId, telegramUserId, telegramUsername,
            flow, intent, {},
            LOVABLE_API_KEY, TELEGRAM_API_KEY,
          );
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
