/**
 * offering-media — authoritative access path for private offering media.
 *
 * The browser asks for media by offering id. This function:
 *   1. identifies the caller from their JWT (anonymous reads require an explicitly public memory in a public Grove),
 *   2. loads the offering record with service-role privileges,
 *   3. checks the record's own visibility rules via can_view_life_grove_offering,
 *   4. derives the storage object from the record and returns checked bytes;
 *      it never mints a transferable remote storage URL.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { privateObjectPath } from "./objectPath.ts";

const PRIVATE_BUCKET = "offerings-private";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const asCaller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await asCaller.auth.getUser();
    const userId = userData?.user?.id ?? null;
    // No identity is inferred from the request body. Anonymous callers can pass
    // only the database's explicit public-memory/public-Grove branch.

    const body = await req.json().catch(() => ({}));
    const offeringId = typeof body?.offering_id === "string" ? body.offering_id : null;
    if (!offeringId || !/^[0-9a-f-]{36}$/i.test(offeringId)) {
      return json({ error: "offering_id required" }, 400);
    }

    const admin = createClient(url, serviceKey);

    const { data: allowed, error: checkError } = await admin.rpc(
      "can_view_life_grove_offering",
      { _offering_id: offeringId, _user_id: userId },
    );
    if (checkError) return json({ error: "access check failed" }, 500);
    if (allowed !== true) return json({ error: "forbidden" }, 403);

    const { data: offering } = await admin
      .from("life_grove_offerings")
      .select("media_url,contributor_user_id,life_grove_id")
      .eq("id", offeringId)
      .maybeSingle();

    const path = privateObjectPath(offering?.media_url ?? null, offering?.contributor_user_id, offering?.life_grove_id);
    if (!path) return json({ error: "no private media" }, 404);

    const { data: checkedPath, error: objectError } = await admin.rpc("private_grove_media_path", { p_offering_id: offeringId, p_user_id: userId });
    if (objectError || checkedPath !== path) return json({ error: "media unavailable" }, 403);

    const { data: file, error: readError } = await admin.storage.from(PRIVATE_BUCKET).download(path);
    if (readError || !file) return json({ error: "media unavailable" }, 404);
    // Proxy checked bytes, never mint a transferable remote URL that survives
    // membership revocation. Existing downloaded bytes cannot be recalled.
    return new Response(file, { headers: { ...corsHeaders,
      "Content-Type": "application/octet-stream", "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox",
    } });
  } catch {
    return json({ error: "unexpected error" }, 500);
  }
});
