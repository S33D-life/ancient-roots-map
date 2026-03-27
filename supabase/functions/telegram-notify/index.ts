/**
 * telegram-notify — Outbound notification from S33D to Telegram.
 *
 * Receives an event payload, formats a beautiful message, and sends it
 * to the configured Telegram group/channel via the Lovable connector gateway.
 *
 * POST body: { event_type, data }
 * event_type: "new_tree" | "offering" | "whisper" | "heart_milestone" | "council_invite" | "ecosystem_update"
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const APP_URL = "https://ancient-roots-map.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Message formatters (HTML parse_mode) ── */

interface EventData {
  tree_name?: string;
  tree_id?: string;
  species?: string;
  user_display?: string;
  offering_type?: string;
  whisper_preview?: string;
  hearts_total?: number;
  milestone?: string;
  council_name?: string;
  council_slug?: string;
  gathering_date?: string;
  title?: string;
  body?: string;
  link?: string;
}

function formatMessage(eventType: string, d: EventData): string {
  switch (eventType) {
    case "new_tree":
      return [
        `🌳 <b>New Ancient Friend Mapped</b>`,
        ``,
        d.tree_name ? `<b>${d.tree_name}</b>` : "A tree",
        d.species ? `<i>${d.species}</i>` : "",
        d.user_display ? `Planted by ${d.user_display}` : "",
        ``,
        d.tree_id ? `🔗 <a href="${APP_URL}/tree/${d.tree_id}">Visit this tree</a>` : "",
      ].filter(Boolean).join("\n");

    case "offering":
      return [
        `🎁 <b>New Offering</b>`,
        ``,
        d.tree_name ? `At <b>${d.tree_name}</b>` : "",
        d.offering_type ? `Type: ${d.offering_type}` : "",
        d.user_display ? `From ${d.user_display}` : "",
        ``,
        d.tree_id ? `🔗 <a href="${APP_URL}/tree/${d.tree_id}">See the offering</a>` : "",
      ].filter(Boolean).join("\n");

    case "whisper":
      return [
        `🌬️ <b>A Whisper in the Forest</b>`,
        ``,
        d.whisper_preview ? `"<i>${d.whisper_preview}</i>"` : "",
        d.tree_name ? `Beneath <b>${d.tree_name}</b>` : "",
        ``,
        d.tree_id ? `🔗 <a href="${APP_URL}/tree/${d.tree_id}">Listen</a>` : "",
      ].filter(Boolean).join("\n");

    case "heart_milestone":
      return [
        `❤️ <b>Heart Milestone</b>`,
        ``,
        d.milestone ? `${d.milestone}` : "",
        d.hearts_total ? `Total hearts flowing: <b>${d.hearts_total.toLocaleString()}</b>` : "",
        ``,
        `🔗 <a href="${APP_URL}/dashboard?tab=vault">Open the Vault</a>`,
      ].filter(Boolean).join("\n");

    case "council_invite":
      return [
        `🌿 <b>Council of Life — Gathering</b>`,
        ``,
        d.council_name ? `<b>${d.council_name}</b>` : "A council gathers",
        d.gathering_date ? `📅 ${d.gathering_date}` : "",
        ``,
        `All voices are welcome in the circle.`,
        ``,
        d.council_slug
          ? `🔗 <a href="${APP_URL}/councils/${d.council_slug}">Join the Council</a>`
          : `🔗 <a href="${APP_URL}/councils">View Councils</a>`,
      ].filter(Boolean).join("\n");

    case "ecosystem_update":
      return [
        `✨ <b>${d.title || "S33D Ecosystem Update"}</b>`,
        ``,
        d.body || "",
        ``,
        d.link
          ? `🔗 <a href="${d.link}">Learn more</a>`
          : `🔗 <a href="${APP_URL}">Enter S33D</a>`,
      ].filter(Boolean).join("\n");

    default:
      return [
        `🌱 <b>S33D Update</b>`,
        ``,
        d.body || d.title || "Something stirred in the forest.",
        ``,
        `🔗 <a href="${APP_URL}">Enter S33D</a>`,
      ].filter(Boolean).join("\n");
  }
}

/* ── Event type → settings column mapping ── */
const EVENT_TOGGLE_MAP: Record<string, string> = {
  new_tree: "notify_new_tree",
  offering: "notify_offering",
  whisper: "notify_whisper",
  heart_milestone: "notify_heart_milestone",
  council_invite: "notify_council_invite",
  ecosystem_update: "notify_ecosystem_update",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_type, data } = await req.json();
    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check settings
    const { data: settings } = await supabase
      .from("telegram_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings?.enabled || !settings?.chat_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: "Telegram integration disabled or no chat_id configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if this event type is enabled
    const toggleColumn = EVENT_TOGGLE_MAP[event_type];
    if (toggleColumn && !settings[toggleColumn]) {
      return new Response(
        JSON.stringify({ ok: false, reason: `Event type '${event_type}' is disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Format and send
    const messageText = formatMessage(event_type, data || {});

    const tgResponse = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const tgData = await tgResponse.json();

    // Log the outbound message
    const logEntry = {
      event_type,
      message_text: messageText,
      chat_id: settings.chat_id,
      telegram_message_id: tgData.result?.message_id || null,
      status: tgResponse.ok ? "sent" : "failed",
      error_message: tgResponse.ok ? null : JSON.stringify(tgData),
      metadata: data || {},
    };

    await supabase.from("telegram_outbound_log").insert(logEntry);

    if (!tgResponse.ok) {
      throw new Error(`Telegram API failed [${tgResponse.status}]: ${JSON.stringify(tgData)}`);
    }

    return new Response(
      JSON.stringify({ ok: true, message_id: tgData.result?.message_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("telegram-notify error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
