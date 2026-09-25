# Atlas basemap recovery

Review branch: `codex/atlas-basemap-reliability`. No release or deployment authorized.

CARTO now requires a basemap key. Its API-key warning can arrive as a successful PNG, so Leaflet tileerror alone cannot detect it. See https://www.carto.com/basemaps/apikey/.

Set `VITE_CARTO_BASEMAP_API_KEY` in the build environment to retain the existing light CARTO style. This is a client-visible basemap key; restrict it to approved S33D domains through the provider. No key is committed or requested by this change. Without a key, or in bare-map mode, use the existing OpenStreetMap fallback directly. Production provider/configuration choice remains part of TEOTAG release review.

OSM uses its documented HTTPS hostname with linked attribution. It is a best-effort community service, not a production SLA. No prefetch, offline-download or cache-bypass feature is added. See https://operations.osmfoundation.org/policies/tiles/.

The controller listens before attaching the layer, tracks both primary and fallback requests, treats a settled all-error batch as failure, and bounds stalled batches to 12 seconds. A small viewport need not accumulate eight errors to recover. CARTO failure switches once to OSM; OSM failure exposes retry on the main map. A manual standard-map button also handles successful provider warning images. Basemap replacement leaves location, zoom, markers and filters intact. No location permission is required by this controller.

The loading screen dismisses on failure and uses map-background language rather than suggesting a location request. Error controls have a 44px minimum touch height. The global forest preview shares key/provider selection and attribution.

Validation notes are recorded with the review handoff. A pristine `npm ci` is currently blocked by missing drizzle/postgres dependencies in the upstream lockfile. The shared lockfile is deliberately unchanged; a local no-lockfile install is used for diagnostic validation and is not equivalent to a reproducible CI install.

## Validation (22 September run, reviewed 25 September)

- `npm run release-check`: completed successfully using the temporary no-lockfile dependency install, with `@testing-library/dom` installed locally to satisfy the existing test dependency. Typecheck, lint (0 errors; 176 warnings), security, duplicate and asset checks, 40 test files / 301 tests, production build and PWA generation passed.
- Five basemap regression tests cover keyless selection, a small failed viewport, fallback success/failure, retry, stalled requests, detached events and manual recovery from successful warning images.
- Public-data local browser checks: desktop 1280×720 loaded 24 OSM tiles with zero tile errors and markers present; mobile 390×844 loaded with no location grant. Attribution was verified above bottom navigation. Location-denial/timeout simulation was not performed; no geolocation behavior was changed.
- A development hot reload triggered the existing map error boundary (`_leaflet_pos`); a clean page reload rendered normally. Hot-reload lifecycle behavior is not certified by this patch.
- A valid CARTO key was not available, so keyed-provider success was not checked against the live service. Provider selection and recovery were tested with controlled events.
- No lockfile, generated Supabase file, shared navigation registry or research-promotion files were edited. A reproducible clean CI install remains blocked until the separate upstream lockfile issue is resolved.
