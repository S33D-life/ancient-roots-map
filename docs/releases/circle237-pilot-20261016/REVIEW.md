# Circle 237 · Noku + Fly Agaric local portal pilot

16 October 2026 · Private local candidate · Publication HOLD

## Scope / source

Base: `9503b07d38ba852fc9fb44f461568a9b65fee9a3` (main inspected for the 16 October integration handoff). New local branch `codex/circle237-portals-pilot-20261016`. No merge of #97, archive or security branches. No push or hosted environment interaction.

The preview is a separate Vite entry and distribution, not an added production route. It reuses main's `IdentityRef`, `ContextualAppearance`, validated return-context schema and identity-opening tests. It avoids App.tsx, the signed-in app shell, shared current-Circle projection and all Supabase clients. No new dependencies or asset bytes. No environment values, public directory copies, service worker, storage or auth. The preview CSP denies connection requests; external artifacts are references, not embedded content.

## Implemented

- Ten appearances and categories, with text portraits and proposed plaque text preserving the supplied name/category/yOur Blooming Week/Council237 structure. Exact engraved lettering awaits intake verification; no claim of byte-faithful transcription without the portraits.
- Noku: one existing `trees:59eb1fe8-3c29-4696-ae00-f42edeb1c886` identity. Cape Town Noku remains distinct from Camp Unicorn; 234 remembered, 237 proposed. No new Atlas record. The local Library projection retains the identity and Atlas path but deliberately does not fetch the live page.
- Noku twin: existing artifact reference retained, explicitly experimental; not loaded, surveyed or used as documentary evidence. Permissions remain pending.
- Fly Agaric: one existing `notion:22a15b58-480d-8027-bf5f-ce0841334f10` Library reference, provisional237 appearance, unresolved taxonomy binding. No private Notion navigation or consumption instructions. Health/toxicity/cultural claims held for editorial review.
- Dated proposal: 16 October2026, guardian source date23September2026. No Council gathering date, physical encounter or Fire invented.
- Two simple clickable geometric presences plus blank doorway frames. Models/frames dispatch the same companion action. These are a separate local spatial study, not modifications to the live TETOL chamber or copies of missing portraits/twin geometry.
- Encounter → enduring identity projection → future Heartwood pathway → exact Council/companion/mode return. Back and refresh supported through local query state. Only two registered companion keys can resolve; user-supplied URLs/private IDs do not grant access.
- Heartwood is clearly future and non-saving; no offerings backend or family memory integration.

## Exact file inventory

```
.gitignore
review/circle237.html
vite.circle237.config.ts
playwright.circle237.config.ts
src/review/circle237/registry.ts
src/review/circle237/SpatialCouncil.tsx
src/review/circle237/main.tsx
src/review/circle237/pilot.css
src/tests/circle237Pilot.test.ts
e2e/circle237-pilot.spec.ts
docs/releases/circle237-pilot-20261016/REVIEW.md
```

No pre-existing application source, assets, historical Council data, shared route table, backend, permission, auth, Storage or Edge Function source is changed. The only edited existing tracked file is .gitignore (pilot output exclusions). Ancestral Roots3.1 and the separate archive branch remain untouched.

## Reproduction

Use the repository's existing lockfile/dependencies in a disposable local worktree; no hosted credentials are required.

```
npm ci
npm run release-check
npx vite build --config vite.circle237.config.ts
npx playwright test --config playwright.circle237.config.ts
npx vite preview --config vite.circle237.config.ts
```

Preview: `http://127.0.0.1:4237/review/circle237.html`
Spatial: `http://127.0.0.1:4237/review/circle237.html?mode=spatial`

Loopback only, not publicly deployed or accessible directly from another phone. Stop the preview with Ctrl-C in its terminal. Browser tests use this production-built separate distribution. Do not serve the standard dist as if it included this entry: the ordinary app build remains separate.

## Verification and limitations

Seven Chromium browser tests cover320/390/1440 layouts, both enduring identities, missing art, external-request absence in text journeys, reload, offline already-loaded navigation, malicious/unregistered IDs, spatial model/frame selection, true touchscreen API events in a mobile context, return focus, Noku twin reference and future Harvest.

A preliminary test used an offscreen canvas coordinate after focus restoration; fixed by scrolling the target into view. A subsequent valid frame tap exposed a real local pilot ghost-click: pointerup navigation replaced the DOM before the touch-generated click, activating Return. Changed the canvas to completed-click navigation. The same frame-touch test then passed. Failed traces/screenshots retained alongside final evidence, rather than discarded.

Unit contracts cover unique roster, stable identity across modes, validated return state, unknown identity rejection, no Fly→Noku twin crossover and source/editorial boundaries. Full repository release-check additionally covers existing Council static/share guards, typecheck, lint, security, duplicates, assets, unit tests and normal application build. Observed final results: release-check PASS; 543/543 unit tests across72 files; typecheck PASS; lint zero errors (184 warnings, including one entrypoint Fast Refresh warning); security/duplicate/asset/static/share guards PASS; normal and isolated builds PASS; pilot Playwright7/7 PASS. Exact logs are preserved in the accompanying evidence receipt.

Native iOS/Android, screen readers, low-end GPU performance, live Atlas visibility, source permissions and actual existing TETOL-room integration are NOT TESTED. Offline cold entry is not provided: this private preview intentionally registers no service worker. Offline in-memory navigation is tested only after load. A WebGL-unavailable device receives readable text doorways. No claim of live RLS/security verification follows from these local tests.

Pilot JS is about665KB uncompressed /178KB gzip because it includes Three.js; Vite warns about chunk size. It is outside the normal app bundle. Before production integration, measure native-device performance and consider loading Three only for spatial mode.

## Review / next gate

Review the two journeys and text/identity distinctions first. Exact ten portraits, Noku guardian and twin permissions, botanical/taxonomy reconciliation, public-safe editorial approval, real-device acceptance and scoped integration into existing TETOL/Library routes remain open. No broader eight-companion implementation follows automatically.

Next GO requested only after review: approve a specifically scoped follow-up for any observed corrections and/or exact-artwork intake. Push, production integration, canonical records, offering saves, lifecycle changes and publication each remain separately gated. No release GO requested by this candidate.

## Recovery

Stop the local server; remove the isolated worktree after preserving its commit/evidence. No production rollback or data recovery is required because no production state changed. The candidate is not suitable for copying wholesale into production: the standalone entry must remain private until a later explicit integration/publication decision.
