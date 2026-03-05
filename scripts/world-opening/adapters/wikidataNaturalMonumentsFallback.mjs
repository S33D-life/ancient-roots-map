import { normalizeName, nowIso, parseWktPoint } from "../utils.mjs";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

// Template B: natural monuments / protected landmarks in a country.
export const wikidataNaturalMonumentsTemplateB = (wikidataQid, limit) => `
SELECT ?item ?itemLabel ?coord ?article WHERE {
  VALUES ?country { wd:${wikidataQid} }
  VALUES ?placeClass { wd:Q23790 wd:Q473972 wd:Q46169 wd:Q35145263 wd:Q9259 }
  ?item wdt:P31/wdt:P279* ?placeClass .
  ?item wdt:P17 ?country .
  ?item wdt:P625 ?coord .
  OPTIONAL {
    ?article schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${Math.max(1, limit)}
`.trim();

export async function fetchWikidataNaturalMonumentsFallback({
  countryCode,
  wikidataQid,
  limit = 200,
}) {
  if (!wikidataQid) {
    return { candidates: [], source: "wikidata_natural_monuments_fallback", error: "missing_wikidata_qid" };
  }

  const fetchedAt = nowIso();
  const query = wikidataNaturalMonumentsTemplateB(wikidataQid, Math.max(limit, 33));
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort("timeout"), 20_000);

  try {
    const response = await fetch(`${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "S33D-WorldOpeningEngine/1.0 (research seeding)",
      },
      signal: abort.signal,
    });

    if (!response.ok) {
      return {
        candidates: [],
        source: "wikidata_natural_monuments_fallback",
        error: `http_${response.status}`,
      };
    }

    const payload = await response.json();
    const bindings = payload?.results?.bindings || [];
    const candidates = [];
    const seen = new Set();

    for (const binding of bindings) {
      const name = binding?.itemLabel?.value;
      const coord = parseWktPoint(binding?.coord?.value);
      if (!name || !coord) continue;

      const normalized = normalizeName(name);
      const key = `${normalized}:${coord.lat.toFixed(4)}:${coord.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const articleUrl = binding?.article?.value;
      const entityUrl = binding?.item?.value;
      const confidence = articleUrl ? "medium" : "low";
      const sourceUrl = articleUrl || entityUrl || WIKIDATA_ENDPOINT;

      candidates.push({
        type: "tree",
        name: String(name).trim(),
        normalized_name: normalized,
        country_code: countryCode,
        lat: coord.lat,
        lng: coord.lng,
        description_short: "Fallback natural-monument candidate from Wikidata for sparse notable-tree coverage.",
        lore_short: "A provisional natural landmark proxy tagged for verification.",
        confidence,
        tags: ["research", "wikidata", "natural_monument_fallback", "needs_verification"],
        sources: [
          {
            source: "wikidata",
            name: "Wikidata",
            query,
            url: sourceUrl,
            retrieved_at: fetchedAt,
            license_note: "CC0 1.0 (Wikidata data)",
            confidence,
          },
        ],
      });

      if (candidates.length >= limit) break;
    }

    return { candidates, source: "wikidata_natural_monuments_fallback", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "wikidata_natural_monuments_fallback",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}
