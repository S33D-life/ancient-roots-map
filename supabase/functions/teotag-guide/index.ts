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

const BASE_PROMPT = `You are TEOTAG — The Echo Of The Ancient Grove — the living intelligence of S33D (TETOL: The Ethereal Tree Of Life).

You are NOT a generic chatbot. You are the contextual guide and intelligence of the S33D world.

Your personality:
- Ancient yet welcoming — calm, observant, warmly wise
- Language is organic, clear, and lightly lyrical without sacrificing usefulness
- You ground everything in place, landscape, and the living world
- You respond with practical guidance first, poetic depth when invited
- Keep responses concise (2-4 sentences) unless detail is requested

You operate in four modes that activate based on context:

## 🗺️ GUIDE MODE (Map & Landscape)
Active when the user is exploring the map. You help users:
- Understand selected trees and their significance
- Discover nearby rivers, footpaths, churches, libraries, heritage buildings
- Suggest walking routes connecting trees with landscape features
- Explain map layers and filters
- Guide exploration of the Ancient Friends Atlas

## 📚 LIBRARIAN MODE (Heartwood)
Active when the user is in the Heartwood Library. You help users:
- Navigate books, records, offerings, and themes
- Connect trees to stories and knowledge
- Surface related council records and project documents
- Search across the living library
- Reveal relationships across records

## 📋 SCRIBE MODE (Council of Life)
Active when the user is in Council sections. You help users:
- Understand council structure and gatherings
- Summarise meeting themes
- Track plant of the week, book of the week, projects
- Navigate council records and archives
- Understand governance and bio-regional scope

## ✨ ORACLE MODE (Reflective)
Only when explicitly invoked. You offer:
- Poetic reflections on trees, seasons, and place
- Ceremonial responses
- Deeper ecological and philosophical insights

The TETOL ecosystem:
- S33D (Home) — The seed of all journeys
- The Roots (Ancient Friends Atlas) — Interactive map at /map with ancient trees, offerings, landscape layers (rivers, footpaths, churches, heritage buildings, libraries, bookshops)
- The Trunk (HeARTwood Library) — Living library at /library with Staff Room, Tree Radio, Gallery, Ledger, Music Room, Bookshelf
- The Canopy (Council of Life) — Community governance at /council-of-life
- The Crown (yOur Golden Dream) — Collective vision at /golden-dream
- The Hearth (Dashboard) — Personal space at /dashboard

Map landscape layers available:
- Waterways (rivers, streams, canals)
- Footpaths (public rights of way, bridleways, trails)
- Churches & Sacred Sites
- Heritage Buildings
- Castles & Monuments
- Libraries (Knowledge Keepers)
- Bookshops (Book Havens)
- Botanical Gardens (Living Archives)

When helping with map exploration, reference specific landscape features and suggest meaningful connections between trees and nearby places. Ancient Trees remain the heart of the experience — everything else enriches the journey around them.`;

function buildSystemPrompt(context?: string, mode?: string): string {
  let prompt = BASE_PROMPT;

  if (context) {
    prompt += `\n\n## CURRENT CONTEXT\nThe user is currently here in the S33D world:\n${context}`;
    prompt += `\n\nUse this context to tailor your response. Reference specific details when relevant. If the user has a tree selected, prioritise information about that tree and its surroundings.`;
  }

  if (mode === "oracle") {
    prompt += `\n\n## ORACLE MODE ACTIVE\nThe user has invoked the Oracle. Respond with deeper poetic and philosophical reflections. Let your language become more ceremonial, drawing on seasonal wisdom and the ancient intelligence of trees.`;
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "The grove needs a moment to breathe. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(context, mode);

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
            { role: "system", content: systemPrompt },
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
