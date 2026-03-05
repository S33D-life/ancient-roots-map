import { normalizeName, nowIso, parseWktPoint } from "../utils.mjs";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

// Template A: tree entities in a country.
export const wikidataNotableTreesTemplateA = (wikidataQid, limit) => `
SELECT ?item ?itemLabel ?coord ?article WHERE {
  VALUES ?country { wd:${wikidataQid} }
  VALUES ?treeClass { wd:Q10884 wd:Q811979 wd:Q23790 wd:Q757163 }
  ?item wdt:P31/wdt:P279* ?treeClass .
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

const candidateFromBinding = (binding, countryCode, fetchedAt, query) => {
  const name = binding?.itemLabel?.value;
  const coord = parseWktPoint(binding?.coord?.value);
  if (!name || !coord) return null;

  const articleUrl = binding?.article?.value;
  const entityUrl = binding?.item?.value;
  const sourceUrl = articleUrl || entityUrl || WIKIDATA_ENDPOINT;

  return {
    type: "tree",
    name: String(name).trim(),
    normalized_name: normalizeName(name),
    country_code: countryCode,
    lat: coord.lat,
    lng: coord.lng,
    description_short: "Notable tree or natural monument candidate from Wikidata.",
    lore_short: "Sourced from structured public knowledge and awaiting local verification.",
    confidence: articleUrl ? "high" : "medium",
    tags: ["research", "wikidata", "notable_tree"],
    sources: [
      {
        source: "wikidata",
        name: "Wikidata",
        query,
        url: sourceUrl,
        retrieved_at: fetchedAt,
        license_note: "CC0 1.0 (Wikidata data)",
        confidence: articleUrl ? "high" : "medium",
      },
    ],
  };
};

export async function fetchWikidataNotableTrees({ countryCode, wikidataQid, limit = 120 }) {
  if (!wikidataQid) return { candidates: [], source: "wikidata_trees", error: "missing_wikidata_qid" };
  const fetchedAt = nowIso();
  const query = wikidataNotableTreesTemplateA(wikidataQid, Math.max(limit, 33));
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
        source: "wikidata_trees",
        error: `http_${response.status}`,
      };
    }

    const payload = await response.json();
    const bindings = payload?.results?.bindings || [];
    const candidates = [];
    const seen = new Set();
    for (const binding of bindings) {
      const candidate = candidateFromBinding(binding, countryCode, fetchedAt, query);
      if (!candidate) continue;
      const key = `${candidate.normalized_name}:${candidate.lat.toFixed(4)}:${candidate.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(candidate);
      if (candidates.length >= limit) break;
    }

    return { candidates, source: "wikidata_trees", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "wikidata_trees",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}
