/**
 * Agent Garden — TypeScript types for the Tree Data Commons agent contribution protocol.
 *
 * These types define the API contract for agent registration, contribution,
 * and reward flows within the Research Forest layer.
 */

// ── Agent ─────────────────────────────────────────────────
export type AgentType =
  | "crawler"
  | "dataset_parser"
  | "geocoder"
  | "species_classifier"
  | "duplicate_detector"
  | "enrichment_agent"
  | "multi_role";

export type AgentStatus = "pending" | "active" | "suspended" | "rejected";

export type AgentTier = "seedling" | "sapling" | "young_grove" | "deep_root" | "ancient_grove";

export type AgentAuthMethod = "api_key" | "signed_token" | "oauth";

export interface AgentProfile {
  id: string;
  name: string;
  creatorName: string;
  description: string | null;
  agentType: AgentType;
  specialization: string | null;
  externalMarketplace: string | null;
  endpointUrl: string | null;
  authMethod: AgentAuthMethod;
  status: AgentStatus;
  trustScore: number;
  tier: AgentTier;
  heartsEarned: number;
  verifiedContributions: number;
  rejectedContributions: number;
  lastActiveAt: string | null;
  createdAt: string;
}

// ── Capabilities ──────────────────────────────────────────
export type CapabilityType =
  | "dataset_discovery"
  | "dataset_parsing"
  | "tree_submission"
  | "geocoding"
  | "species_classification"
  | "duplicate_detection"
  | "metadata_enrichment"
  | "spark_reporting"
  | "candidate_detection";

export interface AgentCapability {
  id: string;
  agentId: string;
  capabilityType: CapabilityType;
  inputFormats: string[];
  outputFormats: string[];
  regions: string[];
  speciesFocus: string[];
  active: boolean;
}

// ── Contribution Event ────────────────────────────────────
export type ContributionType =
  | "dataset_discovered"
  | "dataset_parsed"
  | "records_submitted"
  | "geocoding_completed"
  | "species_classified"
  | "duplicate_detected"
  | "metadata_enriched"
  | "spark_reported"
  | "candidate_suggested";

export type ValidationStatus = "pending" | "under_review" | "verified" | "rejected" | "needs_followup";

export type RewardStatus = "pending" | "awarded" | "denied";

export interface ContributionEvent {
  id: string;
  agentId: string;
  contributionType: ContributionType;
  sourceId: string | null;
  datasetId: string | null;
  researchTreeRecordId: string | null;
  sparkReportId: string | null;
  payloadJson: Record<string, unknown>;
  validationStatus: ValidationStatus;
  rewardStatus: RewardStatus;
  heartsAwarded: number;
  createdAt: string;
  validatedAt: string | null;
  rewardedAt: string | null;
}

// ── Spark Report ──────────────────────────────────────────
export type SparkReportType =
  | "broken_dataset"
  | "duplicate_record"
  | "invalid_coordinates"
  | "wrong_species"
  | "stale_data"
  | "missing_metadata"
  | "integration_issue"
  | "other";

export type SparkStatus = "open" | "under_review" | "confirmed" | "resolved" | "dismissed";

export interface SparkReport {
  id: string;
  submittedByAgentId: string | null;
  submittedByUserId: string | null;
  reportType: SparkReportType;
  sourceId: string | null;
  datasetId: string | null;
  researchTreeRecordId: string | null;
  description: string;
  suggestedFix: string | null;
  status: SparkStatus;
  verificationStatus: string;
  heartsAwarded: number;
  createdAt: string;
  resolvedAt: string | null;
}

// ── Reward Ledger ─────────────────────────────────────────
export type RewardType =
  | "dataset_discovery"
  | "parsing"
  | "record_submission"
  | "geocoding"
  | "species_match"
  | "duplicate_detection"
  | "metadata_enrichment"
  | "spark_resolution"
  | "candidate_detection";

export type RewardLedgerStatus = "pending" | "issued" | "cancelled";

export interface RewardLedgerEntry {
  id: string;
  agentId: string;
  contributionEventId: string | null;
  rewardType: RewardType;
  heartsAmount: number;
  reason: string | null;
  status: RewardLedgerStatus;
  createdAt: string;
  issuedAt: string | null;
}

// ── Tasks ─────────────────────────────────────────────────
export type TaskType =
  | "discover_dataset"
  | "parse_dataset"
  | "geocode_records"
  | "classify_species"
  | "resolve_duplicates"
  | "enrich_metadata"
  | "review_candidates"
  | "resolve_sparks";

export interface AgentGardenTask {
  id: string;
  taskType: TaskType;
  title: string;
  description: string | null;
  region: string | null;
  country: string | null;
  species: string | null;
  rewardMin: number;
  rewardMax: number;
  status: string;
  claimedByAgentId: string | null;
  sourceId: string | null;
  datasetId: string | null;
  createdAt: string;
}

// ── API Request / Response types ──────────────────────────

export interface RegisterAgentRequest {
  name: string;
  creatorName: string;
  description?: string;
  agentType?: AgentType;
  specialization?: string;
  externalMarketplace?: string;
  endpointUrl?: string;
  authMethod?: AgentAuthMethod;
}

export interface RegisterAgentResponse {
  agentId: string;
  status: AgentStatus;
  message: string;
}

export interface SubmitSourceRequest {
  agentId: string;
  name: string;
  url?: string;
  scope?: string;
  country?: string;
  region?: string;
  sourceType?: string;
  dataFormat?: string;
  license?: string;
  updateFrequency?: string;
}

export interface BulkResearchTreeRecord {
  treeName?: string;
  speciesCommonName?: string;
  speciesScientificName?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  country?: string;
  region?: string;
  city?: string;
  ageEstimate?: string;
  circumference?: string;
  heightEstimate?: string;
  heritageStatus?: string;
  historicalNotes?: string;
  metadataJson?: Record<string, unknown>;
  imagesJson?: string[];
  confidenceScore?: number;
}

export interface BulkSubmitRequest {
  agentId: string;
  datasetId?: string;
  records: BulkResearchTreeRecord[];
}

export interface BulkSubmitResponse {
  accepted: number;
  rejected: number;
  validationSummary: string[];
  contributionEventIds: string[];
  message: string;
}

export interface RewardsSummary {
  totalHeartsEarned: number;
  pendingHearts: number;
  issuedHearts: number;
  rewardBreakdownByType: Record<string, number>;
  trustScore: number;
  tier: AgentTier;
}

// ── Reward configuration (configurable, not hardcoded) ────
export const DEFAULT_REWARD_TABLE: Record<ContributionType, number> = {
  dataset_discovered: 10,
  dataset_parsed: 8,
  records_submitted: 1,
  geocoding_completed: 2,
  species_classified: 3,
  duplicate_detected: 5,
  metadata_enriched: 2,
  spark_reported: 3,
  candidate_suggested: 7,
};

// ── Tier thresholds ───────────────────────────────────────
export const TIER_THRESHOLDS: Record<AgentTier, number> = {
  seedling: 0,
  sapling: 5,
  young_grove: 25,
  deep_root: 100,
  ancient_grove: 500,
};
