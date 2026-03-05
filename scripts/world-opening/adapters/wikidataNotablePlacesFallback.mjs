import { normalizeName, nowIso, parseWktPoint } from "../utils.mjs";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

const fallbackQuery = (wikidataQid, limit) => `
SELECT ?item ?itemLabel ?coord ?article WHERE {
  VALUES ?country { wd:${wikidataQid} }
  VALUES ?placeClass { wd:Q46169 wd:Q473972 wd:Q35145263 wd:Q23790 }
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

export async function fetchWikidataNotablePlacesFallback({ countryCode, wikidataQid, limit = 120 }) {
  if (!wikidataQid) return { candidates: [], source: "wikidata_places_fallback", error: "missing_wikidata_qid" };

  const fetchedAt = nowIso();
  const query = fallbackQuery(wikidataQid, limit);
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
      return { candidates: [], source: "wikidata_places_fallback", error: `http_${response.status}` };
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

      candidates.push({
        type: "tree",
        name: String(name).trim(),
        normalized_name: normalized,
        country_code: countryCode,
        lat: coord.lat,
        lng: coord.lng,
        description_short: "Fallback notable natural place from Wikidata when notable tree coverage is sparse.",
        lore_short: "A provisional landmark proxy, tagged for field verification.",
        confidence: "medium",
        tags: ["research", "wikidata", "fallback_notable_place", "needs_verification"],
        sources: [
          {
            name: "Wikidata",
            url: binding?.article?.value || binding?.item?.value || WIKIDATA_ENDPOINT,
            retrieved_at: fetchedAt,
            license_note: "CC0 1.0 (Wikidata data)",
            confidence: "medium",
          },
        ],
      });

      if (candidates.length >= limit) break;
    }

    return { candidates, source: "wikidata_places_fallback", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "wikidata_places_fallback",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}
