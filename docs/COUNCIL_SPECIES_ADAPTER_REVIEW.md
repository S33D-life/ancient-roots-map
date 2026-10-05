# Read-only canonical species subject adapter

Continues draft PR #77 from `ed95f2b1e`. No merge, deployment, database mutation, source migration, fixture promotion or frozen TETOL change.

## Implemented traversal

A complete BOUND_TO_EXISTING_RECORD subject reference `{ provider: "s33d", record_type: "species_index", id: <owning canonical ID> }`
→ generic `speciesById` reader
→ `species_index` SELECT of `id, species_key, slug, scientific_name, family`, filtered by exact `id`, `maybeSingle`
→ verify the returned ID equals the reference
→ projection `resolvedSubject` + `species`, status RESOLVED.

This branch stops at the owning species record. It does not query trees, species by name/key, or Hives. Missing records/mismatched IDs return SUBJECT_MISSING; errors return UNAVAILABLE. Unsupported/invalid/unresolved references still stop before any query. Older readers without `speciesById` remain valid and return UNSUPPORTED_READER for a species subject.

`resolvedSubject` is an additive qualified reference indicating only that its owning canonical record was read successfully. It does not attest to identification of a physical organism, encounter, claim truth, continuity, ecological relationship, representation evidence, consent or publication permission. Existing metadata is preserved without promotion. Public projection remains suppressed.

Holm Oak's exact tree → species key → family → existing Hive traversal is unchanged. Its projection additionally records the tree's qualified reference in `resolvedSubject` after the exact tree read succeeds. That field remains meaningful if an onward species/Hive link is missing; the existing traversal status still reports the missing link.

## Fly Agaric proving case: fixture PASS; live binding UNVERIFIED

The inline test-only case retains Circle 235 / `c235_flyagaric`, Fungi role, and a clearly synthetic canonical species ID. A second test-only Circle refers to the same ID. Neither becomes a production appearance, species row or historical occurrence. No existing fixture or Council copy is promoted.

Production read-only inventory using the existing public client access found:

- Exact `scientific_name = Amanita muscaria`: zero visible rows.
- Bounded case-insensitive scientific-name/key/common-name variants for muscaria, Amanita and Fly Agaric: zero visible rows.
- The adapter's exact-ID query shape was tested against a missing-record sentinel (never persisted): HTTP 200, empty result.

These findings do not establish global absence of a canonical record: access or another owning system may explain it. A verified owning system and stable ID are still required for a live Circle 235 binding. No alternative being was substituted and no record was created. Thus the implemented code and fixture traversal work, but live Circle 235 → canonical Fly Agaric traversal is not claimed as achieved.

## Tests

14 adapter tests cover exact-ID resolution, no tree/Hive lookup, no organism/encounter/consent/claim inference, repeat appearances to one canonical record, resolution without family metadata, query-free invalid/unsupported/unresolved/public paths, missing adapter compatibility, missing/wrong/error/exception results, and SELECT-only production adapter calls with all write methods forbidden.

Existing Holm Oak and integrity tests and the documentary-gap fixtures remain passing. Full release check passes: 45 files / 382 tests, typecheck, lint, security checks, duplicate and asset guards, and production build. The additional Holm Oak resolved-reference assertion also passes in the focused suite. Production JavaScript still excludes the review-only pilot.

## Schema pressure / extension boundary

No CouncilAppearance record field, subject-reference shape, production binding or namespace is changed. The reader gains one optional exact-ID method; the projection gains `resolvedSubject`. No adapter registry, universal Event model or species infrastructure is introduced.

Another owner adapter can be added without changing the Council Appearance primitive: validate its qualified owner reference, read that owner, and set `resolvedSubject` only after exact identity verification. Adding the reader dispatch and any typed display payload remains implementation work; this pass does not promise arbitrary providers already work. Species-specific data remains in the owning species record.

The unresolved Fly Agaric identity is the material remaining pressure. The name in a Council manifest is not a canonical ID. Source inventory/identity approval remains separate from successful reference resolution. Living Thread remains a derived traversal; documentary gaps remain documentary gaps.

## Files changed

- `src/lib/relationships/councilAppearance.ts`
- `src/lib/relationships/councilAppearanceReader.ts`
- `src/tests/councilAppearance.test.ts`
- `src/tests/councilSpeciesAdapter.test.ts`
- `docs/COUNCIL_SPECIES_ADAPTER_REVIEW.md`
