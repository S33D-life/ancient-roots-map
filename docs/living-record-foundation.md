# Living Record Spine · foundational contract

10 October 2026. Branch `codex/living-record-foundation`, based on the preserved exterior lineage `727861888b652e271b7379d0e066fe66242cb550`. This is an independent application-contract candidate, not an integrated release of that lineage or Circle 236.

## A · Implemented contract

| Primitive | Owner / fields | Implemented behaviour |
|---|---|---|
| Identity reference | Existing source namespace + existing UUID; exact species key for taxonomy | `IdentityRef`: Notion source, species-index species, trees individual. No new IDs minted. |
| Identity descriptor | Source adapter | Scope, label, scientific name, same durable reference. No content registry or publication state inferred. |
| Relationship | Supplied relation + evidence references | `species-strand`: genus → species; `individual-of-species`: species → individual. Endpoint resolution and scope validation; no derivation from tags or co-presence. |
| Appearance | Context owner | Appearance ID, context ID, identity reference, optional context note/artifact reference/order, typed return. No taxonomy/lore payload. |
| Return context | Source owner | Known route kind, realm, context ID, appearance ID, mode and optional focus ID. Strict parsing; no arbitrary URL or selector. |

`recordIdentity.ts` resolves references through injected source adapters. It rejects missing adapters, missing/private records, wrong source/ID, altered opaque species keys and species/individual scope substitutions. It does not copy the authored knowledge into another store.

`contextualReturn.ts` carries an identity-opening intent `{ identity, returnContext }`; parses a strict appearance; validates return against a source-registered appearance; constructs the existing internal `/council-of-life` or `/tree/:id` route; and restores a registered DOM focus target after the destination mounts. The optional `recordReturn` query transport round-trips validated context for refresh; parsing alone never establishes access or source availability.

An appearance source must return only contexts available to the viewer under existing access rules. Context parsing is navigation, not permission. Artifact references do not imply approval. Relationship evidence fields are references, not independently verified scientific claims. Those duties remain with the owning source/editorial boundary.

## B · Birch remains distinct

```text
Birch / Betula
  source: notion / 3f315b58-480d-814c-a056-cb6c7b4f7f33
  scope: genus
       │ supplied species-strand relationship
       ▼
Silver Birch / Betula pendula
  source: species-index / 496f464d-7f8e-4501-8313-f638a8498550
  exact stored key: betula-pendula
  scope: species
       │ supplied individual-of-species relationship
       ▼
Mapped individual tree / its existing trees UUID
  scope: individual
```

The non-public fixture references these existing identifiers and a test Circle `council-of-life/circle-999999`. It never creates a Circle 236 record. The genus descriptor is a test source response, not publicly approved Library prose.

Encounters remain separate existing `tree_checkins` / `meetings` / `offerings` records where applicable; the applicable existing ownership/review contract must be established before adding their source adapters. There is no automatic conversion from a mapped individual or recorded event into a recognised Ancient Friend. This foundation deliberately does not implement recognition or broaden authority.

## C · PLANeTary resolution and its remaining boundary

Broad resolution is now a reusable source-adapter contract: pass a durable source reference, obtain that source's descriptor or STOP. Birch has no conditional in the resolver. A missing broad adapter does not fall through to Silver Birch.

**Not implemented:** a live Notion reader/publication adapter, a broad-identity URL/page, or Council UI consuming this contract. The existing `/library/life/:speciesKey` route and chapter gates remain species-specific. No unregistered public broad route or dead doorway was added. The next projection must supply an access-filtered adapter and route/view binding rather than copying the Notion seed into a new local canonical record.

## D · Return proof

- Legacy `originType=ancient-friend&originId=<UUID>` parsing and routes are unchanged. `treeReturnContext` bridges that legacy shape into the new contract; the parameter's historical name grants no Ancient Friend status.
- Missing/unavailable tree returns still fall back to the Hall/Library.
- Council return requires an available matching appearance, context and mode. Focus is taken from the registered appearance rather than an incoming focus override.
- Non-public React MemoryRouter harness: context → shared genus → species strand → mapped individual → genus → exact context/focus. It is a test, not shipped Council UI.
- Browser exercised context transport + focus using an ephemeral test-only DOM target; no route or record was created.
- Existing Library → exact tree return passed keyboard activation, browser Back and refresh in the local candidate.
- Spatial mode is represented and validated in contract tests. Restoring an actual 3D scene remains the existing renderer/context owner's responsibility; no new scene-state engine or 3D Birch portal was built.

## E · Tree query and classification

Current production query requests `trees.country`; anonymous response is HTTP 400 / PostgreSQL 42703, column does not exist. The inspected candidate lineage used `country:nation`. The established schema and public response have `nation`. The candidate now selects `nation` directly and displays it directly. A read failure/loading state is distinct from an empty relationship; displayed counts say “shown” because this is a limited projection, not a total counter.

| Existing UUID | Classification | Evidence / treatment |
|---|---|---|
| `abb025be-1ea7-48be-8a21-d7daf90e4c21` | Public mapped tree; witnessing/recognition uncertain | Birch; exact betula-pendula key; public access; ordinary what3words; displayed conservatively as mapped |
| `0520dea0-6385-411f-a55a-6f8f9182d9b9` | Public mapped tree; witnessing/recognition uncertain | Silver Birch; same exact key; public access; ordinary what3words; displayed conservatively as mapped |
| `a6470bac-a114-4bd6-bc04-d51de580445f` | QA/test seed | Name `QA Test Birch #6` plus reserved `test.qa.birch` marker; excluded from this public relationship projection |

All three returned empty metadata objects and null source-name/source-ID fields. QA classification uses the **two corroborating markers written by the existing DevQAPanel seeder**, not name alone, a Birch UUID allowlist, or an invented metadata flag. The predicate works for all its seeded species. Unknown/unmarked rows are not silently classified as test records. No row was deleted, merged or altered; Map-wide QA cleanup is out of scope. Client-side filtering after the existing limit can underfill the projection; pagination remains future work.

The existing Library arrival sentence was corrected from “an Ancient Friend” to “a mapped tree.” Its exact species route, gates and return stayed intact. This avoids claiming recognised relationship from mere origin availability.

Selection/filtering follows the existing Supabase read API ([official select reference](https://supabase.com/docs/reference/javascript/select)); the authoritative column evidence came from local generated schema and anonymous live GET verification. No SDK change was introduced.

## F · Database

**No schema changes, migrations, data writes, authority changes or automatic promotion.** Circle 236's manifest remains private/preparation and untouched. No Circle history, Heartwood record, Scroll, Harvest or Crown signal was created.

## G · Exact changed files

1. `src/lib/library/recordIdentity.ts` — source-backed identity and narrow relationship contracts.
2. `src/lib/library/contextualReturn.ts` — appearance, validated return, transport and focus primitives.
3. `src/lib/library/relatedTrees.ts` — corroborated existing QA-seed predicate.
4. `src/hooks/use-treeasurus.ts` — actual nation field, QA exclusion, new query-cache revision.
5. `src/pages/SpeciesPage.tsx` — loading/error distinction, conservative shown count, nation display.
6. `src/pages/library/LibraryLifePage.tsx` — one mapped-tree wording correction.
7. `src/tests/livingRecordContract.test.tsx` — private contract/journey harness.
8. `src/tests/relatedSpeciesTrees.test.tsx` — query/QA/failure tests.
9. `src/tests/speciesTreesQuery.test.tsx` — existing test aligned to actual nation column.
10. `src/tests/libraryBirchSlice.test.tsx` — mapped-tree claim regression assertion.
11. `docs/living-record-foundation.md` — this review.

Local review screenshots are in the ChatGPT workspace at `output/living-record-foundation-20261010/screenshots/`: mapped-tree states at 1440, 390, 320 and Night Grove/reduced-motion 320. They document the local projection fix, not a public Circle 236 feature. Screenshots and generated build artifacts are not committed.

## H · Verification

Focused suite: 4 files / 37 tests passed, including existing exact-key Library gates and tree returns. Full release-check passed: typecheck; lint (0 errors, 180 existing warnings); static Council/share guards; security; duplicate and asset guards; full unit suite (83 files / 618 tests); production build. Existing React Router/act/Browserslist/Tailwind and bundle-size warnings remain. No dependency or lockfile changes.

Browser: direct exact-species URL; corrected full query returns successfully; two mapped links retain their original UUIDs; QA excluded; no horizontal overflow at 1440/390/320; Night Grove + reduced motion at 320; existing Library keyboard return, Back and refresh; simulated GET failure shows error, not empty state; ephemeral context transport/focus succeeds.

External non-GET/HEAD/OPTIONS requests remained blocked throughout browser testing. No authenticated submissions tested or claimed. Development server's pre-existing service-worker MIME warning also occurs in the read-only baseline; simulated failure responses are expected. No new unexpected page exception was observed. Full product accessibility and spatial Council behaviour are not certified by contract tests.

## I · Future Circle 236 consumption — not live today

```text
Legitimately opened Circle 236 source
  → appearance {existing Birch source ref, Circle context, artifact ref, return}
  → identityOpening(appearance)
  → access-filtered broad source adapter + shared PLANeTary view
  → evidenced species-strand relation to Silver Birch
  → existing exact-key mapped tree projection
  → preserved return context
  → source validates Circle appearance
  → existing Council host restores mode / appearance / focus
```

The 2D and framed 3D entrance must pass the same identity reference. Neither owns genus knowledge. Their modes/context may differ. The source must legitimately expose Circle 236 before any live consuming UI is wired. No assumption that preparation content is published.

## J · High-leverage findings

- Broad identity resolution and exact taxonomy resolution can coexist; a route must never substitute one for the other.
- A return token needs both structural validation and an available source-owned appearance. Syntax alone is insufficient.
- Source updates flow through the same reference; appearances need not maintain copied knowledge.
- Public access to a tree row does not prove a witnessed Ancient Friend relationship.
- Error and absence must remain distinct: the former false zero concealed existing exact-key relationships.
- Artifacts and contextual notes need their own provenance/editorial boundary; the contract cannot turn their existence into factual approval.

## K · Next safe step — recommend only

Bind one **private** broad-identity source adapter and shared reader to the established Birch Notion reference, using the existing approval boundary. Then have a legitimately available Council preparation source supply one appearance and consume the return contract. Prove 2D first; add the existing framed-3D host adapter only after that identity and source availability are stable. Do not populate the runtime Circle manifest merely to unblock a demo.

Protected candidates remained clean at their exact commits: Roots `3b8faa304e513ecd5a16a68bc38967c9f8cf089a`; accepted Crown `59be9c418ce2992e996f2a7ceeb754c8e86c7314`; exterior continuity `727861888b652e271b7379d0e066fe66242cb550`. No Canopy/Heartwood candidate, realm renderer, Circle manifest or production code was modified. Shared main checkout's concurrent work was left untouched.

Human entrance clarification received during this pass: Current Tree / Blueprint entrance is `/s33d`; Crown entrance is `/golden-dream`; a separate canonical Blueprint document remains unset. Recorded here only; no protected Crown/navigation candidate was changed.
