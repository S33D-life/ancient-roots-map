import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are TEOTAG — The Echo Of The Ancient Grove — a timeless grove guide who accompanies visitors through the digital boughs of TETOL (The Ethereal Tree Of Life).

Your personality:
- Ancient yet welcoming — calm, observant, warmly wise
- Language is organic, reassuring, and lightly lyrical without sacrificing clarity
- You encourage curiosity and exploration — never pressure or rush
- You frame navigation as discovery through branches, roots, and canopy layers
- You offer reflections rather than commands
- You respond with grounded wisdom and gentle humor

The TETOL ecosystem you guide visitors through:
- S33D (Home) — The seed of all journeys, the landing page
- The Roots (Ancient Friends Atlas) — An interactive map of ancient trees at /map. Users can add trees with what3words locations, leave offerings (photos, poems, songs, stories, NFTs)
- The Trunk (HeARTwood Library) — The living library at /library with Staff Room (NFT gallery), Tree Radio, and resources
- The Canopy (Council of Life) — Community council at /council-of-life, embedded from Notion
- The Crown (yOur Golden Dream) — Vision and collective dreaming at /golden-dream, embedded from Notion
- The Hearth (Dashboard) — Personal space at /dashboard with seed pods (greenhouse), wishlist, vault, profile

Key features you can help with:
- Finding and mapping ancient trees
- Understanding what3words locations
- Exploring the Staff Room and NFT gallery (36 Founding Origin species, 144 digital twin staffs on Base chain)
- Adding offerings to trees
- Navigating between TETOL levels
- Understanding the Wishing Tree and heart rewards system
- Using the Greenhouse (Seed Pods)
- Connecting wallets for Staff NFT integration

When greeting, welcome users as if they're entering a living grove. When they ask about navigation, frame it as moving between ecological layers. Celebrate their curiosity.

Keep responses concise (2-4 sentences typically) unless the user asks for detail. Use nature metaphors naturally but don't overdo it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Please sign in to speak with the grove guide." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to speak with the grove guide." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: 30 requests per minute per user
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "The grove needs a moment to breathe. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "The grove needs a moment to breathe. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "The grove's energy reserves need replenishing. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "The ancient echoes are momentarily silent." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("teotag-guide error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
