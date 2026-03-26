import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

serve((_req) => {
  if (_req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return new Response(JSON.stringify({ error: "runtime_config_unavailable" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      url,
      anonKey,
      source: "runtime",
    }),
    { headers: corsHeaders },
  );
});