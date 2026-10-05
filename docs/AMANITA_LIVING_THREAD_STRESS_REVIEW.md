# Amanita / Fly Agaric schema stress review

Status: REVIEW / PROPOSED NEXT STEP. PR #77 remains draft. This pass adds fixtures, tests and this review only. No application or appearance JSON changes; no taxonomy binding, migration, historical-record edits, TETOL change, merge or deployment.

## Evidence inspected and limits

Inspected the PR #77 index, pure resolver, SELECT-only adapter, development-only UI and focused tests; existing species/Hive pages, offering-library repository and generated database types.

Original Council sources fetched read-only from the established Drive archive:

- [Council 124](https://docs.google.com/document/d/1wcqP0ZJjnMxDEp2J51--fIVNlItiRZT5WCAqiY0C71g/edit): 25 October 2022, Fungi: Amanita Muscaria.
- [Council 132](https://docs.google.com/document/d/1crnTIKzoV1S2yAgJ7k-0jE3dNWhSN8WyrudtjZBNEnY/edit): 21 December 2022, Fungi: Amanita Muscaria.
- [Council 139](https://docs.google.com/document/d/1h714EeoREedzC3IJLZls301MKGsPhESqSgKH_3cp48g/edit): 7 February 2023, Fungi: Amanita Muscaria.

These support a named companion listing in a specific Council role. They do not prove a field encounter, attendance, foraging, later use, efficacy or current scientific claims. Listed historical learning links were not evaluated as scientific evidence.

Drive metadata also identifies later copies, including Council 124 copy `1xqQQciy6uPeAlwNKP1ChaojeCHv5qUb8uQYCVz55pnM`, created 9 December 2024. Keep original and copy IDs intact. File creation is not event time; presumed content equivalence is not hash-verified equivalence. A copy must not automatically become another appearance or be destructively deduplicated.

The consolidated recovered Living Thread, original 2018 encounter/photo, detailed post-2022 field chronology, gathering/practice records and testimony were not located in accessible references during this pass. Fixtures mark the 2018 → gap → encounters from 2022 onward as USER CHRONOLOGY, not independently verified evidence. Gathering/practice/photograph/Birch/testimony scenarios have null dates and references. No day, place, person, canonical Amanita ID or Hive ID is invented. The shared subject in tests is explicitly a synthetic identity, never a production binding.

## 1. What PR #77 handles — WORKING

- Independent Circle/companion appearance keys; role and qualified outward subject reference in the source record.
- Repeated appearances can reference one subject without copying species or Hive knowledge.
- Representation and support remain separate reference lists; encounter reference and partial-documentation attestation remain distinct.
- Candidate / Pre-Fire / Harvest-null, provenance, consent and review visibility remain explicit.
- Exact tree → species key → species family → existing Hive resolution, with missing/error stops and no writes.
- Development reciprocal Council/tree review links; public projection suppressed and production pilot excluded.

## 2. What cannot yet be represented — PARTIAL / MISSING

The reference envelope can carry metadata, but flexibility is not validation or implementation. Production resolution only accepts `s33d / trees`; there is no fungal-subject adapter. The projection lacks the appearance's role and original subject binding. An unsupported bound subject returns UNRESOLVED, conflating an unsupported reader with an unresolved identity.

There is no event chronology, precision-aware temporal traversal, scoped assertion/evidence validation, testimony attribution or query-coverage/gap projection in this pilot. Do not add those domains as fields within Council Appearance.

Existing storage is relevant but insufficiently connected:

| Existing implementation | What it actually owns | Boundary |
| --- | --- | --- |
| `tree_checkins` | checked-in time, tree/user IDs, privacy, optional media/reflection, `fungi_present` boolean | A fungal-presence flag identifies neither Amanita nor an encounter with a specific fungal individual. |
| `offerings` | tree-bound media/content, author, visibility, optional `meeting_id` | Upload time is not encounter time; a photo or meeting link does not automatically constitute an appearance. |
| `library_sources` | source ID/name/type/URL/notes/user | No demonstrated scoped link from source to Amanita events or claims. |
| `species_index` / `species_hives` | existing species and family identities | Canonical Amanita and fungal Hive identities remain unverified here. |
| `seed_life_entries` | seed-specific growth and relationship notes | Not a general historical-event schema; do not repurpose it. |
| `offering-library.ts` | derived song/book views enriched from existing trees | Useful precedent for deriving a view without copying records. |
| `SpeciesPage` / `HivePage` | tree-oriented species/Hive surfaces and tree-owned offerings | Cannot promise that non-tree events already appear here. |
| `AmanitaFlush.tsx` | decorative SVG mushrooms/moss | Visual language, not a canonical being, evidence record or Living Thread. |

## 3. Minimum generic primitives — PROPOSED, not implemented

**Qualified reference with binding status.** Reuse the current reference envelope, but validate complete subject identity (provider + owner record type + stable ID, or an explicitly specified provider-owned key). Null/unverified bindings remain visible as unresolved. Keep species-level identity separate from fungal individual identity. Many appearances of one species do not establish that the same organism was encountered repeatedly.

**Typed reference view.** A query item carries its owner record reference and documentary kind: encounter, gathering, Council appearance, practice, relationship, source/artefact or testimony. This is a projection, not a universal stored Event row. Different domains retain their native payloads and relationships.

**Scoped assertion with provenance.** An explicitly stated predicate, qualified participants/roles, source reference plus locator, assertion basis (observation/document/testimony/etc.), verification state and subject identity certainty. `represented_by` and `supported_by` remain permanent separate edges. A source supports a specified statement, not everything linked from it. Ecological partnership needs its own evidence; co-presence stays co-presence. Preserve source-owned authorship, access, consent and any required redaction before emitting references or derived output.

**Time and coverage qualifiers.** Event time, record/publication time and retrospective testimony time are separate. Preserve date precision and unknown values; no synthetic 1 January for year-only dates. A coverage result says what sources/time range were inspected and whether reads were partial, inaccessible or complete for that inspected set. A documentary-gap marker describes lack of recovered evidence, not absence of encounters or confirmed biological continuity. Do not infer such gaps simply from permission-filtered empty queries.

These are small metadata requirements on adapters and missing reference assertions, not a new taxonomy, archive or database.

## 4. Schema pressure and contradictions

- `AppearanceProjection` drops `role` and `subject_binding`; future consumers cannot faithfully describe a non-tree appearance from that projection alone.
- `appearancesForSubject` can match two incomplete references with missing IDs. Tighten the comparison before it becomes a generic index.
- `appearanceKey` ignores provider qualification; sufficient for the one manifest namespace, not demonstrated safe across independent Council systems. Source-copy IDs and Council occurrence identity must remain distinct.
- The current scalar `encounter_ref` is an optional contextual link, not the total encounter history. Do not grow it into a universal event list or imply a Council appearance is an encounter. Null means no linked encounter evidence, not proof of no encounter.
- `RecordRef` and loose provenance objects allow extra properties but enforce neither scope nor attribution. Labels alone do not prevent unsupported promotions.
- Current species/Hive pages are tree-oriented. A successful future species lookup alone would not mean a truthful fungal Living Thread UI exists.
- Named fungi listings support Council roles; personal recollection supports testimony; an old learning link supports historical inclusion. None alone establishes current verified scientific knowledge.
- Some source times use BST on winter dates; record original wording and flagged ambiguity rather than silently normalising. No precise historical timestamp was generated.

No production change fixes these in this pass; tests pin the current limitations for review.

## 5. Should Living Thread be stored?

**Initially derive it.** Living Thread should be a read-only, provenance-preserving traversal over existing records and explicit reference links. Give the subject a view, not another identity or copied timeline database.

An index can store only missing relationship assertions where no owner currently holds that link. Source documents remain where they are. Durable snapshots, if later needed, can retain source references, versions and fingerprints; they are edition artefacts, not a second canonical event history. Snapshotting is not part of this proposal.

The test-only view demonstrates distinct kinds, repeated references, chronology qualifiers and unresolved outward slots. It does NOT demonstrate a working production query to places, people, ecological records or Hives; those adapters/bindings remain missing.

## 6. Smallest safe implementation proposal

Next approved slice: retain the existing Holm Oak behaviour while exposing role and subject binding in the projection, rejecting incomplete subject matches and separating unsupported-reader from unresolved-binding status. Confirm Council occurrence namespace requirements before changing the key. No historical record creation or Amanita binding accompanies those corrections.

Then inventory the recovered thread's exact owner IDs, source locators, dates/precision, permissions and canonical Amanita identity. Review one proposed read-only species-subject adapter that follows existing species/Hive ownership, plus one derived query of verified existing references. Do not deploy a general Event system, infer historical occurrences, create a fungi taxonomy record or force gatherings/practices/testimony into Council Appearance.

## Tests and modifications

Added only `src/tests/fixtures/amanitaChronologyStress.json`, `src/tests/amanitaChronologyStress.test.ts`, and this review. 19 stress tests plus the existing 13 pilot tests pass. Tests exercise repeated appearances, original/copy date separation, seven kinds, documentary gap, null dates/refs, all seven prohibited inference promotions, outward unresolved slots, public suppression and current projection/lookup/reader limitations.

The proposed derived-view helper exists only inside the test file. It performs no writes or automatic inference. Negative-inference tests verify the fixture/query contract, not a production claim-validation engine. Runtime appearance record, UI, readers, resolver and frozen publication remain unchanged.
