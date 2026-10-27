# Atlas #123 — read-only recovery evidence and review gate

26 October 2026. Baseline main/editor: `4b00112206296d66d465557480d10283575b19bb`. Technical candidate only; no merge, Publish, Lovable AI, deployment or backend/data action authorised here.

## Confirmed cause and environment

The published browser's observed resource inventory includes:
`https://mwzcuczfedrjplndggiv.supabase.co/rest/v1/rpc/public_atlas_country_stats`.
This independently identifies the app project as `mwzcuczfedrjplndggiv`; it is not the inactive connector project `ncrtxpopkttxvnynzhwe`. Repository fallback config agrees, but the fallback was not used as proof of runtime identity. The observed main entry script was `/assets/index-DvIs_MPl.js`; editor/main equality alone is not proof of a particular served build or absence of a stale service worker.

Anonymous requests using the existing public anon configuration returned HTTP404/PGRST202 for `public_atlas_country_stats` with `country_filter:null`, `Costa Rica`, and `Peru`. The exact signature is unavailable in the public API schema cache. The request reached the correct project, and CORS allowed `https://www.s33d.life`. Direct public research reads succeeded. This is not evidence that the records disappeared or that a database was paused.

The Supabase connector only exposes the inactive legacy project, so it was not used as a substitute. A subsequent authorised SELECT-only inspection through the existing Lovable project cloud connection returned no pg_proc entry named public_atlas_country_stats in any schema. The migration history table exists but has no version20260528093000, the repository migration defining this function. This confirms the linked cloud database is missing the aggregate, rather than merely a country-name mismatch. It does not establish why the migration was never recorded or whether any out-of-band history changed. research_trees has RLS enabled and SELECT grants for anon/authenticated, and linked-cloud counts match public17/18 reads. No function, migration, grant or policy was changed.

The hook throws the RPC error; WorldAtlasPage discards that state and creates zero-valued registry cards/totals. CountryPortalPage initially renders zero tiles while loading, and previously suppressed direct-read failures. These code paths reproduce the misleading zero state. In the published signed-out browser, settled `/atlas/costa-rica` and `/atlas/peru` already load17/18 rows via their separate direct read; global Chapters stays zero. Signed-in production and native iPhone behavior were not independently exercised by Codex.

## Research found — public anon scope, no privileged access

| Country | Public research rows | Distinct scientific/common identities by existing aggregation | Stored source groups |
| --- | ---: | ---: | --- |
| Costa Rica | 17 | 14 | 10 Central America research citation;7 SINAC citation |
| Peru | 18 | 12 | 10 South America research citation;8 SERFOR citation |

Exact filters `country=eq.Costa Rica` / `country=eq.Peru` succeeded. Case-insensitive contains checks returned35 rows with these exact country spellings and no observed padding. Country-name mismatch is not the current cause. Public global `research_trees` count was1946 at inspection; this is a live snapshot, not a hard-coded expectation.

Source URLs retained: `https://s33d.life/research/central-america`, `https://s33d.life/research/south-america`, `https://www.sinac.go.cr/`, `https://www.gob.pe/serfor`. These are stored citations, not newly verified evidence or authenticated field encounters. Counts are rows/candidates, not deduplicated individual trees. No record was recreated, backfilled, deduplicated, converted or rewritten.

Historical seed definitions remain in `supabase/migrations/20260304204137_d54402e0-4c94-468f-8c5b-eaea232c8c37.sql`: ten Costa Rica and ten Peru candidates using the earlier research citations. The live source groups retain ten rows each under those citations. All10 scientific-name/citation pairs per country match the historical definition multiset on readback. This is evidence of continuity, not proof every field/date/UUID equals an original insertion. The additional7/8 rows exist with SINAC/SERFOR citations; their author/import history was not reconstructed from inaccessible admin logs.

`research_trees` supplies the hook/World Chapters and direct CountryPortal list. Rootstones are separate static candidate/grove markers: `loadRootstones.ts` prefers a nonempty `generated/*.json` payload over the local TypeScript fallback as a whole, not a merge. Current generated Costa Rica has1 tree/1 grove; Peru1 tree/0 groves. This explains why larger local fallback definitions are not all shown. Neither the generated markers nor the local fallback generators are evidence of mapped Ancient Friends or verified visits. Rootstones files/precedence and real `trees`/encounters remain unchanged.

## Bounded frontend correction

- Keep the existing RPC when it succeeds; validate its payload rather than converting null/malformed responses to empty.
- On PGRST202 only, aggregate the existing public research rows under the caller's existing permissions. Stable ID ordering,500-row pages, exact totals and a50,000-row guard avoid silently truncating counts. Reject failed, incomplete or changed-total reads. Current1946-row public scope requires4 pages.
- Read only existing public research columns needed for counts. Do not read mapped `trees`, offerings, private family records or verification tasks. Missing verification-task metrics/confidence remain Unavailable, not fabricated0/0%.
- Canonicalise known country spelling/case in the frontend; use exact-pattern case-insensitive country reads. No country values are rewritten in the database.
- Country read failures clear stale rows, show an alert and retry; loading/error states suppress derived zero tiles, species/map/province surfaces and false empty lists. Successful independent country reads remain usable if summary retrieval fails.
- Label links as linked records rather than equating them with verified encounters. Preserve all source links, approximate precision and candidate identities. No static seed substitution.

Regression coverage: nonzero RPC; confirmed empty; malformed/null; missing RPC recovery; permission/network failure; multi-page reads; changing totals/partial failures/limits; country case; UI320/390/1280px; retry; readable country records despite summary failure. Browser fixtures never perform real verification/auth/data writes. Exact final counts/checks/commit are recorded separately with CI evidence.

## Native iPhone test plan — after separate human release GO

1. Record the served version/build and test Safari signed out at `/atlas`, `/atlas/costa-rica`, `/atlas/peru`. Allow retrieval to finish; loading must not claim zero.
2. Compare Chapters and country counts against a fresh public read (snapshot17/18, not permanently hard-coded). Open source citations and confirm records retain research/approximate labels. Rootstones must not be counted as research rows or visits.
3. Temporarily go offline using the device's normal controls; reload/retry. Expect unavailable/retry, not0 research records or an empty-archive claim. Restore connectivity and Retry; records should return.
4. Repeat with Ed's ordinary signed-in session; no new role, auth or RLS changes. Report any permission-dependent difference. Do not press Verify or create offerings/records as part of this acceptance.
5. Check320/390px layout, touch scrolling, links, tab transitions, slow loading and stale-service-worker/update state. Verify the served hash/version after any explicitly approved publication. CI/mobile emulation is not native iPhone acceptance.

## Decision required

Conductor review/GO for the frontend PR and subsequent release process; no Publish here. A future reviewed backend decision could consider the missing aggregate migration, but applying it is not authorised here. Any backend deployment, migration, record reconstruction or permission change needs its own explicit GO and reviewed evidence. No reconstruction is justified by the current findings.

CI-only verification allowance: the initial browser job passed all11 new Atlas cases but hit its12-minute deadline after approximately7minutes of Ubuntu font/dependency installation and the existing shared-tree suite. Retrying did not remove the slow cold-worker setup. The browser job budget is raised to20minutes so the full required suite can complete; no test assertion, test selection, production behavior or permission is weakened.
