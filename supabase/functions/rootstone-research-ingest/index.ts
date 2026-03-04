import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StagingStatus = "new" | "reviewed" | "approved" | "rejected";

type Candidate = {
  id: string;
  name: string;
  type: "tree" | "grove";
  country: string;
  region?: string;
  species?: string;
  location: { lat?: number; lng?: number; place?: string; mapsUrl?: string };
  bounds?: { north: number; south: number; east: number; west: number };
  lore: string;
  source: { name: string; url: string };
  confidence: "high" | "medium" | "low";
  tags: string[];
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const DEFAULT_ALLOWLIST = [
  "gov",
  "go.cr",
  "gob.pe",
  "go.id",
  "unesco.org",
  "iucn.org",
  "wwf.org",
  "fao.org",
  "arborday.org",
  "botanicgardens.org",
];

const DOMAIN_COUNTRY_HINTS: Record<string, string> = {
  "go.cr": "Costa Rica",
  "gob.pe": "Peru",
  "go.id": "Indonesia",
  "peru.travel": "Peru",
  "visitcostarica.com": "Costa Rica",
  "indonesia.travel": "Indonesia",
};

const COUNTRY_HINTS = [
  "Costa Rica",
  "Peru",
  "Indonesia",
  "United States",
  "Canada",
  "Brazil",
  "Colombia",
  "Mexico",
  "United Kingdom",
  "Ireland",
  "Japan",
  "India",
  "Australia",
  "New Zealand",
  "South Africa",
  "Kenya",
  "Tanzania",
  "Ethiopia",
  "Nigeria",
  "Italy",
  "France",
  "China",
  "Russia",
  "Greece",
  "Switzerland",
  "Zimbabwe",
  "Democratic Republic of the Congo",
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const getSourceName = (sourceUrl: string): string => {
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return "unknown-source";
  }
};

const domainAllowed = (sourceUrl: string, allowlist: string[]): boolean => {
  let host = "";
  try {
    host = new URL(sourceUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allowlist.some((rule) => host === rule || host.endsWith(`.${rule}`));
};

const detectCountry = (rawText: string, sourceUrl: string): string => {
  const lowered = rawText.toLowerCase();
  const textMatch = COUNTRY_HINTS.find((country) => lowered.includes(country.toLowerCase()));
  if (textMatch) return textMatch;

  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    const hostMatch = Object.entries(DOMAIN_COUNTRY_HINTS).find(([needle]) => host === needle || host.endsWith(`.${needle}`));
    if (hostMatch) return hostMatch[1];
  } catch {
    // noop
  }

  return "unknown";
};

const detectType = (line: string): "tree" | "grove" => {
  const lowered = line.toLowerCase();
  if (/(grove|forest|reserve|park|woods|woodland|rainforest|national park|biosphere)/.test(lowered)) {
    return "grove";
  }
  return "tree";
};

const parseCoords = (line: string): { lat?: number; lng?: number } => {
  const match = line.match(/(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{1,3}\.\d{3,})/);
  if (!match) return {};
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return {};
  return { lat, lng };
};

const parseNameAndPlace = (line: string): { name: string; place?: string } => {
  const cleaned = line
    .replace(/^[-*•\d\).\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  const split = cleaned.split(/\s+[—|-]\s+|:\s+/).map((s) => s.trim()).filter(Boolean);
  if (split.length >= 2) return { name: split[0], place: split.slice(1).join(" — ") };
  return { name: cleaned };
};

const normalizeTags = (tags: string[]): string[] => {
  const out = new Set<string>();
  tags.forEach((t) => {
    const v = t.toLowerCase().trim();
    if (v) out.add(v);
  });
  return Array.from(out);
};

const checkRateLimit = (key: string, max: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
};

const parseCandidates = (rawText: string, sourceUrl: string): Candidate[] => {
  const sourceName = getSourceName(sourceUrl);
  const country = detectCountry(rawText, sourceUrl);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 6)
    .slice(0, 400);

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const line of lines) {
    if (/^(source|references|copyright|privacy|terms)\b/i.test(line)) continue;
    const { name, place } = parseNameAndPlace(line);
    if (!name || name.length < 3 || name.length > 120) continue;

    const type = detectType(line);
    const { lat, lng } = parseCoords(line);
    const hasCoords = lat != null && lng != null;

    const tags = normalizeTags([
      "research_ingest",
      "staging",
      type,
      hasCoords ? "coords_present" : "needs_coords",
    ]);

    const confidence: Candidate["confidence"] = hasCoords ? "high" : place ? "medium" : "low";
    const countrySlug = slugify(country || "unknown");
    const id = `${countrySlug}-${type}-${slugify(name)}`;
    const dedupeKey = `${countrySlug}|${type}|${name.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;

    const lore = hasCoords
      ? "Imported from research snapshot text; coordinates were detected in source text."
      : "Imported from research snapshot text; coordinates were not detected and require curator verification.";

    candidates.push({
      id,
      name,
      type,
      country,
      location: {
        lat,
        lng,
        place: place || (country !== "unknown" ? country : sourceName),
        mapsUrl: undefined,
      },
      lore,
      source: { name: sourceName, url: sourceUrl },
      confidence,
      tags,
    });

    seen.add(dedupeKey);
    if (candidates.length >= 200) break;
  }

  return candidates;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData } = await userClient.auth.getUser();
    const user = authData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isCurator, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "curator",
    });
    if (roleError || !isCurator) {
      return new Response(JSON.stringify({ error: "Curator role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = String(body?.action || "ingest");

    if (action === "list") {
      const limit = Math.min(Math.max(Number(body?.limit || 100), 1), 500);
      const status = body?.status ? String(body.status) : undefined;
      const country = body?.country ? String(body.country) : undefined;

      let query = adminClient
        .from("rootstones_staging")
        .select("id,country,payload_json,status,created_at,source_url,fetched_at,created_by,reviewed_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status && ["new", "reviewed", "approved", "rejected"].includes(status)) {
        query = query.eq("status", status);
      }
      if (country) query = query.eq("country", country);

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ items: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "review") {
      const id = String(body?.id || "").trim();
      const status = String(body?.status || "").trim() as StagingStatus;
      if (!id || !["reviewed", "approved", "rejected"].includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid review payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient
        .from("rootstones_staging")
        .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "export") {
      const country = String(body?.country || "").trim();
      if (!country) {
        return new Response(JSON.stringify({ error: "country is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await adminClient
        .from("rootstones_staging")
        .select("payload_json")
        .eq("country", country)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? [])
        .map((row) => row.payload_json)
        .filter(Boolean);

      return new Response(JSON.stringify({ country, count: rows.length, rootstones: rows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "ingest") {
      return new Response(JSON.stringify({ error: "Unsupported action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceUrl = String(body?.source_url || "").trim();
    const fetchedAt = String(body?.fetched_at || "").trim();
    const rawText = String(body?.raw_text || "").trim();

    if (!sourceUrl || !fetchedAt || !rawText) {
      return new Response(JSON.stringify({ error: "source_url, fetched_at, raw_text are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(`ingest:${user.id}`, 6, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const envAllowlist = (Deno.env.get("ROOTSTONE_INGEST_ALLOWLIST") || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const allowlist = envAllowlist.length > 0 ? envAllowlist : DEFAULT_ALLOWLIST;

    if (!domainAllowed(sourceUrl, allowlist)) {
      return new Response(JSON.stringify({ error: "Domain not allowed", allowlist }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fetchedDate = new Date(fetchedAt);
    if (Number.isNaN(fetchedDate.valueOf())) {
      return new Response(JSON.stringify({ error: "fetched_at must be an ISO timestamp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count: recentCount, error: recentError } = await adminClient
      .from("rootstones_staging")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id)
      .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString());

    if (recentError) throw recentError;
    if ((recentCount || 0) > 250) {
      return new Response(JSON.stringify({ error: "Too many ingest rows in short window" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidates = parseCandidates(rawText, sourceUrl);
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No candidate rootstones parsed" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = candidates.map((candidate) => ({
      country: candidate.country || "unknown",
      payload_json: candidate,
      status: "new",
      source_url: sourceUrl,
      fetched_at: fetchedDate.toISOString(),
      created_by: user.id,
    }));

    const { error: insertError } = await adminClient.from("rootstones_staging").insert(rows);
    if (insertError) throw insertError;

    const missingCoords = candidates.filter((c) => c.location.lat == null || c.location.lng == null).length;

    return new Response(
      JSON.stringify({
        imported: rows.length,
        country_breakdown: rows.reduce<Record<string, number>>((acc, row) => {
          acc[row.country] = (acc[row.country] || 0) + 1;
          return acc;
        }, {}),
        missing_coords: missingCoords,
        source_name: getSourceName(sourceUrl),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
