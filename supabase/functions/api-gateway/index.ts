import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { identifyTreeSpecies } from "./services/speciesVision.ts";
import {
  registerAgent, getAgent, updateCapabilities,
  submitSource, submitDataset, submitResearchTreesBulk,
  submitSpeciesClassification, submitGeocode, submitEnrichment,
  submitDuplicateCheck, submitCandidate, submitSpark,
  getTasks, getContributions, getRewards,
} from "./services/agentGarden.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function err(code: string, message: string, status = 400) {
  return json({ error: { code, message } }, status);
}

function parseCursor(raw: string | null): { limit: number; offset: number } {
  const limit = Math.min(Math.max(parseInt(raw ?? "20") || 20, 1), 100);
  return { limit, offset: 0 };
}

function parseQuery(url: URL) {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20") || 20, 1), 100);
  const cursor = url.searchParams.get("cursor");
  const offset = cursor ? parseInt(cursor) || 0 : 0;
  return { limit, offset };
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory, per-isolate)                             */
/* ------------------------------------------------------------------ */

const rl = new Map<string, { c: number; r: number }>();
function rateOk(key: string, max = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const e = rl.get(key);
  if (!e || now > e.r) { rl.set(key, { c: 1, r: now + windowMs }); return true; }
  if (e.c >= max) return false;
  e.c++;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                       */
/* ------------------------------------------------------------------ */

interface AuthResult {
  userId: string | null;
  roles: string[];
  scopes: string[];
  isAgent: boolean;
}

async function authenticate(req: Request): Promise<AuthResult> {
  const noAuth: AuthResult = { userId: null, roles: ["guest"], scopes: ["read:public"], isAgent: false };

  // Check API key header first
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: token } = await admin
      .from("agent_tokens")
      .select("*")
      .eq("token_hash", await hashToken(apiKey))
      .eq("revoked", false)
      .single();
    if (token) {
      return {
        userId: token.user_id,
        roles: ["agent"],
        scopes: token.scopes ?? ["read:public"],
        isAgent: true,
      };
    }
    return noAuth;
  }

  // JWT auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return noAuth;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return noAuth;

  // Fetch roles
  const admin2 = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: roleRows } = await admin2
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((r: any) => r.role);
  if (!roles.includes("wanderer")) roles.push("wanderer");

  // Derive scopes from roles
  const scopes = ["read:public", "read:personal"];
  if (roles.includes("wanderer")) scopes.push("read:friends", "write:offerings", "write:whispers");
  if (roles.includes("curator")) scopes.push("write:trees", "write:council", "write:library");
  if (roles.includes("steward")) scopes.push("write:trees");
  if (roles.includes("admin") || roles.includes("keeper")) scopes.push("admin:*");

  return { userId: user.id, roles, scopes, isAgent: false };
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function requireScope(auth: AuthResult, scope: string): Response | null {
  if (auth.scopes.includes("admin:*")) return null;
  if (!auth.scopes.includes(scope)) return err("FORBIDDEN", `Missing scope: ${scope}`, 403);
  return null;
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/* ------------------------------------------------------------------ */
/*  Route matching                                                     */
/* ------------------------------------------------------------------ */

type Handler = (req: Request, auth: AuthResult, params: Record<string, string>, url: URL) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler) {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    "^" + path.replace(/:(\w+)/g, (_, name) => { paramNames.push(name); return "([^/]+)"; }) + "$"
  );
  routes.push({ method, pattern, paramNames, handler });
}

function matchRoute(method: string, path: string): { handler: Handler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method && r.method !== "*") continue;
    const m = path.match(r.pattern);
    if (m) {
      const params: Record<string, string> = {};
      r.paramNames.forEach((n, i) => { params[n] = m[i + 1]; });
      return { handler: r.handler, params };
    }
  }
  return null;
}

/* ================================================================== */
/*  ROUTES                                                             */
/* ================================================================== */

// ── Health ──
route("GET", "/api/v1/health", async () => {
  return json({ status: "healthy", version: "1.0.0", ecosystem: "TETOL", timestamp: new Date().toISOString() });
});

// ── Meta: Capabilities ──
route("GET", "/api/v1/meta/capabilities", async () => {
  return json({
    name: "S33D Root System API",
    version: "1.0.0",
    description: "The Root System — programmatic access to the TETOL ecosystem: Ancient Friends, offerings, whispers, and the Heartwood Library.",
    resources: [
      { name: "trees", description: "Ancient Friends atlas", scopes_required: ["read:public"], filters: ["country", "species", "bbox", "near", "is_churchyard"], supports_cursor: true },
      { name: "offerings", description: "Memories & tree library contributions", scopes_required: ["read:public"], filters: ["tree_id", "type", "visibility"], supports_cursor: true },
      { name: "whispers", description: "Tree-gated messages", scopes_required: ["read:personal"], filters: ["status"], supports_cursor: true },
      { name: "search", description: "Unified search across trees, offerings", scopes_required: ["read:public"], filters: ["q", "types"], supports_cursor: false },
    ],
    authentication: {
      methods: ["bearer_jwt", "x-api-key"],
      agent_token_endpoint: "POST /api/v1/auth/agent-token",
    },
    roles: ["guest", "wanderer", "curator", "steward", "admin"],
    rate_limits: { default: "60 req/min", agent: "120 req/min" },
    pagination: { style: "cursor", max_limit: 100, default_limit: 20 },
  });
});

// ── Meta: Me ──
route("GET", "/api/v1/meta/me", async (_req, auth) => {
  if (!auth.userId) return json({ authenticated: false, roles: ["guest"], scopes: ["read:public"] });

  const db = adminClient();
  const { data: profile } = await db.from("profiles").select("full_name, avatar_url, bio, home_place").eq("id", auth.userId).single();

  return json({
    authenticated: true,
    user_id: auth.userId,
    roles: auth.roles,
    scopes: auth.scopes,
    is_agent: auth.isAgent,
    profile: profile ?? null,
  });
});

// ── Trees: List ──
route("GET", "/api/v1/trees", async (_req, auth, _params, url) => {
  const { limit, offset } = parseQuery(url);
  const db = adminClient();
  let query = db.from("trees").select("id, name, species, latitude, longitude, nation, state, bioregion, estimated_age, girth_cm, what3words, is_churchyard_tree, description, created_at", { count: "exact" });

  // Filters
  const country = url.searchParams.get("country");
  if (country) query = query.ilike("nation", `%${country}%`);

  const species = url.searchParams.get("species");
  if (species) query = query.ilike("species", `%${species}%`);

  const isChurchyard = url.searchParams.get("is_churchyard");
  if (isChurchyard === "true") query = query.eq("is_churchyard_tree", true);

  const bbox = url.searchParams.get("bbox");
  if (bbox) {
    const [south, west, north, east] = bbox.split(",").map(Number);
    if ([south, west, north, east].every(n => !isNaN(n))) {
      query = query.gte("latitude", south).lte("latitude", north).gte("longitude", west).lte("longitude", east);
    }
  }

  const near = url.searchParams.get("near");
  // near=lat,lng,radiusKm — simple bbox approximation
  if (near) {
    const [lat, lng, radiusKm] = near.split(",").map(Number);
    if ([lat, lng, radiusKm].every(n => !isNaN(n))) {
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
      query = query.gte("latitude", lat - dLat).lte("latitude", lat + dLat).gte("longitude", lng - dLng).lte("longitude", lng + dLng);
    }
  }

  query = query.order("name").range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return err("DB_ERROR", error.message, 500);

  return json({
    data,
    pagination: { limit, offset, total: count, next_cursor: (offset + limit < (count ?? 0)) ? offset + limit : null },
  }, 200, { "Cache-Control": "public, max-age=60" });
});

// ── Trees: Get by ID ──
route("GET", "/api/v1/trees/:id", async (_req, _auth, params) => {
  const db = adminClient();
  const { data, error } = await db.from("trees").select("*").eq("id", params.id).single();
  if (error || !data) return err("NOT_FOUND", "Tree not found", 404);
  return json({ data }, 200, { "Cache-Control": "public, max-age=60" });
});

// ── Trees: Offerings for a tree ──
route("GET", "/api/v1/trees/:id/offerings", async (_req, _auth, params, url) => {
  const { limit, offset } = parseQuery(url);
  const db = adminClient();

  let query = db.from("offerings")
    .select("id, title, type, content, media_url, nft_link, visibility, tree_role, created_at", { count: "exact" })
    .eq("tree_id", params.id)
    .in("visibility", ["public", "tribe"]);

  const type = url.searchParams.get("type");
  if (type) query = query.eq("type", type);

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return err("DB_ERROR", error.message, 500);

  return json({ data, pagination: { limit, offset, total: count, next_cursor: (offset + limit < (count ?? 0)) ? offset + limit : null } });
});

// ── Trees: Whispers for a tree ──
route("GET", "/api/v1/trees/:id/whispers", async (_req, auth, params, url) => {
  const scopeErr = requireScope(auth, "read:personal");
  if (scopeErr) return scopeErr;

  const { limit, offset } = parseQuery(url);
  const db = adminClient();
  const { data, error, count } = await db.from("tree_whispers")
    .select("id, message_content, delivery_scope, status, created_at, expires_at", { count: "exact" })
    .eq("tree_anchor_id", params.id)
    .eq("recipient_scope", "PUBLIC")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return err("DB_ERROR", error.message, 500);
  return json({ data, pagination: { limit, offset, total: count, next_cursor: (offset + limit < (count ?? 0)) ? offset + limit : null } });
});

// ── Offerings: List ──
route("GET", "/api/v1/offerings", async (_req, auth, _params, url) => {
  const { limit, offset } = parseQuery(url);
  const db = adminClient();

  let query = db.from("offerings")
    .select("id, title, type, content, media_url, nft_link, tree_id, visibility, tree_role, created_at, created_by", { count: "exact" });

  // Visibility filtering
  const vis = url.searchParams.get("visibility") ?? "public";
  if (vis === "mine" && auth.userId) {
    query = query.eq("created_by", auth.userId);
  } else {
    query = query.eq("visibility", "public");
  }

  const treeId = url.searchParams.get("tree_id");
  if (treeId) query = query.eq("tree_id", treeId);

  const type = url.searchParams.get("type");
  if (type) query = query.eq("type", type);

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return err("DB_ERROR", error.message, 500);

  return json({ data, pagination: { limit, offset, total: count, next_cursor: (offset + limit < (count ?? 0)) ? offset + limit : null } });
});

// ── Offerings: Get by ID ──
route("GET", "/api/v1/offerings/:id", async (_req, _auth, params) => {
  const db = adminClient();
  const { data, error } = await db.from("offerings").select("*").eq("id", params.id).single();
  if (error || !data) return err("NOT_FOUND", "Offering not found", 404);
  if (data.visibility === "private") return err("FORBIDDEN", "This offering is private", 403);
  return json({ data });
});

// ── Search ──
route("GET", "/api/v1/search", async (_req, _auth, _params, url) => {
  const q = url.searchParams.get("q");
  if (!q || q.length < 2) return err("INVALID_QUERY", "Query must be at least 2 characters");

  const types = (url.searchParams.get("types") ?? "trees,offerings").split(",");
  const db = adminClient();
  const results: any[] = [];

  if (types.includes("trees")) {
    const { data } = await db.from("trees")
      .select("id, name, species, nation, latitude, longitude")
      .or(`name.ilike.%${q}%,species.ilike.%${q}%,nation.ilike.%${q}%`)
      .limit(10);
    (data ?? []).forEach(t => results.push({
      type: "tree", id: t.id, title: t.name, snippet: `${t.species} — ${t.nation ?? "Unknown"}`,
      url: `/tree/${t.id}`, latitude: t.latitude, longitude: t.longitude,
    }));
  }

  if (types.includes("offerings")) {
    const { data } = await db.from("offerings")
      .select("id, title, type, tree_id, created_at")
      .eq("visibility", "public")
      .ilike("title", `%${q}%`)
      .limit(10);
    (data ?? []).forEach(o => results.push({
      type: "offering", id: o.id, title: o.title, snippet: `${o.type} offering`,
      url: `/tree/${o.tree_id}`,
    }));
  }

  return json({ data: results, query: q }, 200, { "Cache-Control": "public, max-age=30" });
});

// ── Species Vision ──
route("POST", "/api/identify-tree", async (req) => {
  const MAX_IMAGE_DATA_CHARS = 14_000_000;
  let body: { imageData?: string; topK?: number; threshold?: number } | null = null;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_REQUEST", "Body must be valid JSON", 400);
  }

  const imageData = typeof body?.imageData === "string" ? body.imageData : "";
  if (!imageData) {
    return err("INVALID_REQUEST", "imageData is required", 400);
  }
  if (imageData.length > MAX_IMAGE_DATA_CHARS) {
    return err("PAYLOAD_TOO_LARGE", "imageData payload too large", 413);
  }

  try {
    const result = await identifyTreeSpecies({
      imageData,
      topK: body?.topK,
      threshold: body?.threshold,
    });
    return json(result);
  } catch (error) {
    console.error("species vision error:", error);
    return err("VISION_ERROR", "Tree species identification failed", 500);
  }
});

// ── OpenAPI Spec ──
route("GET", "/api/v1/openapi.json", async () => {
  const spec = buildOpenAPISpec();
  return json(spec, 200, { "Cache-Control": "public, max-age=300" });
});

/* ================================================================== */
/*  AGENT GARDEN ROUTES                                                */
/* ================================================================== */

function agentGardenHandler(handlerFn: Function, needsBody = false, needsParams = false) {
  return async (req: Request, auth: AuthResult, params: Record<string, string>, url: URL) => {
    let body: any = {};
    if (needsBody) {
      try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
    }
    const result = needsParams
      ? await handlerFn(req, auth, params, needsBody ? body : url)
      : await handlerFn(req, auth, body);
    return json(result.data ?? { error: result.error }, result.status);
  };
}

// Agent registration & profile
route("POST", "/api/v1/agent-garden/agents/register", agentGardenHandler(registerAgent, true));
route("GET", "/api/v1/agent-garden/agents/:agentId", async (req, auth, params, url) => {
  const result = await getAgent(req, auth, params);
  return json(result.data ?? { error: result.error }, result.status);
});

// Capabilities
route("POST", "/api/v1/agent-garden/agents/:agentId/capabilities", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await updateCapabilities(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

// Sources & Datasets
route("POST", "/api/v1/agent-garden/sources", agentGardenHandler(submitSource, true));
route("POST", "/api/v1/agent-garden/datasets", agentGardenHandler(submitDataset, true));

// Research Trees
route("POST", "/api/v1/agent-garden/research-trees/bulk", agentGardenHandler(submitResearchTreesBulk, true));

route("POST", "/api/v1/agent-garden/research-trees/:recordId/species-classification", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await submitSpeciesClassification(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

route("POST", "/api/v1/agent-garden/research-trees/:recordId/geocode", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await submitGeocode(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

route("POST", "/api/v1/agent-garden/research-trees/:recordId/enrich", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await submitEnrichment(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

route("POST", "/api/v1/agent-garden/research-trees/:recordId/duplicate-check", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await submitDuplicateCheck(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

route("POST", "/api/v1/agent-garden/research-trees/:recordId/candidate", async (req, auth, params) => {
  let body: any = {};
  try { body = await req.json(); } catch { return err("INVALID_REQUEST", "Body must be valid JSON", 400); }
  const result = await submitCandidate(req, auth, params, body);
  return json(result.data ?? { error: result.error }, result.status);
});

// Sparks
route("POST", "/api/v1/agent-garden/sparks", agentGardenHandler(submitSpark, true));

// Tasks
route("GET", "/api/v1/agent-garden/tasks", async (req, auth, params, url) => {
  const result = await getTasks(req, auth, params, url);
  return json(result.data ?? { error: result.error }, result.status);
});

// Agent contributions & rewards
route("GET", "/api/v1/agent-garden/agents/:agentId/contributions", async (req, auth, params, url) => {
  const result = await getContributions(req, auth, params, url);
  return json(result.data ?? { error: result.error }, result.status);
});

route("GET", "/api/v1/agent-garden/agents/:agentId/rewards", async (req, auth, params) => {
  const result = await getRewards(req, auth, params);
  return json(result.data ?? { error: result.error }, result.status);
});

/* ================================================================== */
/*  MAIN HANDLER                                                       */
/* ================================================================== */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Normalize path: Edge Function URL is /api-gateway/api/v1/... → we need /api/v1/...
  let path = url.pathname;
  // Strip the function name prefix if present
  const fnPrefix = "/api-gateway";
  if (path.startsWith(fnPrefix)) path = path.slice(fnPrefix.length);
  if (!path.startsWith("/")) path = "/" + path;

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateOk(clientIp, 120)) return err("RATE_LIMITED", "Too many requests. Please slow down.", 429);

  try {
    const auth = await authenticate(req);
    const match = matchRoute(req.method, path);
    if (!match) return err("NOT_FOUND", `No route: ${req.method} ${path}`, 404);

    return await match.handler(req, auth, match.params, url);
  } catch (e) {
    console.error("api-gateway error:", e);
    return err("INTERNAL", e instanceof Error ? e.message : "Unknown error", 500);
  }
});

/* ================================================================== */
/*  OpenAPI 3.1 Spec (inline)                                          */
/* ================================================================== */

function buildOpenAPISpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "S33D Root System API",
      version: "1.0.0",
      description: "The Root System — API for the TETOL (The Ethereal Tree Of Life) ecosystem. Access Ancient Friends, offerings, whispers, and navigate the digital grove programmatically.",
      contact: { name: "S33D Grove Keepers", url: "https://www.s33d.life" },
    },
    servers: [
      { url: `https://mwzcuczfedrjplndggiv.supabase.co/functions/v1/api-gateway`, description: "Production" },
    ],
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    paths: {
      "/api/identify-tree": {
        post: {
          summary: "Identify tree species from a photo",
          operationId: "identifyTreeSpecies",
          tags: ["AI", "Trees"],
          description: "Runs iNaturalist Vision first, then falls back to PlantNet if confidence is below threshold.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["imageData"],
                  properties: {
                    imageData: { type: "string", description: "Base64 data URL image payload" },
                    topK: { type: "integer", minimum: 1, maximum: 3, default: 3 },
                    threshold: { type: "number", minimum: 0, maximum: 1, default: 0.6 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Top species predictions with confidence" },
            "400": { description: "Invalid request body" },
            "500": { description: "Identification service failed" },
          },
          security: [],
        },
      },
      "/api/v1/health": {
        get: { summary: "Health check", operationId: "getHealth", tags: ["Meta"], responses: { "200": { description: "API health status" } }, security: [] },
      },
      "/api/v1/meta/capabilities": {
        get: { summary: "Capability manifest for agents", operationId: "getCapabilities", tags: ["Meta"], description: "Returns a machine-readable manifest of all available resources, scopes, filters, and rate limits. Designed for TEOTAG self-configuration.", responses: { "200": { description: "Capability manifest" } }, security: [] },
      },
      "/api/v1/meta/me": {
        get: { summary: "Current identity & permissions", operationId: "getMe", tags: ["Meta"], responses: { "200": { description: "Auth context" } } },
      },
      "/api/v1/trees": {
        get: {
          summary: "List Ancient Friends", operationId: "listTrees", tags: ["Trees"],
          parameters: [
            { name: "country", in: "query", schema: { type: "string" }, description: "Filter by nation/country" },
            { name: "species", in: "query", schema: { type: "string" }, description: "Filter by species" },
            { name: "is_churchyard", in: "query", schema: { type: "boolean" }, description: "Filter churchyard trees" },
            { name: "bbox", in: "query", schema: { type: "string" }, description: "Bounding box: south,west,north,east" },
            { name: "near", in: "query", schema: { type: "string" }, description: "Proximity: lat,lng,radiusKm" },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "cursor", in: "query", schema: { type: "integer" }, description: "Offset cursor for pagination" },
          ],
          responses: { "200": { description: "Paginated list of trees" } },
          security: [],
        },
      },
      "/api/v1/trees/{id}": {
        get: { summary: "Get tree details", operationId: "getTree", tags: ["Trees"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Tree detail" }, "404": { description: "Not found" } }, security: [] },
      },
      "/api/v1/trees/{id}/offerings": {
        get: { summary: "List offerings for a tree", operationId: "getTreeOfferings", tags: ["Trees", "Offerings"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }, { name: "type", in: "query", schema: { type: "string", enum: ["photo", "song", "poem", "story", "nft", "voice", "book"] } }, { name: "limit", in: "query", schema: { type: "integer", default: 20 } }, { name: "cursor", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Offerings list" } }, security: [] },
      },
      "/api/v1/trees/{id}/whispers": {
        get: { summary: "List public whispers anchored to a tree", operationId: "getTreeWhispers", tags: ["Trees", "Whispers"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Whispers list" } } },
      },
      "/api/v1/offerings": {
        get: { summary: "List offerings", operationId: "listOfferings", tags: ["Offerings"], parameters: [{ name: "visibility", in: "query", schema: { type: "string", enum: ["public", "mine"] } }, { name: "tree_id", in: "query", schema: { type: "string", format: "uuid" } }, { name: "type", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer", default: 20 } }, { name: "cursor", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Offerings list" } } },
      },
      "/api/v1/offerings/{id}": {
        get: { summary: "Get offering details", operationId: "getOffering", tags: ["Offerings"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Offering detail" }, "404": { description: "Not found" } } },
      },
      "/api/v1/search": {
        get: { summary: "Unified search", operationId: "search", tags: ["Search"], description: "Search across trees, offerings with a single query. Returns unified results.", parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } }, { name: "types", in: "query", schema: { type: "string", default: "trees,offerings" }, description: "Comma-separated: trees, offerings" }], responses: { "200": { description: "Search results" } }, security: [] },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "User session JWT from Supabase Auth" },
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key", description: "Agent token for server-to-server or TEOTAG integration" },
      },
    },
  };
}
