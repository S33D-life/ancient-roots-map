# Atlas basemap recovery

Review branch: `codex/atlas-on-auth-release`, based on frozen #74 `b9a590998ebbba5183a285b4766b66c6e4679cd1`. Source is only the eight-file #69→#68 Atlas diff; no #69 ancestry is imported. No release or deployment authorized.

CARTO now requires a basemap key. Its API-key warning can arrive as a successful PNG, so Leaflet tileerror alone cannot detect it. See https://www.carto.com/basemaps/apikey/.

Set `VITE_CARTO_BASEMAP_API_KEY` in the build environment to retain the existing light CARTO style. This is a client-visible basemap key; restrict it to approved S33D domains through the provider. No key is committed or requested by this change. Without a key, or in bare-map mode, use the existing OpenStreetMap fallback directly. Production provider/configuration choice remains part of TEOTAG release review.

OSM uses its documented HTTPS hostname with linked attribution. It is a best-effort community service, not a production SLA. No prefetch, offline-download or cache-bypass feature is added. See https://operations.osmfoundation.org/policies/tiles/.

The controller listens before attaching the layer, tracks both primary and fallback requests, treats a settled all-error batch as failure, and bounds stalled batches to 12 seconds. A small viewport need not accumulate eight errors to recover. CARTO failure switches once to OSM; OSM failure exposes retry on the main map. A manual standard-map button also handles successful provider warning images. Basemap replacement leaves location, zoom, markers and filters intact. No location permission is required by this controller.

The loading screen dismisses on failure and uses map-background language rather than suggesting a location request. Error controls have a 44px minimum touch height. The global forest preview shares key/provider selection and attribution.

## Candidate validation — 1 October 2026

- Standard `npm ci` on Node 20.20.2/npm 10.9.9 passed. The #74 package manifest and lockfile are unchanged.
- `npm run release-check` passed: 47 files / 356 tests, typecheck, lint (0 errors / 178 warnings), security, duplicate and asset guards, production build and PWA generation. This includes the frozen auth callback regressions.
- Config-churn guard passed.
- Six controlled Atlas browser tests cover Chromium and WebKit 26.4 at 1280×720, 390×844 and 844×390. They exercise forest nodes and tree markers surviving failure/retry, map position, zoom, selected-tree popup and species-filter preservation, failure copy, loader dismissal, keyboard retry, attribution presence, and location denial/timeout. External traffic is intercepted and service workers blocked.
- The main-map failure banner sits above active filter rows so they cannot intercept Retry.
- The forest preview now announces terminal background failure and offers a 44px retry control outside the map. Only the tile layer is replaced; region nodes remain available.
- Existing welcome/trail overlays can obscure mobile controls. Tests dismiss those existing overlays before exercising Atlas; this candidate does not repair onboarding.
- Existing route smoke tests now block remote writes/RPCs/Edge Functions: tree-detail otherwise records a production page view. This is test-only protection for the production-data freeze.
- Screenshots use fixture tiles to test lifecycle behaviour, not certify live-provider availability. Actual iPhone Safari, installed PWA, live keyed CARTO, and production rollout remain separate gates.
- Exact immutable SHA, smoke/CI results and evidence are recorded in the TEOTAG handoff rather than embedded here.

The legacy MapLibre raster configuration in `src/config/mapbox.ts` now selects OSM for missing/blank keys and preserves keyed Voyager for future use. Its source/layer IDs and optional MapTiler path are unchanged. No current consumer of that module was found; configuration regressions cover it directly.

`e2e/atlas-pwa.spec.ts` performs an opt-in local origin swap from a separately built frozen baseline to the candidate (`ATLAS_BASELINE_DIST`). Its server enforces a local-only CSP, including for service-worker requests. `ATLAS_LIVE_TILES=1` separately enables one normal OSM viewport with all non-tile external traffic intercepted. Final results belong in the exact-SHA handoff.

No auth, invitation, database, policy, deployment, TETOL or Public Read Contract implementation changes are included. Build-generated MCP drift is excluded.

Many surfaces. One lineage. One living reality.

Create once. Relate infinitely.
