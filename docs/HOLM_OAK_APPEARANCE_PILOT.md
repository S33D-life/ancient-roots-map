# Holm Oak Council Appearance pilot — review only

Implemented on an isolated branch from main. No deployment or database mutation.

## Working traversal

Council `council-of-life/circle-235` / spatial companion `c235_holmoak`
→ appearance JSON
→ existing `trees` ID `924453c0-f4f5-4ed4-88fe-5b2ed6570af0`
→ its current `species_key` `quercus-ilex`
→ existing `species_index` ID `aa782ed4-1b80-46ff-890b-e3d30dd2383c`
→ its current family `Fagaceae`
→ existing `species_hives` ID `e5b8b38b-6b0b-4542-bec0-db119f89ac99`, slug `fagaceae`, Oak & Beech Hive.

These IDs and relationships were verified through production read-only GET queries on 5 October 2026. Only the Ancient Friend ID is bound in the appearance file. Species and Hive IDs are observations here, never new canonical relationships in the index.

## Review surfaces and consumption

Run `npm run dev`. `/council-of-life` displays the review projection; the existing Holm Oak detail page displays its reciprocal Council appearance link. Both were checked in the browser and returned RESOLVED. Production DEV gates eliminate the component and appearance JSON from built JavaScript. The existing public Council card is untouched; its correction remains separate PR #76.

TETOL is not changed. The pure resolver exposes a read-only review projection suitable for a future authorized consumer. Public audience returns null before any query. No public endpoint is introduced for this REVIEW_ONLY record.

## Provenance boundaries

`represented_by` references the existing illustration with its source path and SHA256; it is not encounter evidence. `supported_by` remains empty. The partial encounter retains a manifest reference and a dated status attestation, not reconstructed field evidence. Individual identification in the source manifest remains PROPOSAL, independently of TEOTAG's approved S33D binding. Chapter edition remains V4 CANDIDATE / PRE_FIRE / REVIEW_ONLY; harvest is null. Consent, visibility, identity approval, identification provenance and encounter documentation are separate states. No personal material or artwork is newly published.

## What the pilot teaches

1. A private source reference alone cannot render encounter status in the application. Added a minimal dated `encounter_state` attestation beside `encounter_ref`; no evidence payload is copied.
2. Approved subject binding must not silently upgrade the manifest's individual identification proposal. Added identification provenance reference/state explicitly.
3. Resolution depends on an exact existing species key and family-owned Hive lookup. Missing, ambiguous, inaccessible or mismatched records stop traversal without fuzzy matches or creation.
4. Future subjects need provider-specific readers after inventory. No Amanita reader or universal subject schema was implemented. Tests use synthetic fixtures to prove that distinct Council/companion appearance keys can refer to the same subject strand without a species-specific field or duplicate knowledge record.
5. REVIEW_ONLY requires a release boundary as well as a label. Public projection suppression and production bundle exclusion are verified.

## Validation

13 focused tests: identity reuse; dynamic onward relationships; representation/evidence separation; encounter and edition states; unresolved-safe and missing/error behaviour; reciprocal qualification; repeated Amanita structural fixtures; read-only adapter; development gates.

`npm run release-check`: PASS, 43 test files / 325 tests, typecheck, lint, security, duplicate and asset guards, production build. Existing bundle-size warnings remain. Production JavaScript checked for absence of pilot identifiers, component and artwork hash.

No species, Hive, Ancient Friend, encounter, library database, migration, frozen TETOL file, or unresolved companion was added or edited. No merge/deploy.

PR #76 remains an open, unmerged draft and isolated from this branch. Its GitHub CI fails during npm ci because the existing package manifest/lockfile are out of sync (including drizzle-kit, drizzle-orm and postgres). Its prior local verification is separate; deployment approval must acknowledge this blocker. No fix was folded into this pilot.
