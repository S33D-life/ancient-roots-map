# TETOL 0.9.4 ↔ S33D bridge: comparison checklist

**25 Sep 2026 · OBSERVATION / PROPOSAL · for the next integration pass**

This is prepared on the S33D side **before** the real TETOL 0.9.4 source arrives. It
records what the experimental bridge in `src/tetol-bridge/` (PR #70) currently
assumes, so the comparison can be fast and evidence-based. Nothing here changes the
bridge. The bridge stays an **EXPERIMENTAL PROOF**.

---

## 1. What the bridge currently is (facts from code)

| Concern | Current bridge reality | Where |
|---|---|---|
| Entry points | `createBridge({url?, anonKey?})` → `{ data, registry, routeToSpatial, spatialToRoute }`; also named exports | `src/tetol-bridge/index.ts` |
| Standalone build | Vite library build → one ES module `dist-tetol-bridge/s33d-bridge.js` (not run yet) | `scripts/build-tetol-bridge.mjs` |
| Route registry | `SPATIAL_REGISTRY`: 7 explicit mappings + 13 derived from `HEARTWOOD_ROOMS` = 20 | `spatialRegistry.ts` |
| Spatial-address form | slash-separated string, no leading slash, `:param` segments, URI-encoded params, e.g. `heartwood/root-descent/cavern/friend/:id` | `spatialRegistry.ts` |
| Resolution | static segments beat params; query/hash stripped; unknown → `null` | `spatialRegistry.ts` |
| Friend contract | `AncientFriend` (§3 below) | `s33dDataAdapter.ts` |
| Provenance | `provenance[]` of `{ source: "supabase"\|"app-config"\|"notion"\|"chain", location, sourceId, revision }` | `s33dDataAdapter.ts` |
| Snapshot assumptions | **None.** The bridge reads live via the anon client only. No snapshot, fixture, fingerprint or offline fallback. | — |
| Auth / session | Own client: `persistSession:false`, `autoRefreshToken:false`, `detectSessionInUrl:false`, `storageKey:"s33d-tetol-readonly"`; `getWanderer()` always `null` | `readOnlyClient.ts` |
| Supabase usage | `.from("trees")` (explicit columns, `maybeSingle`, merge-follow ≤ 3 hops); `.from("staffs")` (`id, token_id, verified_at`) | `s33dDataAdapter.ts` |
| Read/write boundary | Read only. Tests assert no `insert/update/upsert/delete/rpc` calls. RLS as `anon` is the real boundary. | `__tests__/tetolBridge.test.ts` |
| Workbox | Not configured. Serving from `public/tetol/` would be precached by default (`**/*.{js,css,html}`) and caught by `navigateFallback` unless `/^\/tetol/` is denylisted (as `/patronsportal` is) | `vite.config.ts` |
| CSP | Production `_headers`: `script-src 'self'` (no `'unsafe-inline'`, no CDN). Any inline `<script>` or CDN `three` import in 0.9.4 would be blocked if served same-origin under those headers. `connect-src https: wss:` allows Supabase. | `public/_headers` |
| `/tetol/` serving | Assumed static folder + `_redirects` rules above the SPA catch-all, mirroring `/patronsportal` | audit §4–6 |
| Companion / Wand seam | Public Realtime broadcast channel `companion:<6-char code>`, no auth, 15-min TTL; command *types* whitelisted (`VALID_COMMAND_TYPES`), payloads not validated; includes `focus_tree`, `focus_staff`, `navigate_room`, `next`, `previous` | `src/hooks/use-companion-session.ts`, `src/lib/companion-types.ts` |

## 2. Known mismatch list (awaiting the real 0.9.4 source)

Evidence status: **B** = confirmed in the bridge code. **R3** = stated in Revision 3 /
Notion, not yet seen in 0.9.4 source.

| # | Topic | Bridge today (B) | Revision 3 / TEOTAG (R3) | Status |
|---|---|---|---|---|
| M1 | Individual Ancient Friend term | `friend` (`heartwood/root-descent/cavern/friend/:id`). "alcove" appeared only in two prose lines of the audit doc, now corrected | `friend`, not `alcove` | **Aligned in bridge.** Verify 0.9.4 uses the same full path, not just the leaf term. |
| M2 | Ancient Friends Room route | `/library/gallery` → `heartwood/gallery` (derived Heartwood room) | Ancient Friends sit **beneath** Heartwood: Heartwood → root descent → Cavern | **Mismatch.** Likely `heartwood/root-descent/cavern` |
| M3 | Research Forest record | `/tree/research/:id` **unmapped** | `outside-world/land/research/:id`; Research Forest is not a TETOL room | **Missing** mapping |
| M4 | Council | `/council-of-life` → `council-treehouse` | Council = Canopy | **Unverified**; compare the 0.9.4 address root |
| M5 | Council record | `/council/records/:id` → `heartwood/growth-rings/:id` | Council record → growth ring (brief); Council = Canopy | **Ambiguous**: memory (Heartwood) vs Canopy. TEOTAG / 0.9.4 decides |
| M6 | Greenhouse | `/library/greenhouse` → `heartwood/greenhouse` (derived) | Greenhouse is a live-app function with **unresolved** TETOL position | **Premature** in bridge; should be unmapped or flagged |
| M7 | Taproot | `/library/tap-root` → `heartwood/tap-root` (derived), access `advanced` | Taproot = curator/reviewer tooling | Address unverified; access level consistent with tooling |
| M8 | Commons | `/tree-data-commons` **unmapped** | Commons = dataset/shared-record tooling | **Missing** mapping |
| M9 | Staff Room | `/library/staff-room` → `staff-room`; access `member` (from `HEARTWOOD_ROOMS`) | Threshold roundhouse beside Tree ↔ Heartwood | Address plausibly aligned; **access level** differs from a public read-only intent |
| M10 | Crown | `/golden-dream` → `crown` | Crown = yOur Golden Dream | Plausibly aligned; check path form |
| M11 | Friend age fields | `estimatedAge`, `ageRange {min,max,confidence}`; **no** `age_source`, `age_exact` | Major Oak handshake preserves recorded age 1,000, description 800–1,000, empty range/source | **Missing** `age_source`/`age_exact`; bridge must not coerce empties |
| M12 | Photo status | `photoUrl` only; **no** `photo_status` | Handshake preserves photo status | **Missing** field |
| M13 | Snapshot provenance | none | Handshake has snapshot date, fingerprint/hash, source endpoint, access status, record status | **Missing** snapshot layer (bridge is live-only) |
| M14 | Raw vs adapted record | adapted only | Handshake keeps raw record + adapted record | **Missing** raw passthrough |
| M15 | Staff identity | exploratory `staffIdentity.ts` normaliser | Canonical code **OPEN** (dedicated identity audit); Origin 144 settled | Do not use the normaliser for production identity |
| M16 | Companion payloads | untrusted, unvalidated ids | Wand = navigation intents only | Any Wand intent must resolve through the registry; never trigger writes |

## 3. Bridge `AncientFriend` contract (for field-by-field diff)

`kind, id, name, species, speciesKey, latitude, longitude, nation, estimatedAge,
thumbnailUrl, canonicalRoute, spatialAddress, provenance[], state, bioregion,
ageRange{min,max,confidence}, girthCm, description, lore, what3words, photoUrl,
externalSource{name,url}, locationConfidence, mergedFrom`

Columns read (`trees`): `id, name, species, species_key, latitude, longitude, nation,
state, bioregion, estimated_age, age_min, age_max, age_confidence, girth_cm,
description, lore_text, what3words, photo_thumb_url, photo_processed_url, source_name,
source_url, location_confidence, merged_into_tree_id, updated_at`.

Deliberately **not** read: `created_by`, `access_notes`, `metadata`, `photo_original_url`.

## 4. Comparison checklist (run as soon as 0.9.4 source is in a repo)

**Integrity first**

- [ ] Verify the package manifest hashes; confirm frozen builds are byte-identical before any comparison. Touch nothing frozen.
- [ ] Record the 0.9.4 build entry point, how it is rebuilt, and whether the rebuild is deterministic.

**Addresses (M1–M10)**

- [ ] Extract every spatial address 0.9.4 emits or accepts (from `tetol-routes.js` or equivalent) into a flat list.
- [ ] Run each through `spatialToRoute()`, and each app route through `routeToSpatial()`. Diff both directions.
- [ ] Confirm the full Friend path (`heartwood/root-descent/cavern/friend/:id`), not just the leaf.
- [ ] Mark each of M2–M10: aligned / bridge wrong / 0.9.4 wrong / TEOTAG decision.

**Friend contract (M11–M14)**

- [ ] Diff 0.9.4's Friend type against §3, field by field (name, type, nullability).
- [ ] Take the Major Oak snapshot's raw record; confirm the bridge column set can reproduce every raw field 0.9.4 uses, and list the gaps (expected: `age_source`, `age_exact`, `photo_status`).
- [ ] Confirm uncertainty survives adaptation: 1,000 recorded vs 800–1,000 in the description; empty range/source stay empty (no coercion, no default).
- [ ] Compare provenance: 0.9.4 snapshot fields vs bridge `provenance[]`. Decide whether snapshot provenance lives in the bridge or stays in TETOL.

**Adapters**

- [ ] Locate 0.9.4's snapshot adapter and live-adapter seam. Confirm the live seam could accept `createBridge().data.getAncientFriend` without changing the scene code.
- [ ] Confirm 0.9.4 never creates a session-reading Supabase client and never parses auth fragments.

**Delivery constraints**

- [ ] List every `<script>` in 0.9.4: inline? CDN? Record what must change for `script-src 'self'`. Record only; do not change it.
- [ ] Measure total asset weight and peak texture memory for the Roots slice on one phone.
- [ ] Note whether 0.9.4 registers its own service worker (a conflict with the app SW scope `/`).

**Wand**

- [ ] Map 0.9.4 navigation intents to `CompanionCommand` types. List the intents with no equivalent (e.g. look/approach/enter/choose/back/return-to-tree).
- [ ] Confirm every intent resolves through the registry and none can trigger a write.

**Output**

- [ ] One diff report plus a proposed smallest seam (files and lines) for ONE real Major Oak record: S33D data layer → bridge → actual 0.9.4 source. No auth change, no deploy.
