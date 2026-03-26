/**
 * Agent Garden — Backend service handlers for the Tree Data Commons agent contribution protocol.
 *
 * All writes go to Research Forest only. Ancient Friends are never created by agents.
 * Rewards are gated behind verification.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/* ── Validation helpers ── */

const VALID_AGENT_TYPES = ["crawler", "dataset_parser", "geocoder", "species_classifier", "duplicate_detector", "enrichment_agent", "multi_role"];
const VALID_CAPABILITY_TYPES = ["dataset_discovery", "dataset_parsing", "tree_submission", "geocoding", "species_classification", "duplicate_detection", "metadata_enrichment", "spark_reporting", "candidate_detection"];
const VALID_CONTRIBUTION_TYPES = ["dataset_discovered", "dataset_parsed", "records_submitted", "geocoding_completed", "species_classified", "duplicate_detected", "metadata_enriched", "spark_reported", "candidate_suggested"];
const VALID_SPARK_TYPES = ["broken_dataset", "duplicate_record", "invalid_coordinates", "wrong_species", "stale_data", "missing_metadata", "integration_issue", "other"];
const VALID_TASK_TYPES = ["discover_dataset", "parse_dataset", "geocode_records", "classify_species", "resolve_duplicates", "enrich_metadata", "review_candidates", "resolve_sparks"];

// Default reward amounts by contribution type (configurable)
const REWARD_TABLE: Record<string, number> = {
  dataset_discovered: 10,
  dataset_parsed: 8,
  records_submitted: 1, // per record
  geocoding_completed: 2,
  species_classified: 3,
  duplicate_detected: 5,
  metadata_enriched: 2,
  spark_reported: 3,
  candidate_suggested: 7,
};

function trustMultiplier(trustScore: number | null): number {
  const s = trustScore ?? 50;
  if (s >= 90) return 1.5;
  if (s >= 70) return 1.2;
  if (s >= 50) return 1.0;
  if (s >= 30) return 0.8;
  return 0.5;
}

interface AuthResult {
  userId: string | null;
  roles: string[];
  scopes: string[];
  isAgent: boolean;
}

/* ── Verify agent is active ── */
async function verifyAgent(agentId: string): Promise<{ ok: boolean; agent?: any; error?: string }> {
  const db = adminClient();
  const { data, error } = await db.from("agent_profiles").select("*").eq("id", agentId).single();
  if (error || !data) return { ok: false, error: "Agent not found" };
  if (data.status === "suspended") return { ok: false, error: "Agent is suspended" };
  if (data.status === "rejected") return { ok: false, error: "Agent registration was rejected" };
  if (data.status === "pending") return { ok: false, error: "Agent is still pending activation" };
  return { ok: true, agent: data };
}

/* ── Create contribution event ── */
async function createContribution(params: {
  agentId: string;
  contributionType: string;
  sourceId?: string;
  datasetId?: string;
  researchTreeRecordId?: string;
  sparkReportId?: string;
  payload?: any;
  heartsBase?: number;
  trustScore?: number | null;
}) {
  const db = adminClient();
  const mult = trustMultiplier(params.trustScore);
  const hearts = Math.round((params.heartsBase ?? REWARD_TABLE[params.contributionType] ?? 1) * mult);

  const { data, error } = await db.from("agent_contribution_events").insert({
    agent_id: params.agentId,
    contribution_type: params.contributionType,
    source_id: params.sourceId ?? null,
    dataset_id: params.datasetId ?? null,
    research_tree_record_id: params.researchTreeRecordId ?? null,
    spark_report_id: params.sparkReportId ?? null,
    payload_json: params.payload ?? {},
    validation_status: "pending",
    reward_status: "pending",
    hearts_awarded: hearts,
  }).select("id").single();

  if (error) console.error("contribution insert error:", error.message);

  // Update agent last_active
  await db.from("agent_profiles").update({ last_active: new Date().toISOString() }).eq("id", params.agentId);

  return data;
}

/* ================================================================== */
/*  HANDLERS                                                           */
/* ================================================================== */

/** POST /api/v1/agent-garden/agents/register */
export async function registerAgent(_req: Request, auth: AuthResult, body: any) {
  if (!auth.userId) return { error: "Authentication required", status: 401 };

  const { name, creatorName, description, agentType, specialization, externalMarketplace, endpointUrl, authMethod } = body;
  if (!name || !creatorName) return { error: "name and creatorName are required", status: 400 };
  if (agentType && !VALID_AGENT_TYPES.includes(agentType)) return { error: `Invalid agentType. Must be one of: ${VALID_AGENT_TYPES.join(", ")}`, status: 400 };
  if (name.length > 200) return { error: "name too long (max 200)", status: 400 };

  const db = adminClient();
  const { data, error } = await db.from("agent_profiles").insert({
    agent_name: name,
    creator: creatorName,
    description: description ?? null,
    agent_type: agentType ?? "multi_role",
    specialization: specialization ?? null,
    registration_source: externalMarketplace ?? null,
    external_marketplace: externalMarketplace ?? null,
    api_endpoint: endpointUrl ?? null,
    auth_method: authMethod ?? "api_key",
    status: "pending",
    trust_score: 50,
    tier: "seedling",
  }).select("id, status").single();

  if (error) return { error: error.message, status: 500 };
  return { data: { agentId: data.id, status: data.status, message: "Agent registered and awaiting activation" }, status: 201 };
}

/** GET /api/v1/agent-garden/agents/:agentId */
export async function getAgent(_req: Request, _auth: AuthResult, params: Record<string, string>) {
  const db = adminClient();
  const { data: agent, error } = await db.from("agent_profiles").select("*").eq("id", params.agentId).single();
  if (error || !agent) return { error: "Agent not found", status: 404 };

  // Get contribution stats
  const { data: stats } = await db.from("agent_contribution_events")
    .select("contribution_type, validation_status")
    .eq("agent_id", params.agentId);

  const summary = {
    total: (stats ?? []).length,
    verified: (stats ?? []).filter((s: any) => s.validation_status === "verified").length,
    pending: (stats ?? []).filter((s: any) => s.validation_status === "pending").length,
    rejected: (stats ?? []).filter((s: any) => s.validation_status === "rejected").length,
  };

  return {
    data: {
      id: agent.id,
      name: agent.agent_name,
      creatorName: agent.creator,
      description: agent.description,
      agentType: agent.agent_type,
      specialization: agent.specialization,
      externalMarketplace: agent.external_marketplace ?? agent.registration_source,
      endpointUrl: agent.api_endpoint,
      authMethod: agent.auth_method,
      status: agent.status,
      trustScore: agent.trust_score,
      tier: agent.tier,
      heartsEarned: agent.hearts_earned,
      verifiedContributions: agent.verified_contributions,
      rejectedContributions: agent.rejected_contributions,
      contributionSummary: summary,
      lastActiveAt: agent.last_active,
      createdAt: agent.created_at,
    },
    status: 200,
  };
}

/** POST /api/v1/agent-garden/agents/:agentId/capabilities */
export async function updateCapabilities(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(params.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const capabilities = body.capabilities;
  if (!Array.isArray(capabilities)) return { error: "capabilities must be an array", status: 400 };

  const db = adminClient();
  // Delete existing capabilities
  await db.from("agent_capabilities").delete().eq("agent_id", params.agentId);

  const rows = capabilities.map((c: any) => {
    if (!VALID_CAPABILITY_TYPES.includes(c.capabilityType)) throw new Error(`Invalid capabilityType: ${c.capabilityType}`);
    return {
      agent_id: params.agentId,
      capability_type: c.capabilityType,
      input_formats: c.inputFormats ?? [],
      output_formats: c.outputFormats ?? [],
      regions: c.regions ?? [],
      species_focus: c.speciesFocus ?? [],
      active: c.active !== false,
    };
  });

  const { error } = await db.from("agent_capabilities").insert(rows);
  if (error) return { error: error.message, status: 500 };
  return { data: { updated: rows.length }, status: 200 };
}

/** POST /api/v1/agent-garden/sources */
export async function submitSource(_req: Request, _auth: AuthResult, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const { agentId, name, url, scope, country, region, sourceType, dataFormat, license, updateFrequency } = body;
  if (!name) return { error: "name is required", status: 400 };
  if (name.length > 500) return { error: "name too long (max 500)", status: 400 };

  const db = adminClient();
  const { data, error } = await db.from("tree_data_sources").insert({
    name,
    url: url ?? null,
    scope: scope ?? "national",
    country: country ?? null,
    region: region ?? null,
    source_type: sourceType ?? "other",
    data_format: dataFormat ?? "unknown",
    license: license ?? null,
    update_frequency: updateFrequency ?? null,
    integration_status: "discovered",
    discovered_by_agent_id: agentId,
  }).select("id").single();

  if (error) return { error: error.message, status: 500 };

  const contrib = await createContribution({
    agentId,
    contributionType: "dataset_discovered",
    sourceId: data.id,
    trustScore: check.agent.trust_score,
  });

  return {
    data: { sourceId: data.id, contributionEventId: contrib?.id, message: "Source submitted for review" },
    status: 201,
  };
}

/** POST /api/v1/agent-garden/datasets */
export async function submitDataset(_req: Request, _auth: AuthResult, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const { agentId, sourceId, name, description, treeCount, regionCoverage, speciesCoverage, ingestionStatus } = body;
  if (!sourceId || !name) return { error: "sourceId and name are required", status: 400 };

  const db = adminClient();
  const { data, error } = await db.from("tree_datasets").insert({
    source_id: sourceId,
    name,
    description: description ?? null,
    tree_count: treeCount ?? 0,
    regions_covered: regionCoverage ?? [],
    species_coverage: speciesCoverage ?? [],
    ingestion_status: ingestionStatus ?? "discovered",
    created_by_agent_id: agentId,
  }).select("id").single();

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId,
    contributionType: "dataset_parsed",
    sourceId,
    datasetId: data.id,
    trustScore: check.agent.trust_score,
  });

  return { data: { datasetId: data.id, message: "Dataset registered" }, status: 201 };
}

/** POST /api/v1/agent-garden/research-trees/bulk */
export async function submitResearchTreesBulk(_req: Request, _auth: AuthResult, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const { agentId, datasetId, records } = body;
  if (!Array.isArray(records) || records.length === 0) return { error: "records array is required", status: 400 };
  if (records.length > 500) return { error: "Maximum 500 records per bulk submission", status: 400 };

  const db = adminClient();
  let accepted = 0;
  let rejected = 0;
  const errors: string[] = [];
  const contributionIds: string[] = [];

  // Validate and insert in batches
  const validRows: any[] = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.speciesScientificName && !r.speciesCommonName) {
      rejected++;
      errors.push(`Record ${i}: species name required`);
      continue;
    }
    if (!r.locationLabel && !r.latitude) {
      rejected++;
      errors.push(`Record ${i}: location or coordinates required`);
      continue;
    }
    // Coordinate validation
    if (r.latitude != null && (r.latitude < -90 || r.latitude > 90)) {
      rejected++;
      errors.push(`Record ${i}: invalid latitude`);
      continue;
    }
    if (r.longitude != null && (r.longitude < -180 || r.longitude > 180)) {
      rejected++;
      errors.push(`Record ${i}: invalid longitude`);
      continue;
    }

    validRows.push({
      submitted_by_agent_id: agentId,
      dataset_id: datasetId ?? null,
      tree_name: r.treeName ?? null,
      species_common: r.speciesCommonName ?? null,
      species_scientific: r.speciesScientificName ?? "Unknown",
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      locality_text: r.locationLabel ?? "Unknown location",
      country: r.country ?? "Unknown",
      province: r.region ?? null,
      city: r.city ?? null,
      age_estimate: r.ageEstimate ?? null,
      girth_or_stem: r.circumference ?? null,
      height_m: r.heightEstimate ? parseFloat(r.heightEstimate) : null,
      heritage_status: r.heritageStatus ?? null,
      description: r.historicalNotes ?? null,
      user_annotations: r.metadataJson ?? null,
      images_json: r.imagesJson ?? [],
      record_status: "research",
      status: "research",
      confidence_score: r.confidenceScore ?? null,
      source_doc_title: "Agent Submission",
      source_doc_url: "agent-garden",
      source_doc_year: new Date().getFullYear(),
      source_program: "agent-garden",
      geo_precision: r.latitude ? "exact" : "locality",
    });
  }

  // Batch insert
  if (validRows.length > 0) {
    const { data: inserted, error } = await db.from("research_trees").insert(validRows).select("id");
    if (error) {
      return { error: `Batch insert failed: ${error.message}`, status: 500 };
    }
    accepted = (inserted ?? []).length;

    // Create a single contribution event for the batch
    const contrib = await createContribution({
      agentId,
      contributionType: "records_submitted",
      datasetId: datasetId ?? undefined,
      payload: { recordCount: accepted },
      heartsBase: accepted * (REWARD_TABLE.records_submitted ?? 1),
      trustScore: check.agent.trust_score,
    });
    if (contrib) contributionIds.push(contrib.id);
  }

  return {
    data: {
      accepted,
      rejected,
      validationSummary: errors.length > 0 ? errors.slice(0, 20) : [],
      contributionEventIds: contributionIds,
      message: `${accepted} records accepted into Research Forest, ${rejected} rejected`,
    },
    status: 201,
  };
}

/** POST /api/v1/agent-garden/research-trees/:recordId/species-classification */
export async function submitSpeciesClassification(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const db = adminClient();
  const { error } = await db.from("research_trees").update({
    species_common: body.speciesCommonName,
    species_scientific: body.speciesScientificName,
    confidence_score: body.confidenceScore ?? null,
  }).eq("id", params.recordId);

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "species_classified",
    researchTreeRecordId: params.recordId,
    payload: { speciesCommon: body.speciesCommonName, speciesScientific: body.speciesScientificName, confidence: body.confidenceScore },
    trustScore: check.agent.trust_score,
  });

  return { data: { message: "Species classification submitted" }, status: 200 };
}

/** POST /api/v1/agent-garden/research-trees/:recordId/geocode */
export async function submitGeocode(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  if (body.latitude < -90 || body.latitude > 90 || body.longitude < -180 || body.longitude > 180) {
    return { error: "Invalid coordinates", status: 400 };
  }

  const db = adminClient();
  const { error } = await db.from("research_trees").update({
    latitude: body.latitude,
    longitude: body.longitude,
    confidence_score: body.confidenceScore ?? null,
    geo_precision: "exact",
  }).eq("id", params.recordId);

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "geocoding_completed",
    researchTreeRecordId: params.recordId,
    payload: { lat: body.latitude, lng: body.longitude, source: body.source, confidence: body.confidenceScore },
    trustScore: check.agent.trust_score,
  });

  return { data: { message: "Geocoding update submitted" }, status: 200 };
}

/** POST /api/v1/agent-garden/research-trees/:recordId/enrich */
export async function submitEnrichment(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const db = adminClient();
  const updates: any = {};
  if (body.ageEstimate) updates.age_estimate = body.ageEstimate;
  if (body.circumference) updates.girth_or_stem = body.circumference;
  if (body.historicalNotes) updates.description = body.historicalNotes;
  if (body.metadataJson) updates.user_annotations = body.metadataJson;

  if (Object.keys(updates).length === 0) return { error: "No enrichment fields provided", status: 400 };

  const { error } = await db.from("research_trees").update(updates).eq("id", params.recordId);
  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "metadata_enriched",
    researchTreeRecordId: params.recordId,
    payload: updates,
    trustScore: check.agent.trust_score,
  });

  return { data: { message: "Enrichment submitted" }, status: 200 };
}

/** POST /api/v1/agent-garden/research-trees/:recordId/duplicate-check */
export async function submitDuplicateCheck(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const db = adminClient();
  // Mark duplicate relationship
  const { error } = await db.from("research_trees").update({
    duplicate_of_record_id: body.possibleDuplicateRecordId,
  }).eq("id", params.recordId);

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "duplicate_detected",
    researchTreeRecordId: params.recordId,
    payload: { duplicateOf: body.possibleDuplicateRecordId, confidence: body.confidenceScore, reason: body.reason },
    trustScore: check.agent.trust_score,
  });

  return { data: { message: "Duplicate check submitted" }, status: 200 };
}

/** POST /api/v1/agent-garden/research-trees/:recordId/candidate */
export async function submitCandidate(_req: Request, _auth: AuthResult, params: Record<string, string>, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  const db = adminClient();
  // Only update status — NEVER create Ancient Friend directly
  const { error } = await db.from("research_trees").update({
    record_status: "ancient_friend_candidate",
  }).eq("id", params.recordId).in("record_status", ["research", "verified"]);

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "candidate_suggested",
    researchTreeRecordId: params.recordId,
    payload: { reason: body.reason, confidence: body.confidenceScore },
    trustScore: check.agent.trust_score,
  });

  return { data: { message: "Ancient Friend candidate suggestion submitted for human review" }, status: 200 };
}

/** POST /api/v1/agent-garden/sparks */
export async function submitSpark(_req: Request, _auth: AuthResult, body: any) {
  const check = await verifyAgent(body.agentId);
  if (!check.ok) return { error: check.error, status: 403 };

  if (!VALID_SPARK_TYPES.includes(body.reportType ?? "other")) {
    return { error: `Invalid reportType. Must be one of: ${VALID_SPARK_TYPES.join(", ")}`, status: 400 };
  }
  if (!body.description || body.description.length > 2000) {
    return { error: "description is required (max 2000 chars)", status: 400 };
  }

  const db = adminClient();
  const { data, error } = await db.from("spark_reports").insert({
    submitted_by_agent: body.agentId,
    report_type: body.reportType ?? "other",
    target_type: "research_tree",
    target_id: body.researchTreeRecordId ?? null,
    research_tree_record_id: body.researchTreeRecordId ?? null,
    dataset_id: body.datasetId ?? null,
    description: body.description,
    suggested_fix: body.suggestedFix ?? null,
    verification_status: "pending",
    status: "open",
  }).select("id").single();

  if (error) return { error: error.message, status: 500 };

  await createContribution({
    agentId: body.agentId,
    contributionType: "spark_reported",
    sparkReportId: data.id,
    researchTreeRecordId: body.researchTreeRecordId ?? undefined,
    trustScore: check.agent.trust_score,
  });

  return { data: { sparkId: data.id, message: "Spark report submitted" }, status: 201 };
}

/** GET /api/v1/agent-garden/tasks */
export async function getTasks(_req: Request, _auth: AuthResult, _params: Record<string, string>, url: URL) {
  const db = adminClient();
  let query = db.from("agent_garden_tasks").select("*", { count: "exact" }).eq("status", "open");

  const region = url.searchParams.get("region");
  if (region) query = query.ilike("region", `%${region}%`);
  const country = url.searchParams.get("country");
  if (country) query = query.ilike("country", `%${country}%`);
  const species = url.searchParams.get("species");
  if (species) query = query.ilike("species", `%${species}%`);
  const taskType = url.searchParams.get("taskType");
  if (taskType && VALID_TASK_TYPES.includes(taskType)) query = query.eq("task_type", taskType);
  const rewardMin = url.searchParams.get("rewardMin");
  if (rewardMin) query = query.gte("reward_min", parseInt(rewardMin));

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20") || 20, 100);
  const cursor = parseInt(url.searchParams.get("cursor") ?? "0") || 0;

  query = query.order("created_at", { ascending: false }).range(cursor, cursor + limit - 1);
  const { data, error, count } = await query;
  if (error) return { error: error.message, status: 500 };

  return {
    data: {
      tasks: data ?? [],
      pagination: { limit, offset: cursor, total: count, next_cursor: (cursor + limit < (count ?? 0)) ? cursor + limit : null },
    },
    status: 200,
  };
}

/** GET /api/v1/agent-garden/agents/:agentId/contributions */
export async function getContributions(_req: Request, _auth: AuthResult, params: Record<string, string>, url: URL) {
  const db = adminClient();
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50") || 50, 200);
  const cursor = parseInt(url.searchParams.get("cursor") ?? "0") || 0;

  const { data, error, count } = await db.from("agent_contribution_events")
    .select("*", { count: "exact" })
    .eq("agent_id", params.agentId)
    .order("created_at", { ascending: false })
    .range(cursor, cursor + limit - 1);

  if (error) return { error: error.message, status: 500 };

  return {
    data: {
      contributions: data ?? [],
      pagination: { limit, offset: cursor, total: count, next_cursor: (cursor + limit < (count ?? 0)) ? cursor + limit : null },
    },
    status: 200,
  };
}

/** GET /api/v1/agent-garden/agents/:agentId/rewards */
export async function getRewards(_req: Request, _auth: AuthResult, params: Record<string, string>) {
  const db = adminClient();

  // Agent profile for totals
  const { data: agent } = await db.from("agent_profiles").select("hearts_earned, trust_score, tier").eq("id", params.agentId).single();
  if (!agent) return { error: "Agent not found", status: 404 };

  // Reward breakdown
  const { data: rewards } = await db.from("agent_reward_ledger")
    .select("reward_type, hearts_amount, status")
    .eq("agent_id", params.agentId);

  const issued = (rewards ?? []).filter((r: any) => r.status === "issued");
  const pending = (rewards ?? []).filter((r: any) => r.status === "pending");

  // Breakdown by type
  const breakdown: Record<string, number> = {};
  for (const r of issued) {
    breakdown[r.reward_type] = (breakdown[r.reward_type] ?? 0) + r.hearts_amount;
  }

  return {
    data: {
      totalHeartsEarned: agent.hearts_earned ?? 0,
      pendingHearts: pending.reduce((a: number, r: any) => a + r.hearts_amount, 0),
      issuedHearts: issued.reduce((a: number, r: any) => a + r.hearts_amount, 0),
      rewardBreakdownByType: breakdown,
      trustScore: agent.trust_score,
      tier: agent.tier,
    },
    status: 200,
  };
}
