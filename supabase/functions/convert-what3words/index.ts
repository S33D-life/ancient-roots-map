import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHAT3WORDS_API_KEY = Deno.env.get("WHAT3WORDS_API_KEY");
    
    if (!WHAT3WORDS_API_KEY) {
      throw new Error("WHAT3WORDS_API_KEY not configured");
    }

    const { words } = await req.json();
    
    if (!words) {
      return new Response(
        JSON.stringify({ error: "words parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${WHAT3WORDS_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("What3words API error:", errorData);
      return new Response(
        JSON.stringify({ error: errorData.error?.message || "Failed to convert what3words address" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});