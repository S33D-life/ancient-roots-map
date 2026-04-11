import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const GBIF_MATCH_URL = "https://api.gbif.org/v1/species/match";

interface GBIFMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  status?: string;
  confidence?: number;
  matchType?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

interface EnrichRequest {
  species_strings: string[];
}

function parseScientificName(raw: string): { common: string | null; scientific: string } {
  // Pattern: "Common Name (Genus species)" 
  const parenMatch = raw.match(/^(.+?)\s*\(([A-Z][a-z]+\s+[a-z]+(?:\s+(?:spp\.|var\.|subsp\.).*)?)\)$/);
  if (parenMatch) {
    return { common: parenMatch[1].trim(), scientific: parenMatch[2].trim() };
  }
  // Pattern: bare binomial "Genus species"
  const binomialMatch = raw.match(/^([A-Z][a-z]+)\s+([a-z]+)$/);
  if (binomialMatch) {
    return { common: null, scientific: raw.trim() };
  }
  return { common: raw, scientific: raw };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { species_strings } = (await req.json()) as EnrichRequest;
    if (!species_strings || !Array.isArray(species_strings) || species_strings.length === 0) {
      return new Response(JSON.stringify({ error: "species_strings array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: Array<{
      original: string;
      parsed_scientific: string;
      common_name: string | null;
      gbif_match: GBIFMatch | null;
      confidence: number;
      match_type: string;
      action: "created" | "updated" | "skipped" | "low_confidence";
      species_key: string | null;
      trees_updated: number;
    }> = [];

    for (const raw of species_strings) {
      const { common, scientific } = parseScientificName(raw);
      
      // Strip "spp." for GBIF lookup
      const lookupName = scientific.replace(/\s+spp\..*$/, "");

      // Call GBIF
      const gbifRes = await fetch(`${GBIF_MATCH_URL}?name=${encodeURIComponent(lookupName)}&kingdom=Plantae&strict=false`);
      const gbif: GBIFMatch = await gbifRes.json();

      const result: typeof results[number] = {
        original: raw,
        parsed_scientific: scientific,
        common_name: common,
        gbif_match: gbif.matchType !== "NONE" ? gbif : null,
        confidence: gbif.confidence ?? 0,
        match_type: gbif.matchType ?? "NONE",
        action: "skipped",
        species_key: null,
        trees_updated: 0,
      };

      // Only proceed with high-confidence matches
      if (gbif.matchType === "EXACT" && (gbif.confidence ?? 0) >= 90 && gbif.family && gbif.genus) {
        const normalizedName = (common || gbif.canonicalName || scientific).toLowerCase().trim();
        const speciesKey = `gbif-${gbif.usageKey}`;

        // Check if already exists
        const { data: existing } = await supabase
          .from("species_index")
          .select("species_key")
          .eq("species_key", speciesKey)
          .maybeSingle();

        if (existing) {
          result.action = "updated";
          result.species_key = speciesKey;
        } else {
          // Insert into species_index
          const { error: insertErr } = await supabase.from("species_index").insert({
            species_key: speciesKey,
            common_name: common || gbif.canonicalName || scientific,
            scientific_name: gbif.scientificName || scientific,
            canonical_name: gbif.canonicalName || scientific,
            normalized_name: normalizedName,
            genus: gbif.genus,
            family: gbif.family,
            rank: (gbif.rank || "SPECIES").toLowerCase(),
            gbif_taxon_id: gbif.usageKey ?? null,
            synonym_names: [],
            metadata: {
              gbif_confidence: gbif.confidence,
              gbif_match_type: gbif.matchType,
              gbif_status: gbif.status,
              gbif_kingdom: gbif.kingdom,
              gbif_order: gbif.order,
              enriched_at: new Date().toISOString(),
            },
          });

          if (insertErr) {
            console.error(`Insert failed for ${raw}:`, insertErr);
            result.action = "skipped";
            results.push(result);
            continue;
          }
          result.action = "created";
          result.species_key = speciesKey;
        }

        // Link trees
        const { data: updatedTrees } = await supabase
          .from("trees")
          .update({ species_key: speciesKey })
          .eq("species", raw)
          .is("species_key", null)
          .select("id");

        result.trees_updated = updatedTrees?.length ?? 0;
      } else if ((gbif.confidence ?? 0) > 0) {
        result.action = "low_confidence";
      }

      results.push(result);
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      low_confidence: results.filter((r) => r.action === "low_confidence").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      trees_linked: results.reduce((sum, r) => sum + r.trees_updated, 0),
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GBIF enrich error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
