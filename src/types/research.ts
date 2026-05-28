/**
 * Research Ingestion Architecture — TypeScript types
 *
 * Mirrors the DB schema in supabase/migrations/20260528120000_research_ingestion_architecture.sql
 *
 * Safety contract (enforced at write time by researchSafety.ts):
 *   - Agents write ONLY to ResearchStagingEntry
 *   - Humans promote approved entries to TreeSpeciesEnrichment
 *   - folkloric/mythic notes are ALWAYS stored in a separate field
 *   - medical claims require contains_medical_claims=true AND medical_caution_added=true
 */

// ─── Source reliability ───────────────────────────────────────────────────────

export type SourceType = 'web' | 'book' | 'paper' | 'database' | 'agent' | 'manual';

/** 1 = peer-reviewed / institutional  2 = reputable popular  3 = folklore / unverified */
export type ReliabilityTier = 1 | 2 | 3;

export interface ResearchSource {
  id: string;
  title: string;
  url?: string;
  source_type: SourceType;
  author?: string;
  publication_date?: string; // ISO date string
  reliability_tier: ReliabilityTier;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export type ResearchSourceInsert = Omit<ResearchSource, 'id' | 'created_at'>;

// ─── Identification clues (structured JSON) ───────────────────────────────────

export interface IdentificationClues {
  /** The single clearest visual clue to name first */
  primary: string;
  /** 2–4 supporting clues */
  secondary?: string[];
  /** Specific micro-details worth noting in the field */
  visual_details?: string[];
  /** Clue type this entry primarily addresses */
  clue_type?: 'leaf' | 'bark' | 'buds' | 'seeds' | 'flowers' | 'silhouette' | 'season';
}

// ─── Tree families ────────────────────────────────────────────────────────────

export interface TreeFamily {
  id: string;
  family_slug: string;
  common_name: string;
  latin_name: string;
  description?: string;
  key_genera?: string[];
  ecology_notes?: string;
  arborium_visible: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Research staging ─────────────────────────────────────────────────────────

export type EntryType = 'species' | 'family' | 'ancient_tree' | 'folklore' | 'ecology' | 'medicinal';

export type ReviewStatus = 'draft' | 'needs_review' | 'approved' | 'rejected' | 'revision_requested';

/**
 * An agent or researcher deposits content here.
 * Never directly modifies production data.
 */
export interface ResearchStagingEntry {
  id: string;

  // Identity
  entry_type: EntryType;
  slug?: string;
  common_name?: string;
  latin_name?: string;
  family_slug?: string;

  // Content layers — all optional; fill what you know
  identification_clues?: IdentificationClues;
  ecology_notes?: string;
  habitat_notes?: string;
  /** Why this species appears in Ancient Friends encounters */
  ancient_tree_relevance?: string;
  seasonal_notes?: string;
  /** SEPARATE from ecology — mythic, ceremonial, cultural memory */
  folklore_mythic_notes?: string;
  /** Only present with appropriate safety caveats */
  medicinal_edible_notes?: string;
  conservation_notes?: string;

  // Provenance
  source_ids?: string[];
  source_urls?: string[];
  /** 0.0–1.0: 0 = speculation, 0.5 = plausible, 1.0 = well-sourced */
  confidence_score: number;
  agent_model?: string;

  // Safety flags — checked before promotion
  contains_medical_claims: boolean;
  medical_caution_added: boolean;
  uncertainty_flagged: boolean;
  lore_separated_from_fact: boolean;
  unsourced_lore_present: boolean;

  // Workflow
  status: ReviewStatus;
  reviewed_by?: string;
  reviewer_notes?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;

  // Target integrations
  target_arborium: boolean;
  target_atlas: boolean;
  target_id_flow: boolean;
  target_ancient_friends: boolean;

  // Push tracking
  pushed_at?: string;
  pushed_to_enrichment_id?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type ResearchStagingEntryInsert = Omit<
  ResearchStagingEntry,
  'id' | 'created_at' | 'updated_at' | 'approved_at' | 'rejected_at' | 'pushed_at'
>;

// ─── Review queue ─────────────────────────────────────────────────────────────

export type ReviewAction = 'approve' | 'reject' | 'request_revision';

export interface ResearchReviewQueueItem {
  id: string;
  entry_id: string;
  priority: number; // 1–10, 1 = urgent
  assigned_to?: string;
  queued_at: string;
  reviewed_at?: string;
  action?: ReviewAction;
  notes?: string;
  // Joined from staging entry for UI convenience
  entry?: ResearchStagingEntry;
}

// ─── Production enrichment (approved only) ───────────────────────────────────

/**
 * Production-ready knowledge layer.
 * Only populated via the review workflow — never by agents directly.
 * Read by Arborium pages, Atlas tree detail, and ID flow.
 */
export interface TreeSpeciesEnrichment {
  id: string;
  species_slug: string;
  common_name?: string;
  latin_name?: string;
  family_slug?: string;

  identification_clues?: IdentificationClues;
  ecology_notes?: string;
  habitat_notes?: string;
  ancient_tree_relevance?: string;
  seasonal_notes?: string;
  /** Kept visually separate in the UI — never mixed with ecology */
  folklore_mythic_notes?: string;
  /** Rendered with the medicinal safety caveat banner */
  medicinal_edible_notes?: string;
  conservation_notes?: string;

  source_entry_ids?: string[];
  confidence_score?: number;
  approved_by?: string;

  arborium_visible: boolean;
  atlas_visible: boolean;
  /** Whether this enrichment has been used to update idBranches data */
  id_flow_eligible: boolean;
  ancient_friends_visible: boolean;

  created_at: string;
  updated_at: string;
}

// ─── UI helper types ──────────────────────────────────────────────────────────

export interface ReviewDecision {
  entry_id: string;
  action: ReviewAction;
  reviewer_notes?: string;
  rejection_reason?: string;
}

/** A resolved entry with its sources pre-joined — used in the Research Room UI */
export interface StagingEntryWithSources extends ResearchStagingEntry {
  sources?: ResearchSource[];
}

/** Summary counts for the queue dashboard header */
export interface ResearchQueueStats {
  draft: number;
  needs_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
}
