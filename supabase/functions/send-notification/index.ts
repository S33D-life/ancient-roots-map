// send-notification — authenticated edge function that writes rows into
// public.notifications using the service role. Replaces the previously
// over-permissive client-side INSERT path that let any authenticated user
// target any other user's inbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CATEGORIES = new Set([
  "tree_visit",
  "whisper",
  "resonance",
  "invite",
  "general",
]);

const ALLOWED_PRIORITIES = new Set(["low", "normal", "high"]);

function bad(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return bad(401, "Unauthorized");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice(7);
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return bad(401, "Unauthorized");
    const actorId = claims.claims.sub as string;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad(400, "Invalid body");

    const {
      user_id,
      title,
      body: text,
      category,
      priority,
      deep_link,
      metadata,
    } = body as Record<string, unknown>;

    if (typeof user_id !== "string" || user_id.length < 8) return bad(400, "Invalid user_id");
    if (typeof title !== "string" || !title.trim() || title.length > 200) return bad(400, "Invalid title");
    if (typeof category !== "string" || !ALLOWED_CATEGORIES.has(category)) return bad(400, "Invalid category");
    const pri = typeof priority === "string" && ALLOWED_PRIORITIES.has(priority) ? priority : "normal";
    const bodyText = typeof text === "string" ? text.slice(0, 1000) : null;
    const link = typeof deep_link === "string" ? deep_link.slice(0, 500) : null;
    const meta = (metadata && typeof metadata === "object" && !Array.isArray(metadata))
      ? metadata as Record<string, unknown>
      : {};

    // No self-notifications
    if (user_id === actorId) {
      return new Response(JSON.stringify({ ok: true, skipped: "self" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { error: insertErr } = await admin.from("notifications").insert([{
      user_id,
      title: title.trim().slice(0, 200),
      body: bodyText,
      category,
      priority: pri,
      deep_link: link,
      metadata: { ...meta, actor_id: actorId },
    }]);

    if (insertErr) {
      console.error("[send-notification] insert error:", insertErr);
      return bad(500, "Unable to send notification");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-notification] unexpected:", e);
    return bad(500, "Unexpected error");
  }
});
