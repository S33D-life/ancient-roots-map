/**
 * Tree Knowledge Trunk — TypeScript types for the research staging pipeline.
 *
 * DB tables (after 20260528130000_knowledge_trunk_unification.sql):
 *   tree_species_sources          — source documents & citations
 *   tree_species_research_staging — agent-proposed knowledge entries (staging)
 *   research_review_queue         — human review workflow
 *   tree_families                 — botanical family metadata
 *
 * Canonical production tables (Treeasurus — never written by agents):
 *   species_index                 — one row per species, identity + flags
 *   tree_species_lore             — categorised knowledge body rows
 *   tree_species_names            — multilingual names
 *
 * Safety contract (enforced at write time by researchSafety.ts):
 *   - Agents write ONLY to tree_species_research_staging
 *   - Approved entries promote to tree_species_lore rows via the review queue
 *   - Folkloric/mythic notes ALWAYS stored with category='folklore'
 *   - Medical claims require contains_medical_claims=true AND medical_caution_added=true
 */

// ─── Source reliability ───────────────────────────────────────────────────────

export type SourceType = 'web' | 'book' | 'paper' | 'database' | 'agent' | 'manual';

/** 1 = peer-reviewed / institutional  2 = reputable popular  3 = folklore / unverified */
export type ReliabilityTier = 1 | 2 | 3;

/**
 * tree_species_sources — source documents & citations.
 * (Renamed from research_sources in 20260528130000.)
 */
export interface TreeSpeciesSource {
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

export type TreeSpeciesSourceInsert = Omit<TreeSpeciesSource, 'id' | 'created_at'>;

/** @deprecated use TreeSpeciesSource — kept temporarily for any import-sites until Phase 2 cleanup */
export type ResearchSource = TreeSpeciesSource;
/** @deprecated use TreeSpeciesSourceInsert */
export type ResearchSourceInsert = TreeSpeciesSourceInsert;

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

// ─── Lore category (mirrors tree_species_lore.category CHECK constraint) ─────

export type LoreCategory =
  | 'ecology'
  | 'habitat'
  | 'seasonal'
  | 'identification'
  | 'folklore'
  | 'medicinal'
  | 'ancient_relevance'
  | 'general';

// ─── Tree families (tree_families table) ─────────────────────────────────────

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
 * tree_species_research_staging — agent/researcher deposits proposed knowledge here.
 * (Renamed from research_staging_entries in 20260528130000.)
 *
 * FK: species_id → species_index.id (nullable — agent may propose a new species)
 * NEVER writes directly to tree_species_lore or species_index.
 */
export interface TreeSpeciesResearchStaging {
  id: string;

  // Link to canonical trunk (nullable until species is confirmed in species_index)
  species_id?: string;

  // Identity — used when species_id is null (new species proposal)
  entry_type: EntryType;
  slug?: string;
  common_name?: string;
  latin_name?: string;
  family_slug?: string;

  // Content layers — all optional; fill what you know.
  // On promotion, each non-null layer becomes a tree_species_lore row.
  identification_clues?: IdentificationClues;
  ecology_notes?: string;
  habitat_notes?: string;
  /** Why this species appears in Ancient Friends encounters */
  ancient_tree_relevance?: string;
  seasonal_notes?: string;
  /** SEPARATE from ecology — mythic, ceremonial, cultural memory → category='folklore' */
  folklore_mythic_notes?: string;
  /** Only present with appropriate safety caveats → category='medicinal' */
  medicinal_edible_notes?: string;
  conservation_notes?: string;

  // Provenance
  source_ids?: string[];   // references tree_species_sources.id
  source_urls?: string[];  // raw URLs for quick submissions
  /** 0.0–1.0: 0 = speculation, 0.5 = plausible, 1.0 = well-sourced */
  confidence_score: number;
  agent_model?: string;

  // Safety flags — validated before promotion (see researchSafety.ts)
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

  // Target integrations (which canonical flags to set on promotion)
  target_arborium: boolean;
  target_atlas: boolean;
  target_id_flow: boolean;
  target_ancient_friends: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type TreeSpeciesResearchStagingInsert = Omit<
  TreeSpeciesResearchStaging,
  'id' | 'created_at' | 'updated_at' | 'approved_at' | 'rejected_at'
>;

/** @deprecated use TreeSpeciesResearchStaging — kept for import-sites until Phase 2 cleanup */
export type ResearchStagingEntry = TreeSpeciesResearchStaging;
/** @deprecated use TreeSpeciesResearchStagingInsert */
export type ResearchStagingEntryInsert = TreeSpeciesResearchStagingInsert;

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
  entry?: TreeSpeciesResearchStaging;
}

// ─── UI helper types ──────────────────────────────────────────────────────────

export interface ReviewDecision {
  entry_id: string;
  action: ReviewAction;
  reviewer_notes?: string;
  rejection_reason?: string;
}

/** A resolved staging entry with its sources pre-joined — used in the Research Room UI */
export interface StagingEntryWithSources extends TreeSpeciesResearchStaging {
  sources?: TreeSpeciesSource[];
}

/** Summary counts for the Research Room queue dashboard header */
export interface ResearchQueueStats {
  draft: number;
  needs_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
}

/**
 * @deprecated TreeSpeciesEnrichment table has been dropped (20260528130000).
 * Production knowledge now lives in species_index + tree_species_lore.
 * This type is kept as a stub to avoid import errors until any remaining
 * references are cleaned up in Phase 2.
 */
export interface TreeSpeciesEnrichment {
  /** @deprecated */
  id: string;
  /** @deprecated use species_index.slug */
  species_slug: string;
}
