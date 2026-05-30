# Ancient Friends Species Library — Architecture & Design

> **Design only (PR 1). No implementation, no schema migration.**
>
> Guiding phrase: *The Species Library should be the flowering face of Treeasurus,
> not a second tree growing beside it.*
>
> Core principle: **One taxonomy trunk. Many interpretive surfaces. No competing
> species systems.** `species_index` / Treeasurus stays the exact truth; Species
> Concepts stay the human-facing bridge; everything else draws from these over time.

Reviewed against `main` @ `38cf5782`.

---

## 1. Current state map

```
                 EXACT TRUNK (truth)                 CONCEPT BRIDGE (human-facing)
   ┌─────────────────────────────────────┐   ┌──────────────────────────────────────┐
   │ species_index (DB, canonical)         │   │ config/speciesConcepts.ts            │
   │  key, scientific, genus, family,      │   │  oak / willow / yew / ancient-elders │
   │  gbif_taxon_id, synonyms, slug, icon, │   │  / water-loving / hives …            │
   │  metadata                             │   │  concept_type: exact_species|genus|  │
   │                                       │   │  family|hive|learning_group|mythic   │
   │ services/speciesResolver.ts (3-tier): │   │ services/speciesConceptResolver.ts   │
   │  key → species_index → treeSpecies.ts │   │  PURE, never creates species_key;    │
   │  + GBIF enrich (gbif-enrich fn)       │   │  concept_exact ≠ taxonomic exact      │
   └───────────────┬───────────────────────┘   └───────────────┬──────────────────────┘
        names + lore (DB, keyed species_id)            consumed by: starterSpeciesConcepts,
   ┌───────────────┴───────────────────────┐           (designed for) Arborium/Atlas/Quest
   │ tree_species_names  (multilingual/      │
   │   regional: name, language, country,    │   HARDCODED FALLBACK (de-facto everywhere)
   │   script, transliteration, is_primary)  │   ┌──────────────────────────────────────┐
   │ tree_species_lore   (title, body,       │   │ data/treeSpecies.ts (24KB)            │
   │   category, geography, confidence)      │   │  searchSpecies / enrichSpecies        │
   │ → consumed ONLY by use-treeasurus.ts    │   │  → imported by 16 files (AddTree etc) │
   └─────────────────────────────────────────┘   └──────────────────────────────────────┘
```

**The central truth:** the rich DB trunk (`species_index` + `tree_species_names` +
`tree_species_lore`) is **siloed to Treeasurus** (only `use-treeasurus.ts` reads names/lore),
while the rest of the app (Arborium, Add Tree, search, ~16 importers) leans on the
**hardcoded `treeSpecies.ts`**. The concept layer exists and is clean but is barely consumed
yet. **Imagery does not exist** (`species_index.icon` + `metadata` jsonb only).

---

## 2. Existing systems involved (roles · exact vs fuzzy)

| System | Role today | Exact / fuzzy | Keep / unify |
|---|---|---|---|
| `species_index` (DB) | Canonical exact taxonomy | **exact** (`species_key`) | **keep — the trunk** |
| `services/speciesResolver.ts` | 3-tier exact resolver + GBIF | exact→fuzzy→unresolved (typed) | keep; make the **one** exact resolver app-wide |
| `tree_species_names` (DB) | Multilingual/regional names | exact (by `species_id`) | **keep; unify search + display to read it** |
| `tree_species_lore` (DB) | Ecological/cultural lore | exact (by `species_id`) | keep; surface beyond Treeasurus |
| `config/speciesConcepts.ts` | Genus/family/hive/learning/mythic groups | **fuzzy/broad/mythic** | keep — the bridge |
| `services/speciesConceptResolver.ts` | Pure concept resolver (no keys) | concept-level only | keep; make consumers use it |
| `data/treeSpecies.ts` | Hardcoded list (16 importers) | fuzzy | **demote to offline/sync fallback**, don't delete |
| `components/arborium/*` | Starter cards, ID panel, families | mixed | unify reads toward concepts + species_index |
| `AddTreeDialog.tsx` | `searchSpecies` (hardcoded) + vision | fuzzy | **unify suggestions toward resolver + concepts** |
| `encounter/SpeciesIdentifier.tsx` | Vision-based ID (exact/uncertain) | exact + certainty | keep; emit species_key when known, else raw+concept |
| `use-treeasurus.ts` | Treeasurus pages (names+lore) | exact | keep — canonical pages |
| GBIF (`gbif-enrich` fn) | Enrich species_index from strings | exact-ward | keep; the on-ramp from fuzzy→exact |
| Atlas species activity / Data Commons | Display species labels | mixed/raw | unify label display via resolver (later) |

---

## 3. Duplication risks

1. 🔴 **Hardcoded `treeSpecies.ts` vs the DB trunk** — 16 importers treat the hardcoded
   list as truth; the canonical `species_index`+names+lore is only used by Treeasurus.
   *Unify direction:* DB-first resolution everywhere; `treeSpecies.ts` becomes the
   synchronous/offline fallback only. **Do not delete** (it's the sync path + offline).
2. 🟡 **Two name sources** — `tree_species_names` (rich DB) vs `treeSpecies.ts` common names.
   Search should prefer the DB names table.
3. 🟡 **AddTree suggestions** bypass both resolvers (use `searchSpecies` directly) → users
   can't tell exact vs concept; no `species_key` captured at suggestion time.
4. 🟢 **Concept layer is clean** (pure, non-competing) — no duplication; just under-consumed.
5. 🔴 (future) **Imagery** — highest risk of a parallel lane if built as a standalone photo
   catalogue. Must attach to `species_key` / `concept_id` / raw label from day one.

---

## 4. Unified Species Library model

One trunk, layered. Each layer keys back to the trunk; **no layer invents exact species.**

```
EXACT          species_index.species_key  ← the only taxonomic identity
  ├ names      tree_species_names   (species_id → many names: lang/region/script/aliases)
  ├ lore       tree_species_lore    (species_id → many entries: ecology/habitat/clues/myth)
  └ imagery    [NEW] species_media  (subject ref → images, see §8)
CONCEPT        speciesConcepts.concept_id ← genus/family/hive/learning/mythic
  └ imagery    [NEW] species_media  (subject = concept_id)  e.g. an "oak" concept hero
RAW/UNRESOLVED preserved label      ← never fabricated into a key; may carry a concept hint
```

A single read-model the surfaces consume (design-level shape, not a new table):
```
SpeciesLibraryEntry {
  identity:  { kind: "exact" | "concept" | "raw",
               species_key?, concept_id?, raw_label }
  display:   { primary_name, scientific_name?, concept_label?, confidence }
  names:     SpeciesName[]      // from tree_species_names (exact) or concept aliases
  lore:      SpeciesLore[]      // from tree_species_lore (exact) or concept notes
  imagery:   SpeciesMedia       // §8 fallback hierarchy
  clues:     { leaf?, bark?, seed?, flower? }   // from lore.category + media
  links:     { treeasurus_slug?, hive? }
}
```
This is assembled by a thin **read service** over the existing resolvers + tables — it does
**not** replace them and creates nothing.

---

## 5. Arborium integration plan

- Starter cards (`starterSpecies.ts` + `starterSpeciesConcepts.ts`, PR #34) already map to
  concepts → resolve each starter via `resolveArboriumStarterConcept` and render concept
  label + (when a representative species exists) a species_index hero.
- ID flows (`IDPanel`, `idBranches.ts`) show leaf/bark/seed clue chips sourced from
  `tree_species_lore.category` + imagery — **concept vs exact stays explicit** (a chip says
  "Oak — genus" not a fake species).
- Arborium keeps its atmospheric copy locally; **structural** species facts come from the trunk.
- *Not now:* no Arborium rewrite; first step is read-only enrichment (PR 3).

## 6. Add Tree integration plan

- Replace/augment the `searchSpecies` typeahead so suggestions come from the unified read
  service: each row shows **display label + scientific (if exact) + a concept/exact badge +
  representative image + clue chips**.
- On select: capture `species_key` when the suggestion is exact; otherwise **preserve the raw
  label and attach `concept_id`** — never fabricate a key (honours the "oak is a concept" rule).
- Surface confidence/source gently; offer the existing refinement path for later correction.
- *Not now:* no Add Tree rewrite; first step is read-only suggestion enrichment (PR 4),
  keeping the current save contract.

## 7. Search integration plan

- Route "oak / willow / yew / regional names / scientific names / mythic groups" through:
  `speciesResolver` (exact) **and** `speciesConceptResolver` (concept), merging results so a
  query returns exact species, the concept, and member hives coherently.
- Read `tree_species_names` for regional/multilingual matches (currently search doesn't).
- `unified-search.ts` species entries become resolver-backed rather than hand-curated.
- *Not now:* design only; implementation is a later, tested PR.

## 8. Imagery model & licensing strategy

**Single media model keyed to the trunk — never a detached catalogue.**
```
species_media {                       // NEW (later PR; additive, justified)
  id
  subject_kind:  "species_key" | "concept_id" | "raw_label"
  subject_ref:   string               // the key / id / preserved label
  role:          "hero" | "leaf" | "bark" | "seed_fruit" | "flower" | "silhouette" | "seasonal"
  season?:       "bare" | "bud" | "leaf" | "blossom" | "fruit"
  url, thumb_url
  source:        "gbif" | "wikimedia" | "inaturalist" | "curated" | "community"
  license, license_url, attribution, author
  status:        "approved" | "pending" | "rejected"
  created_by
}
```
**Fallback hierarchy** (first available wins): exact `species_key` media → genus/family
concept media → concept silhouette → `species_index.icon` (emoji) → generic leaf glyph.

**Licensing/attribution (hard rules):**
- Store `license` + `attribution` + `author` + `source` on **every** row; render attribution
  wherever the image shows (Treeasurus, cards, Add Tree).
- GBIF/Wikimedia: only ingest CC0 / CC-BY / CC-BY-SA with attribution preserved; **no bulk
  unlicensed import**.
- Community uploads: `status: pending` → steward moderation (reuse the refinement/review
  posture) before `approved`; EXIF-strip; never trust client-supplied license blindly.
- Storage: Supabase Storage bucket; lazy-load + `thumb_url`; cache by subject_ref.

## 9. Treeasurus relation
Treeasurus species pages remain **canonical** and untouched as truth. The library *enriches*
them: hero/leaf/bark imagery via `species_media`, names from `tree_species_names`, lore from
`tree_species_lore` (already its source). The library is the same data, surfaced more widely —
not a replacement page.

## 10. Species Concept relation
Concepts stay the human-facing bridge (`concept_exact` ≠ taxonomic exact). The library renders
concept entries with concept imagery/labels and **clearly marks them as broad** (genus/family/
hive/mythic). Concepts may carry a hero image (subject = `concept_id`) but **never** a
`species_key`.

## 11. Data Commons / research relation
Research/imported records resolve **toward** species keys where defensible (via `gbif-enrich`
+ resolver), else preserve the fuzzy label and attach a concept hint. Data Commons display
swaps raw formatted keys for resolver-provided labels (a read-only label resolver, PR 6).
No change to ingestion exactness rules.

---

## 12. Smallest safe implementation sequence (staged PRs)

| PR | Scope | Risk |
|---|---|---|
| **1** | **This design doc** | 🟢 none (docs) |
| **2** | `species_media` **types/config only** (TS types + role/license enums + fallback-order constant). No table, no UI. | 🟢 |
| **3** | Arborium **reads** concept/species image metadata via the read service (fallback to current); no UI rewrite. | 🟢 |
| **4** | Add Tree **suggestion enrichment** (read-only: badge exact-vs-concept, representative image, clue chips); save contract unchanged. | 🟡 |
| **5** | Treeasurus **species image fallback** (uses the fallback hierarchy; attribution rendered). | 🟡 |
| **6** | Data Commons **label resolver** (raw key → resolver label, read-only). | 🟡 |
| **7** | Community **image contribution proposal** (pending→steward review; licensing captured). | 🟡 (needs the table + moderation) |

Each PR: rebased, scope-verified, `typecheck/lint/test/build/e2e` green, reversible.

## 13. What NOT to build yet
- ❌ No new independent species table (the trunk = `species_index`; names/lore/concepts exist).
- ❌ No detached photo catalogue — imagery keys to `species_key`/`concept_id`/raw label.
- ❌ No Arborium or Add Tree rewrite — read-only enrichment first.
- ❌ No resolver behaviour change without tests.
- ❌ No schema migration in this doc PR (PR 7's `species_media` is the first, and only when approved).
- ❌ No Atlas / Quest Cave / Data Commons changes today (PR 6 is later + read-only).
- ❌ No fabricated exact species — "oak"/"willow"/"ancient elders"/"water-loving" stay concepts.
- ❌ No bulk/unlicensed image import; attribution is mandatory.
- ❌ Don't delete `treeSpecies.ts` — demote to fallback only.
