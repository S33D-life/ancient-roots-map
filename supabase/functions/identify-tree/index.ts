import { identifyTreeSpecies } from "./services/speciesVision.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 25;
const MAX_IMAGE_DATA_CHARS = 14_000_000;
const rateWindow = new Map<string, number[]>();

function rateOk(ip: string): boolean {
  const now = Date.now();
  const recent = (rateWindow.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateWindow.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateWindow.set(ip, recent);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateOk(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many identify requests. Please retry shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as { imageData?: string; topK?: number; threshold?: number };
    const imageData = typeof body?.imageData === "string" ? body.imageData : "";

    if (!imageData) {
      return new Response(JSON.stringify({ error: "imageData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (imageData.length > MAX_IMAGE_DATA_CHARS) {
      return new Response(JSON.stringify({ error: "imageData payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await identifyTreeSpecies({
      imageData,
      topK: body?.topK,
      threshold: body?.threshold,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("identify-tree error:", error);
    return new Response(
      JSON.stringify({ error: "Tree species identification failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
