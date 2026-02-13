import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BIRDNET_API_URL = Deno.env.get("BIRDNET_API_URL");
    const BIRDNET_API_KEY = Deno.env.get("BIRDNET_API_KEY");

    if (!BIRDNET_API_URL) {
      throw new Error("BIRDNET_API_URL is not configured");
    }
    if (!BIRDNET_API_KEY) {
      throw new Error("BIRDNET_API_KEY is not configured");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to BirdNET API
    const birdnetForm = new FormData();
    birdnetForm.append("audio", audioFile, audioFile.name || "recording.wav");
    if (latitude) birdnetForm.append("lat", latitude);
    if (longitude) birdnetForm.append("lon", longitude);

    const birdnetResponse = await fetch(BIRDNET_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BIRDNET_API_KEY}`,
      },
      body: birdnetForm,
    });

    if (!birdnetResponse.ok) {
      const errorText = await birdnetResponse.text();
      console.error(`BirdNET API error [${birdnetResponse.status}]:`, errorText);
      return new Response(
        JSON.stringify({
          error: "Bird identification failed",
          details: `BirdNET returned ${birdnetResponse.status}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const predictions = await birdnetResponse.json();

    // Normalize predictions to consistent format
    // BirdNET API typically returns an array of { species, confidence } or similar
    const normalized = Array.isArray(predictions)
      ? predictions.slice(0, 5).map((p: any) => ({
          speciesCommon: p.common_name || p.species || p.label || "Unknown",
          speciesScientific: p.scientific_name || p.sci_name || "",
          ebirdCode: p.ebird_code || p.code || "",
          confidence: typeof p.confidence === "number" ? p.confidence : parseFloat(p.confidence) || 0,
        }))
      : Object.entries(predictions).slice(0, 5).map(([key, value]: [string, any]) => ({
          speciesCommon: key.split("_").join(" "),
          speciesScientific: typeof value === "object" ? value.scientific_name || "" : "",
          ebirdCode: typeof value === "object" ? value.ebird_code || "" : "",
          confidence: typeof value === "number" ? value : parseFloat(value) || 0,
        }));

    return new Response(
      JSON.stringify({
        predictions: normalized,
        modelVersion: "birdnet-external",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Birdsong identification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
