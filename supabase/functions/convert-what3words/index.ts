import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate-limit by IP (auth is optional — logged-out users need this during add-tree)
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const WHAT3WORDS_API_KEY = Deno.env.get("WHAT3WORDS_API_KEY");

    if (!WHAT3WORDS_API_KEY) {
      throw new Error("WHAT3WORDS_API_KEY not configured");
    }

    const { words } = await req.json();

    if (!words) {
      return new Response(
        JSON.stringify({ error: "words parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${WHAT3WORDS_API_KEY}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("What3words API error:", errorData);

      // Detect quota exceeded error
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "quota_exceeded",
            message: "What3words API quota exceeded. Please try again later.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: errorData.error?.message || "Failed to convert what3words address" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        words: data.words,
        coordinates: {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
