/**
 * auth-handoff — cross-context sign-in handoff for the installed iOS web app.
 *
 * On iPhone the installed (standalone) web app and Safari keep separate
 * storage. Google sign-in started inside the installed app finishes in Safari,
 * so the session lands in the wrong context. This function lets the installed
 * app recover its own session without ever putting a token in a URL:
 *
 *   create : the app stores only the FINGERPRINT of a secret it keeps locally
 *   bind   : Safari, holding the freshly completed session, attaches the user
 *            and a single-use sign-in ticket to that pending handoff
 *   claim  : the app proves the secret and receives the ticket exactly once
 *
 * The ticket is a server-generated one-time token hash for the same account;
 * the app redeems it itself so the session is created in its own storage.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTL_MINUTES = 5;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isHash = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/i.test(v);
const isSecret = (v: unknown): v is string => typeof v === "string" && v.length >= 32 && v.length <= 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "create") {
      if (!isHash(body?.verifier_hash)) return json({ error: "invalid verifier" }, 400);
      const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();
      const { data, error } = await admin
        .from("auth_pwa_handoffs")
        .insert({ verifier_hash: body.verifier_hash.toLowerCase(), expires_at: expiresAt })
        .select("id, expires_at")
        .single();
      if (error || !data) return json({ error: "could not open handoff" }, 500);
      return json({ handoff_id: data.id, expires_at: data.expires_at });
    }

    if (action === "bind") {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthenticated" }, 401);
      if (!isUuid(body?.handoff_id)) return json({ error: "invalid handoff" }, 400);

      const asCaller = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: userData } = await asCaller.auth.getUser();
      const user = userData?.user;
      if (!user?.id || !user.email) return json({ error: "unauthenticated" }, 401);

      const { data: row } = await admin
        .from("auth_pwa_handoffs")
        .select("id, expires_at, consumed_at, bound_user_id")
        .eq("id", body.handoff_id)
        .maybeSingle();
      if (!row) return json({ error: "unknown handoff" }, 404);
      if (row.consumed_at || row.bound_user_id) return json({ error: "handoff already used" }, 409);
      if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "handoff expired" }, 410);

      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });
      const ticket = link?.properties?.hashed_token;
      if (linkError || !ticket) return json({ error: "could not prepare handoff" }, 500);

      const { error: updateError } = await admin
        .from("auth_pwa_handoffs")
        .update({ bound_user_id: user.id, bound_at: new Date().toISOString(), ticket_token: ticket })
        .eq("id", row.id)
        .is("bound_user_id", null)
        .is("consumed_at", null);
      if (updateError) return json({ error: "could not prepare handoff" }, 500);

      return json({ ok: true });
    }

    if (action === "claim") {
      if (!isUuid(body?.handoff_id)) return json({ error: "invalid handoff" }, 400);
      if (!isSecret(body?.verifier)) return json({ error: "invalid verifier" }, 400);

      const verifierHash = await sha256Hex(body.verifier);
      const nowIso = new Date().toISOString();

      // Single atomic consume: the guards live in the WHERE clause, so a second
      // caller (or a replay) matches nothing and gets no ticket.
      const { data: consumed } = await admin
        .from("auth_pwa_handoffs")
        .update({ consumed_at: nowIso, ticket_token: null })
        .eq("id", body.handoff_id)
        .eq("verifier_hash", verifierHash)
        .is("consumed_at", null)
        .gt("expires_at", nowIso)
        .not("ticket_token", "is", null)
        .select("ticket_token, bound_user_id")
        .maybeSingle();

      if (!consumed?.ticket_token) {
        // Distinguish "not ready yet" from "never valid" without leaking state.
        const { data: row } = await admin
          .from("auth_pwa_handoffs")
          .select("verifier_hash, expires_at, consumed_at, ticket_token")
          .eq("id", body.handoff_id)
          .maybeSingle();
        if (
          row &&
          row.verifier_hash === verifierHash &&
          !row.consumed_at &&
          !row.ticket_token &&
          new Date(row.expires_at).getTime() > Date.now()
        ) {
          return json({ status: "pending" }, 202);
        }
        return json({ error: "handoff unavailable" }, 403);
      }

      return json({ status: "ready", token_hash: consumed.ticket_token });
    }

    return json({ error: "unknown action" }, 400);
  } catch {
    return json({ error: "unexpected error" }, 500);
  }
});
