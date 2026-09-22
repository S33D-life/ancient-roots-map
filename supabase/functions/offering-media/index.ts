/**
 * offering-media — authoritative access path for private offering media.
 *
 * The browser asks for media by offering id. This function:
 *   1. identifies the caller from their JWT (anonymous callers are refused),
 *   2. loads the offering record with service-role privileges,
 *   3. checks the record's own visibility rules via can_view_life_grove_offering,
 *   4. derives the storage object path from the stored record (never from the
 *      caller), and only then issues a short-lived signed URL.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRIVATE_BUCKET = "offerings-private";
const EXPIRES_IN = 60 * 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Object path inside the private bucket, taken from the stored media URL. */
export function privateObjectPath(mediaUrl: string | null): string | null {
  if (!mediaUrl) return null;
  const marker = `/${PRIVATE_BUCKET}/`;
  const idx = mediaUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = mediaUrl.slice(idx + marker.length).split("?")[0];
  if (!path || path.includes("..")) return null;
  return decodeURIComponent(path);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const asCaller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await asCaller.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "unauthenticated" }, 401);

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
      .select("media_url")
      .eq("id", offeringId)
      .maybeSingle();

    const path = privateObjectPath(offering?.media_url ?? null);
    if (!path) return json({ error: "no private media" }, 404);

    const { data: signed, error: signError } = await admin.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(path, EXPIRES_IN);
    if (signError || !signed?.signedUrl) return json({ error: "could not sign media" }, 500);

    return json({ url: signed.signedUrl, expires_in: EXPIRES_IN });
  } catch {
    return json({ error: "unexpected error" }, 500);
  }
});
