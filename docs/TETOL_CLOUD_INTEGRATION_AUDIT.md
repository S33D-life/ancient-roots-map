# S33D / TETOL — Cloud Integration Architecture Audit

**25 Sep 2026 · for TEOTAG · status: OBSERVATION / PROPOSAL — not canonical**

Labels used throughout: **LIVE APP** (in `main` of `S33D-life/ancient-roots-map`),
**3D PROTOTYPE** (TETOL 0.9.x), **PROPOSED** (this audit).

> **Evidence boundary.** The current TETOL 0.9.x prototype (Whole Tree, Staff Room,
> `tetol-routes.js`, interiors) is **not in any repository this session could reach**.
> `edlondon/TETOL` (last push Aug 2025) is an older Next.js/Firebase site with no
> three.js and no `tetol-routes.js`. Everything about the prototype below is taken
> from Notion ("TETOL — S33D.Life", "08 · Current Priorities", 24 Sep 2026) and the
> brief, and is marked as such. The live Supabase project was **not reachable** from
> the audit sandbox (egress policy), so database facts come from the 298 migrations
> and the generated `types.ts`, not from production. Production may differ where
> changes were applied outside migrations.

---

## 1. Executive architecture (PROPOSED)

```
                ┌──────────────────────── NOTION (editorial) ───────────────────────┐
                │ Staff Library DBs · Council Circles · Golden Dream · AF stories    │
                └───────────────┬───────────────────────────────────────────────────┘
                                │  server-side pull, manual approve (Phase G)
                                │  NOTION_TOKEN lives only in an Edge Function secret
                                ▼
┌───────────────────────── SUPABASE (operational truth) ─────────────────────────────┐
│ trees · offerings · staffs · species_index · life_groves · groves · …   (RLS)      │
│ + curated_records (PROPOSED: Notion-derived, reviewed, with provenance)           │
└──────────────┬─────────────────────────────────────────┬──────────────────────────┘
               │ anon + RLS                              │ anon + RLS (read-only)
               ▼                                         ▼
┌──────── S33D.life (LIVE APP) ────────┐   ┌──── S33D DATA ADAPTER (PoC, this branch) ──┐
│ React SPA, supabase singleton         │   │ src/tetol-bridge/                         │
│ ROUTES.* · HEARTWOOD_ROOMS · staffs   │◄─►│ spatialRegistry  route ↔ spatial address  │
│ auth (currently under repair)         │   │ s33dDataAdapter  typed, explicit columns  │
└──────────────┬───────────────────────┘   │ readOnlyClient   no session, no URL parse │
               │ "Enter the Tree" link      └──────────────┬────────────────────────────┘
               │ /tetol/?at=<route>                         │ import s33d-bridge.js
               ▼                                            ▼
        ┌─────────────── TETOL 3D (static app under same domain, /tetol/) ───────────────┐
        │ current 0.9.x prototype, unchanged except: tetol-routes.js reads the registry, │
        │ demo content swapped for adapter calls one object at a time                    │
        └────────────────────────────────────────────────────────────────────────────────┘
```

One identity per entity: **tree uuid**, **Staff route code**, **Council record id**,
**Heartwood room key**. Both interfaces link by `canonicalRoute`; TETOL additionally
holds `spatialAddress`. Neither interface owns data.

---

## 2. Current data map (LIVE APP)

214 tables, 3 views, ~120 RPCs in `src/integrations/supabase/types.ts`; 298 migrations;
30 Edge Functions. "Anon read" = what an unauthenticated browser with the public anon
key can read under RLS, per the latest policy in migrations.

| Entity | Source of truth | Primary ID | DB location | Public / private | Current query path | Routes | TETOL can read today (anon) |
|---|---|---|---|---|---|---|---|
| **Ancient Friend** | Supabase `trees` (Notion Research Atlas = research only; "only encounter makes an Ancient Friend") | `trees.id` uuid; `merged_into_tree_id` redirects | `public.trees`; `trees_map_hot` (revoked from anon); RPC `get_trees_in_viewport` | **Public, all 57 columns** incl. `created_by`, `access_notes`, `metadata` | `TreeDetailPage` → `select("*")` in `useEffect`; map hooks; `api-gateway /api/v1/trees`; `services/treeRepository.ts` **unused and broken** (selects `heritage_status`, `height_m`, `source`, which are not `trees` columns) | `/tree/:id`, `/map`, `/atlas/*`, `/library/gallery` | **Yes** |
| Research tree (candidate) | `research_trees` | uuid | `public.research_trees` | Public | `ResearchTreeDetailPage` | `/tree/research/:id` | Yes. Keep distinct from Ancient Friend. |
| **Species** | `species_index` (+ `tree_species_lore`, `species_hives`) | `slug` / `species_key` | public tables | Public | `use-species-*` hooks, `speciesResolver` | `/species/:slug`, `/library/arborium` | **Yes** |
| **Encounter** | `tree_checkins` (+ `witness_sessions`, `tree_checkin_witnesses`) | uuid | `public.tree_checkins`; view `tree_checkins_public` | Private. Anon policy `USING(false)`; the "public" view is `security_invoker`, so **anon gets zero rows** | `use-tree-checkins`, `use-canopy-checkin` | `/tree/:id`, map layers | **No.** Aggregates only via RPCs (`get_tree_presence_summary`, `get_tree_activity_stats`). |
| **Offering** | `offerings` | uuid | `public.offerings` | `visibility` = public / tribe / private under RLS | `repositories/offerings.ts`, `use-offerings`, `get_offering_counts` | `/tree/:id`, `/staff/:code`, Heartwood rooms | **Public rows only** |
| **Visit** | `site_visits` (+ `meetings` = per-user tree "meeting" with expiry, `tree_page_views`) | uuid | public tables | `site_visits`: own or `user_id IS NULL`; `meetings`: own; `tree_page_views`: keeper | `VisitsPage`, `record_visit` RPC | `/visits`, `/tree/:id` | Anonymous visit rows only. Not useful. |
| **Whisper** | `tree_whispers` | uuid | `public.tree_whispers` | `authenticated` only (PUBLIC scope still needs sign-in) | `use-whispers`, `open_group_whisper` | `/whispers`, `/tree/:id` | **No** |
| **Grove** | `groves` + `grove_trees` | uuid | public tables | Public (`anon, authenticated`) | `use-grove-*` | `/groves` | **Yes** |
| **Life Grove** | `life_groves` (+ members, stewards, offerings, roots) | uuid; `invite_token` | public tables | `privacy='public'` rows readable by anon, **including `invite_token`** and memorial fields | `repositories/life-groves.ts` | `/heartwood/life-groves/:id`, `/life-grove-invite/:token` | Public groves yes. Must project columns explicitly. |
| **Staff** | Identity: `src/config/staffContract.ts` + `src/utils/staffRoomData.ts` (static, 144). Registry: `staffs` table (on-chain mirror). Record richness: **Notion Staff Library** (168 evidenced records) | route code (`YEW`, `YEW-C1S1`). **Three spellings in use** (§15) | `public.staffs` | Public, **including `owner_address`, `owner_user_id`** | `StaffDetailPage`: static grid, then `offerings.sealed_by_staff`, `ceremony_logs` (own-only), `staffs.eq("id", code)` | `/staff/:code`, `/library/staff-room` | **Yes** (static + table) |
| **Staff Circle** | `CIRCLES` in `staffContract.ts` (static); `user_borrowed_staffs` (own) | circle id | config | Public config | `staffRoomData.ts` | Staff Room | Yes (static) |
| **Wanderer** | `profiles` + `auth.users` | uuid | `public.profiles` | Own row only; others via `get_safe_profiles` / `search_discoverable_profiles` (SECURITY DEFINER, discoverable only, per-field visibility) | `use-wanderer`, `use-current-user` | `/wanderer/:id`, `/dashboard` | Discoverable subset only. **Self needs auth → Phase 3.** |
| **Council / Circle** | Living record in **Notion** (Circle 233). App: `councils` table (public, has `notion_link`, used only by search), `council_trees` | slug | `public.councils` | Public | `unified-search.ts` | `/council-of-life` | Partially; not the real record |
| **Council record** | **Hard-coded** `COUNCIL_CYCLES` (2 entries: Apr/May 2026) in `src/data/council/councilCycles.ts`; stale versus Notion | `"2026-04-new"` | none | Public config | `CouncilSessionPage`, `getCurrentCouncil()` (returns May 2026 today) | `/council/records/:id` | Yes, but **stale** |
| **Hearts / value** | `heart_ledger` + `heart_transactions` (dual-write), `user_heart_balances` | uuid | public tables | Own only; aggregates via `get_heart_economy_stats`, `tree_heart_pools` (public) | `lib/heartService.ts`, `repositories/hearts.ts` | `/value-tree`, `/vault`, `/dashboard` | Aggregates only |
| **Hive** | `species_hives` (+ `hive_*`) | `slug` / family | public tables | Public | `use-hive-*` | `/hives`, `/hive/:family` | **Yes** |
| **Harvest** | `harvest_listings` | uuid | public table | Public (includes lat/lng, `contact_method`) | `use-harvest-listings` | `/harvest`, `/harvest/:id` | Yes. Project columns. |
| **Tree dataset** | `tree_datasets`, `tree_data_sources`, `dataset_crawl_runs` | uuid | public tables | Public read; curator/keeper write | `use-data-commons`, `use-dataset-watcher` | `/tree-data-commons`, `/dataset-watcher` | **Yes** |
| **Moonroot** | **No table.** Admin page aggregating activity | — | — | Admin only | `pages/admin/MoonrootDigestPage` | `/admin/moonroot` | **No** (and should not) |
| **Golden Dream / Blueprint** | **Notion** (iframe of `clammy-viscount-ddb.notion.site/ebd/2161…`); `value_proposals` table is the nearest structured data | — / uuid | `public.value_proposals` | Public | `GoldenDreamPage` iframe | `/golden-dream`, `/your-golden-dream` | Proposals only; blueprints not structured |
| **Heartwood room** | `src/config/heartwoodRooms.ts` (typed registry, access levels) | room `key` | config | Per-room `access` (visitor/member/steward/advanced) | `ROOM_BY_KEY` | `/library/:room` | **Yes** (static) |

**Other data-layer facts**

- **Supabase client:** one singleton, `persistSession` + `autoRefreshToken` on, `detectSessionInUrl` left at default (true), custom `brokeredPreviewStorage`.
- **Caching:** React Query in places; many pages (tree detail, staff detail) fetch in `useEffect`. The PWA service worker caches `rest/v1/trees` stale-while-revalidate (24 h), other REST calls network-first (5 min), storage cache-first (14 d).
- **Realtime:** `use-companion-session.ts` already pairs a phone controller with a display over Supabase Realtime broadcast (`focus_tree`, `focus_staff`, `navigate_room`, `next`/`previous`, pointer, zoom). **This is a working foundation for "The Wand"** (§7).
- **Public API:** `supabase/functions/api-gateway` (`/api/v1/trees`, `/offerings`, `/search`, agent-garden) reads with the **service role**, bypassing RLS. See §10.
- **Repositories:** `src/repositories/*` (offerings, life-groves, hearts, grove-roots, blooms) and `src/services/treeRepository.ts`. All import the app singleton, so they carry the auth session with them.
- **Airtable:** one iframe embed only (`SeedCellarRoom`, `airtable.com/embed/appE4ajI4oqPaV8hl/shrTq2DuEhwOJblAB`); no API use.
- **Hard-coded / prototype data:** Council cycles, Staff grid (144), Staff measurements, Heartwood rooms, ecosystem map, roadmap, Golden Dream room list.

---

## 3. Current Notion integration map (LIVE APP)

**There is no Notion API integration.** No token, no Edge Function, no sync job, no
env var. Every link is a hard-coded public `notion.site` URL.

| Where | What | Direction | Mechanism | Notion page |
|---|---|---|---|---|
| `src/config/councilInvitation.ts` → `CouncilScrollEmbed` | Council invitation scroll | Notion → web | iframe `/ebd/` + "Open in Notion" link | `2ee15b58480d80c28ccce97480f7a69d` |
| `src/pages/GoldenDreamPage.tsx` | Golden Dream rooms (2 entries share one URL) | Notion → web | iframe | `21615b58480d802187b2cff864277413` |
| `src/pages/AssetsPage.tsx`, `AboutPage.tsx` | Living scroll / assets | Notion → web | iframe + link (two hosts: `clammy-viscount-ddb.notion.site`, `tetol.notion.site`) | `24515b58480d80e7808cdda1195e863a` |
| `src/components/TeotagGuide.tsx` | Link | — | link | `ancient-friends.notion.site` |
| `councils.notion_link` column | Per-council link | manual | column, no writer found | — |
| `roadmap-forest.ts` `notionLink?` | Roadmap docs | — | field defined, **0 uses** | — |
| `lib/council/getLatestCouncilInvitation.ts` | Comment sketches options A/B/C for future Notion sync | design only | — | — |

**Manual copies / duplication:** Council cycles (Notion Circles → `councilCycles.ts`,
stopped at May 2026); Staff species, circles, measurements (Notion Staff Library →
`staffContract.ts` / `staffRoomData.ts`; Notion has 168 records, app has 144 and a
different circle order); Heartwood room copy.

**Stale / dead:** `roadmap-forest.ts notionLink` unused; Council invitation fixed to
one page; `councils.notion_link` never written in code.

**CSP concern (verify on host):** `public/_headers` sets production CSP with
`default-src 'self'` and **no `frame-src`**. If the host honours `_headers`, every
Notion and Airtable iframe above is blocked in production. Check a live response header.

---

## 4. TETOL online options

| | **A. Into the SPA bundle** (`/tetol` React route, R3F or wrapped prototype) | **B. Isolated static app, same domain** (`public/tetol/`, like `/patronsportal`) | **C. Progressive modularisation** (B first, lift pieces into React over time) | **D. Separate origin** (`tetol.s33d.life`) |
|---|---|---|---|---|
| Build complexity | **L**: rewrite imperative prototype into React/R3F | **S**: copy built prototype + registry + adapter | S now, M later | S build, M infra |
| Performance | three pulled into app graph (lazy chunk OK, but shares React tree, providers, heavy App shell) | Own page. Zero cost to web users. | Same as B until modules move | Same as B |
| Mobile | App shell + 3D in one memory budget | 3D alone, no 8 providers | as B | as B |
| PWA | inherits SW; offline story tangled | Needs `navigateFallbackDenylist` + `globIgnores` (as patronsportal) | as B | Separate SW or none |
| Auth | Shares singleton session (risk while auth under repair) | **None needed** for read-only; later same-origin session is available | as B | Cross-origin session: hard |
| Routing | React Router | Own `?at=` / hash router; `_redirects` rule | as B | Own |
| Deep links | `/tetol/*` native | `/tetol/?at=/tree/<id>` via registry | as B | Cross-domain links |
| Shared state | Full | via URL + Supabase only | grows | URL only |
| Cache | Vite hashes | Vite hashes (own build); `_headers` immutable for `/tetol/assets/*` | as B | own |
| Deployment | Every TETOL tweak = full app release through Lovable | Static files; ships with app build but isolated | as B | separate pipeline |
| Rollback | App rollback | Delete folder / redirect rule | as B | DNS |
| Accessibility | Can reuse shadcn | Must add own (focus, reduced-motion, text path) | improves | own |
| Security | Same CSP | Same CSP (**no inline scripts, no CDN**) | as B | Separate CSP possible |
| Iteration speed | Slowest (release-check, Lovable) | **Fast**: prototype keeps its own build | Fast now | Fast |

**Evidence for B:** `/patronsportal` already proves the pattern in this repo:
`public/patronsportal/*.html`, `_redirects` rules, a `navigateFallbackDenylist`
entry, a Vite preview plugin, and an App route. Option **A** is the "premature rewrite"
the brief asks to avoid. **D** adds a second origin and makes Phase 3 auth harder.

---

## 5. Recommended minimum architecture (PROPOSED)

**B now → C only where it earns its keep.**

1. **TETOL stays a standalone build** (its own tooling, unchanged), output copied to
   `public/tetol/` **only at the preview stage** (§6), never through Lovable's
   editor.
2. **One shared bridge module** (`src/tetol-bridge/`, built by
   `scripts/build-tetol-bridge.mjs` into `s33d-bridge.js`, ≈ supabase-js + a few KB).
   It is the only thing TETOL imports from S33D:
   - `SPATIAL_REGISTRY`, `routeToSpatial`, `spatialToRoute`: the formal route ↔ space bridge (§C).
   - `createBridge().data`: the S33D data adapter (§D).
3. **Mode switch** in the web app = an ordinary link, "Enter the Tree", computed with
   `routeToSpatial(location.pathname)` → `/tetol/?at=<address>`. And from TETOL,
   "Open in S33D" = `spatialToRoute(address).route`. No shared React state.
4. **Route name `/tetol/`**: "TETOL" is already the product name in `ROUTES`-adjacent
   code (`TetolHomePage`, `TetolLevelContext`, `/api/v1` description), Notion, and
   the brief. `/explore` is generic and collides semantically with `/discovery`,
   `/map`. Ed decides (§18).

### C. Route ↔ spatial address bridge

`tetol-routes.js` (PROTOTYPE, not inspected) should stop owning the mapping and read
`SPATIAL_REGISTRY` instead. The PoC registry:

- is **one table read in both directions** (`routeToSpatial`, `spatialToRoute`); static
  segments beat params (`/library/staff-room` → `staff-room`, not `heartwood/staff-room`);
- **derives** 13 of the 14 Heartwood rooms from `HEARTWOOD_ROOMS` (the Staff Room is an explicit override), carrying `access`, so new
  rooms appear without edits;
- is **tested against `App.tsx`**: every mapped route must match a real `<Route path>`, so
  web renames break CI instead of silently orphaning a spatial place;
- validates param parity (`:id` on both sides), duplicates, and encoding.

Smallest stable API:

```ts
type SpatialMapping = { id; entity; route: "/tree/:id"; spatial: "heartwood/root-descent/cavern/friend/:id"; access; origin };
routeToSpatial(pathname) → { address, mapping, params } | null
spatialToRoute(address)  → { route, mapping, params } | null
```

Spatial objects carry `{entity, id}`, and `canonicalRoute` comes from `ROUTES.*`. Places
without a spatial home return `null` (e.g. `/vault`), which is the Spatial Coverage
Audit's gap list, computed.

### D. Backend connection: what exists vs what is new

| Requested | Exists today | PoC (this branch) |
|---|---|---|
| `getAncientFriend(id)` | `TreeDetailPage` inline `select("*")`; `treeRepository.getById` (unused, **invalid columns**) | Typed explicit projection, follows merges, provenance |
| `listAncientFriends()` | `treeRepository.getByNation`, map hooks, `get_trees_in_viewport` RPC | Capped at 200, unmerged only |
| `getStaff(code)` | `getGridStaffs()` + `staffs` row | Normalises all spellings; never reads owner fields |
| `getCouncilRecord(id)` / `getCurrentCouncil()` | `COUNCIL_CYCLES`, `getCurrentCouncil()` | Same source, plus a `stale` flag |
| `getHeartwoodRoom(key)` | `ROOM_BY_KEY` | Adds spatial address + provenance |
| `getWanderer()` | `use-current-user` (singleton session) | **Returns null**: Phase 3 |

Reused as-is: `ROUTES`, `HEARTWOOD_ROOMS`, `staffContract`, `staffRoomData`,
`councilCycles`, generated DB types. **Not reused:** the app singleton client and
`src/repositories/*` (they bind to the persisted session), and `treeRepository`
(broken projection). The adapter uses its own **read-only client**
(`persistSession:false, autoRefreshToken:false, detectSessionInUrl:false`,
separate `storageKey`), so TETOL cannot touch the auth flow now under repair.

---

## 6. Read-only public TETOL plan

**Phase 0: local prototype (now).** Reconcile `tetol-routes.js` with `SPATIAL_REGISTRY`.

**Phase 1: private preview.** Build `s33d-bridge.js`; copy the prototype build into
`public/tetol/` **on a preview branch only**; add `_redirects` (`/tetol /tetol/index.html 200`,
`/tetol/* /tetol/:splat 200`) above the SPA catch-all; add `/^\/tetol/` to
`navigateFallbackDenylist` and `tetol/**` to `globIgnores`; add
`<meta name="robots" content="noindex">`. Swap **one** demo object each:
one Ancient Friend alcove, one Staff in the Spiral.

**Phase 2: public, optional, read-only.** Add the "Enter the Tree" link (feature-flagged),
TETOL-side "Open in S33D" links, accessibility baseline, and performance gates (§11).

**Safe to expose read-only now** (anon under RLS, explicit columns):

- trees (Ancient Friends, minus `created_by`, `access_notes`, `metadata`, `photo_original_url`)
- species_index, tree_species_lore
- groves / grove_trees
- public offerings (`visibility='public'` only, direct client, **not** api-gateway)
- staffs (id, token_id, verified_at only)
- Staff config
- Heartwood rooms
- Council cycles (flag stale)
- species_hives
- tree_datasets
- aggregate RPCs (`get_offering_counts`, `get_tree_offering_summary`)

**Not in Phase 2:**

- encounters, whispers, Wanderer self, hearts balances, Moonroot, life groves (memorial PII; defer until the projection is reviewed)
- harvest contact fields
- anything admin

**Auth dependency: none.** No sign-in UI, no session read, no URL-fragment parsing.

---

## 7. Authenticated TETOL (future plan)

**Phase 3: personal state.** Only after the production auth fix is released and
TEOTAG-approved. Same origin means `/tetol/` can read the app's session: add
`getWanderer()` behind a *second* client created with the app's storage key and
`detectSessionInUrl:false`. **Never** run a sign-in flow inside TETOL; send the
Wanderer to `/auth?returnTo=/tetol/?at=…` and back. RLS then does the rest (own
check-ins, own whispers, hearts balance, borrowed staff).

**Phase 4: spatial writes.** Offerings, check-ins, whispers from inside the Tree must
reuse the existing write paths (`repositories/offerings.ts`,
`plant_seed_with_proximity`, `lib/heartService.ts` dual-write). They should not get new
ones: the Hearts dual-write contract is test-locked, and proximity gates are server-side.

**The Wand.** `use-companion-session.ts` + `lib/companion-types.ts` already implement
pairing code → Realtime channel → validated commands (`focus_tree`, `focus_staff`,
`navigate_room`, `next`, `previous`). Extending `CompanionCommand` with `look`,
`approach`, `enter`, `choose`, `back`, `return_to_tree` (each carrying a spatial
address) gives the Presenter mode with no new transport. Check whether the channel
needs auth before relying on it for anon displays.

---

## 8. Notion sync architecture (PROPOSED)

**Recommendation: manual-approval pull, then scheduled pull.** Not webhooks first,
not two-way.

```
Notion data source ──(Edge Function `notion-ingest`, service role, NOTION_TOKEN secret)──►
  curated_records (review_status = 'pending')  ──TEOTAG / curator approves──►  'approved'
  ──► public view curated_records_public (approved + public only) ──► web + TETOL
```

- **Pull**: query changed pages by `last_edited_time`, store `source_revision`, and skip
  if unchanged. Idempotent upsert on `(source_type, source_id)`.
- **Manual approval** first: an admin "Sync from Notion" button (curator role) runs the
  pull. Later a daily `pg_cron` / scheduled trigger runs the same function. Approval
  is still required for anything new or changed.
- **Webhooks** (Notion integration webhooks): only as a *hint* to run the pull. Never
  trust payload content alone.
- **Render from Supabase, never live Notion.** The public site keeps working when
  Notion is down or a page is unshared.
- Store **plain structured text + a sanitised subset of blocks** (paragraph, heading,
  quote, list, image by re-hosted URL). No raw Notion HTML. Notion file URLs expire,
  so re-host approved images into a Storage bucket.

| Content | Notion role |
|---|---|
| Ancient Friend long-form story | **Editorial source** (tree identity stays in Supabase) |
| Source notes / provenance | **Editorial source** → `curated_records` layer `real_world_evidence` |
| Staff maker records | **Authoritative** for maker testimony and record census; Supabase `staffs` stays authoritative for token/on-chain |
| Council records (Circles) | **Authoritative** until an in-app Council editor exists; replaces `COUNCIL_CYCLES` |
| Golden Dream blueprints | **Editorial source** (Crown, future-facing, approval-gated) |
| Heartwood room descriptions | **Reference only** (`heartwoodRooms.ts` stays canonical for keys/access) |
| Public project docs | **Editorial source** |
| Collaborators / acknowledgements | **Editorial source**, only with the person's consent flag |
| Curated learning material | **Editorial source** |
| Inner Council, priorities, audits | **Not used** (never synced to public) |

---

## 9. Provenance model (PROPOSED, no migration created)

One additive table; nothing existing changes.

```sql
-- PROPOSED — for review only, NOT a migration
create table public.curated_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,          -- 'ancient_friend' | 'staff' | 'council_record' | 'heartwood_room' | 'golden_dream' | …
  entity_id text not null,            -- trees.id | staff route code | council id | room key
  layer text not null check (layer in (
    'real_world_evidence','curated_record','maker_reflection',
    'community_contribution','tetol_spatial_interpretation','generated_concept')),
  title text, summary text, body jsonb, -- sanitised block subset
  source_type text not null,          -- 'notion' | 'supabase' | 'field' | 'agent'
  source_id text not null,            -- Notion page id
  source_url text,
  source_revision timestamptz,        -- Notion last_edited_time
  synced_at timestamptz not null default now(),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','withdrawn')),
  reviewed_by uuid, reviewed_at timestamptz,
  visibility text not null default 'private' check (visibility in ('public','member','private')),
  unique (source_type, source_id, entity_type, entity_id, layer)
);
-- RLS: anon/authenticated SELECT only where review_status='approved' AND visibility='public';
-- writes: service role (ingest) + has_role(auth.uid(),'curator') for review.
```

Several **layers** per entity keep evidence, maker testimony, community material,
TETOL interpretation and generated concepts **separate**. TETOL can render them
differently (e.g. evidence as grounded objects, spatial interpretation as light).
The adapter already returns `provenance[]` per record; `curated_records` rows join
into it.

---

## 10. Security / privacy risks

| # | Finding | Severity | Evidence | Action |
|---|---|---|---|---|
| S1 | `api-gateway` `GET /api/v1/trees/:id/offerings` returns **`tribe`** offerings to unauthenticated callers (service role bypasses RLS) | **High** (privacy) | `supabase/functions/api-gateway/index.ts` ~L293–300 | Queued as a separate task; TETOL must not use the gateway |
| S2 | `api-gateway` `GET /offerings/:id` checks `tree_meetings`, a table that does not exist (`meetings`) | Low (fails closed) | same file ~L380 | same task |
| S3 | `life_groves.invite_token` readable by anon on public groves; token grants membership via `join_life_grove_with_token` | Medium, **verify intent** | no column REVOKE in migrations | Project columns; consider `REVOKE SELECT (invite_token)` like `life_grove_offerings.contributor_email` |
| S4 | `book_notes` SELECT allows `visibility IN ('public','circle','tribe')` with no membership/auth check | Medium, **verify intent** | policy in migrations | Review |
| S5 | `trees` fully public incl. `created_by`, `access_notes`, `metadata`; `staffs` public incl. `owner_address`/`owner_user_id` | Low–Medium | RLS `true` | Bridge projects explicitly (done in PoC); consider column grants |
| S6 | Second Supabase client on same origin with default `detectSessionInUrl:true` could consume auth callback fragments | Medium for auth repair | client defaults | Bridge client disables it (done, test-locked) |
| S7 | Notion secrets: none exist today | — | grep | Keep token only in Edge Function secrets; never `VITE_*` |
| S8 | Unpublished Notion material | — | — | Ingest is pull-by-allowlist of data-source ids; `review_status` + `visibility` gate; `curated_records_public` view is the only anon path |
| S9 | XSS from Notion content | — | — | Store block JSON, render as text nodes; no `dangerouslySetInnerHTML`; TETOL renders to canvas/text only |
| S10 | Third-party images | Low | CSP `img-src https:` | Re-host approved images; Notion S3 URLs expire |
| S11 | Admin routes (`/admin/*`, `/curator/*`) | — | App.tsx | No spatial mapping; registry test would expose any accidental addition |
| S12 | Preview content indexed | Low | — | `noindex` + no sitemap entry for `/tetol/` until Phase 2 |

Public-repo note: this repository is public, so this document and the branch are visible.

---

## 11. Performance findings

**Measured**

- **Staff images:** 144 JPEGs, **all 724×1086**, **47.4 MB** total, average 329 KB,
  max 467 KB; the Origin 36 alone are 9.9 MB. Decoded as textures, each is
  724 × 1086 × 4 B ≈ **3.1 MB**, so **≈ 450 MB** for all 144 (≈ 600 MB with mipmaps).
  **A Staff Spiral that loads every staff at full resolution will exhaust mobile
  Safari's memory.** This is the one hard pre-launch requirement found: spiral
  thumbnails (e.g. 256 px) with full resolution only on focus.
- **Route coverage:** the registry maps 20 addresses; **~114 of the app's 120 route
  paths have no spatial home.** That list is the Spatial Coverage Audit backlog,
  computed by `routeToSpatial()` returning `null`.
- **Existing three.js use in the app:** `three@0.160` + R3F/drei are already
  dependencies, used only by `SeedScene` behind two `React.lazy` boundaries. There is no
  `manualChunks` entry for three, so it stays out of the home modulepreload list. Option B
  keeps it that way.

**Not measured (blocked in sandbox):** three.js/bridge bundle sizes and build timings.
The dependency install could not complete: 165 `package-lock.json` entries resolve to a
private Lovable npm cache (`europe-west1-npm.pkg.dev/lovable-core-prod/...`) that returns
403 outside Lovable, and `npm ci` already fails on `main` (lockfile missing `drizzle-kit`).
Prototype runtime (FPS, memory lifecycle, interior suspension) could not be measured
without its source.

**What must be true before a public `/tetol/` experiment** (measure on one mid-range
Android + one iPhone, on 4G):

1. The Staff Spiral uses thumbnails; textures are disposed on room exit (`texture.dispose()`, `geometry.dispose()`).
2. The render loop pauses when the tab is hidden and when an interior is inactive (`renderer.setAnimationLoop(null)`); DPR is capped (≤ 2 desktop, ≤ 1.5 mobile).
3. The prototype build has **no inline scripts and no CDN imports** (production CSP `script-src 'self'`).
4. `/tetol/**` is excluded from Workbox precache (default glob `**/*.{js,css,html}` would otherwise push three.js to every web visitor) and from `navigateFallback`.
5. Record first-frame time and peak memory once, then set budgets from that baseline rather than guessing.
6. A reduced-motion / text path exists (every spatial object has its `canonicalRoute`, so "Open in S33D" is the accessible fallback).

The service worker's `rest/v1/trees` stale-while-revalidate cache applies to `/tetol/`
too (same origin, same scope), so repeated tree reads are cheap for free.

---

## 12. Proof-of-concept results

**Built (branch only, not imported by `App.tsx`, zero effect on the production bundle):**

- `src/tetol-bridge/spatialRegistry.ts`: bidirectional route ↔ spatial registry. 7 explicit mappings + 13 derived from `HEARTWOOD_ROOMS`.
- `src/tetol-bridge/s33dDataAdapter.ts`: `getAncientFriend`, `listAncientFriends`, `getStaff`, `getCouncilRecord`, `getCurrentCouncil`, `getHeartwoodRoom`, `getWanderer` (null). Explicit columns, merge-following, `provenance[]`, `canonicalRoute` + `spatialAddress` on every record.
- `src/tetol-bridge/staffIdentity.ts`: one resolver for all Staff spellings.
- `src/tetol-bridge/readOnlyClient.ts`: session-less anon client (no persist, no refresh, no URL-session parsing).
- `scripts/build-tetol-bridge.mjs`: standalone ES-module build (`dist-tetol-bridge/s33d-bridge.js`) a vanilla prototype can `import`.
- Tests: `__tests__/tetolBridge.test.ts` (mirrors the 27 harness checks below, incl. "every mapped route exists in `App.tsx`", "never selects owner/created_by", "never calls a write") and an opt-in live test (`TETOL_LIVE=1`).

**Verified in sandbox:** the bridge's logic was executed with Node 22's built-in TS
stripping against the real repo registries (scratch harness, not committed). **27/27
checks pass.** A real Staff record resolved from the canonical config:

```json
{"kind":"staff","routeCode":"YEW","speciesName":"Ancient Yew","isOriginSpiral":true,
 "gridTokenId":1,"image":"/images/staffs/yew.jpeg","contractCircleId":0,
 "canonicalRoute":"/staff/YEW","spatialAddress":"staff-room/staff/YEW",
 "provenance":[{"source":"app-config","location":"src/config/staffContract.ts","sourceId":"YEW"}]}
```

`getCurrentCouncil()` returns `2026-05-full` (gathering 2026-05-04) with `stale: true`
on 25 Sep 2026.

**Not verified:**

- **vitest, `tsc`, eslint and the Vite library build were not run.** Dependencies could not install (above). Run `npm run typecheck && npm run lint && npx vitest run src/tetol-bridge` locally.
- **A live Ancient Friend was not fetched:** the sandbox egress policy blocks `*.supabase.co`. Run `TETOL_LIVE=1 npx vitest run src/tetol-bridge/__tests__/tetolBridge.live.test.ts` locally; it reads one public tree and `YEW` as `anon`.
- **Not wired into the 3D prototype**, since its source was unavailable. The integration is three lines (see `src/tetol-bridge/index.ts` header).

**Conclusion:** TETOL can receive real S33D records through a small read-only seam
without being rewritten. The work that remains is reconciling identity (Staff codes,
Council records), not plumbing.

---

## 13. Exact files that would need to change

**This branch (PoC, isolated, not imported by the app):**
`src/tetol-bridge/{index,spatialRegistry,s33dDataAdapter,staffIdentity,readOnlyClient}.ts`,
`src/tetol-bridge/__tests__/tetolBridge{,.live}.test.ts`,
`scripts/build-tetol-bridge.mjs`, `.gitignore`, this doc.

**Phase 1 preview (not done):**

- `public/tetol/**`: prototype build output, external scripts only
- `public/_redirects`: `/tetol` rules above `/* /index.html`
- `vite.config.ts`: `navigateFallbackDenylist += /^\/tetol/`, `globIgnores += "tetol/**"`, preview plugin like `patronsPortalPreviewPlugin`
- `public/_headers`: `/tetol/assets/*` immutable
- prototype `tetol-routes.js`: import `SPATIAL_REGISTRY`

**Phase 2:**

- `src/lib/routes.ts`: `TETOL: "/tetol/"`
- One "Enter the Tree" link component using `routeToSpatial`
- `public/robots.txt` / `sitemap.xml` (only when public)

**Phase 3:**

- `src/tetol-bridge/`: session-reading client + `getWanderer`
- `src/lib/companion-types.ts`: spatial intents

**Notion sync (later):**

- new Edge Function `supabase/functions/notion-ingest/`
- migration for `curated_records`
- curator review UI
- `src/lib/council/getLatestCouncilInvitation.ts` + `councilCycles.ts` swap to synced rows

---

## 14. Migrations

**None created.** None are needed for Phases 0–2. The only proposed schema is
`curated_records` (§9, additive), plus optional column-level `REVOKE`s for S3/S5 (need
TEOTAG + security review).

---

## 15. Top 5 blockers

1. **Prototype source not in a reachable repo.** `tetol-routes.js` cannot be reconciled
   or bundled until it is committed somewhere this workflow can see.
2. **Staff identity has three spellings.** Web/Notion use per-species circles
   (`YEW-C1S1`); the contract config numbers circles globally (Oak 1–3, Yew 4–6), so
   `formatStaffCode` yields `YEW-C4S1` for Yew circle 1, which **collides** with
   Notion's real Yew circle 4. The `staffs` table comment shows zero-padding
   (`OAK-C1S03`). Grid token order puts Yew first; `CIRCLES` puts Oak first. Notion
   has 168 records; the app has 144.
3. **Council records are hard-coded and stale** (last: May 2026; Notion is at Circle 233).
   TETOL "growth rings" would show old rings until Council sync exists.
4. **Auth under repair.** Phase 3+ are blocked by design; Phase 1–2 are independent.
5. **CSP / PWA constraints for a static app.** `script-src 'self'` (no inline, no CDN
   three.js), SPA navigate-fallback, and default precache globs must all be handled,
   as they were for `/patronsportal`. Also, `npm ci` fails on `main` (lockfile out of
   sync: `drizzle-kit` missing), which will block any CI that uses `npm ci`.

---

## 16. Smallest build sequence

1. Ed commits the TETOL 0.9.1 prototype to a repo (XS).
2. Review/merge this bridge PoC (S).
3. In the prototype: `tetol-routes.js` ← `SPATIAL_REGISTRY`; one Ancient Friend alcove
   and one Staff read via `createBridge()` (S).
4. Decide Staff canonical code + reconcile Notion ↔ `staffs` ids (S, decision-heavy).
5. Preview-branch `/tetol/` static mount with redirects/SW/CSP handling (S).
6. Performance gates (§11) on a mid-range phone (S–M).
7. "Enter the Tree" link, feature-flagged; public read-only (S).
8. `curated_records` + manual Notion pull for Council records first (M).
9. Phase 3 session read after the auth release (S), then the Wand intents (S).

---

## 17. Rough complexity

| Item | Size |
|---|---|
| Bridge PoC (done) | S |
| Registry reconciliation with `tetol-routes.js` | XS–S |
| Static `/tetol/` preview mount | S |
| Public read-only launch incl. a11y + perf gates | M |
| Staff identity reconciliation | S (code) + decision |
| Notion → `curated_records` pull + review UI | M |
| Council records from Notion | S after the above |
| Authenticated TETOL (read) | S after auth fix |
| Spatial writes | M–L |
| Full modularisation into the SPA (Option A) | L, not recommended now |

---

## 18. Questions for TEOTAG

1. **Where does the 0.9.x prototype live**, and may it be committed (private repo is fine)?
2. **Route name:** `/tetol/` (recommended) or something else?
3. **Canonical Staff code:** adopt the web/Notion per-species form (`YEW-C1S1`,
   origin = `YEW`) everywhere, and treat the contract's global circle id as metadata only?
4. **Council records:** is Notion the authoritative Council record for now (sync it
   into Supabase), or should Council records be authored in-app?
5. **Life Groves in TETOL:** are public memorial groves appropriate for the first
   public spatial browser, or held until Phase 3?
6. **S3 / S4** (grove invite tokens, book-note visibility): intended behaviour or tighten?
