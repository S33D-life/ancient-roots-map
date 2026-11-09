# Ely AFC — review-only GitHub handoff, 14 October 2026

Repository S33D-life/ancient-roots-map; branch codex/ely-afc-release-readiness-20261014. Base current main 6d4071d9d57c300742128ae5caeb230e9471e0eb. No merges, deployments, migrations, live records or image uploads authorised. Candidate SHA is the branch head, not a deployed release.

## Reconciled facts
Production version.json reports 6d4071d generated 2026-10-12T23:25:16.437Z. Public live bundle references mwzcuczfedrjplndggiv.supabase.co, matching config.toml and Ed’s Lovable Cloud confirmation. Current remote main is 6d4071d9. Lovable’s Git connection panel was independently inspected read-only: S33D-life/ancient-roots-map, active branch main, and In sync with GitHub / same commit. Remote main resolves to 6d4071d9. Lovable chat reports editor og-proxy fingerprint 202ade8b… from editor commit 9ae1f8d8c; repository main and a43da19 independently hash to 202ade8b5e96a8b033872f78e06a020f640ad1643f5b2ea32afe2479d535d041. This corroborates editor-source equivalence, not deployed artifact equivalence. No branch switched or sync mutation requested.

The prepared Codex patch was local-only on codex/ely-public-access-wording-20261013, based on 1d941de3. That base has exactly the same Git tree as current main (f9dae64189ae86871cdf4f28d88b25517531f1bd). This review branch makes the same narrow work visible in GitHub; no broader lineage merge required.

## Research reconciliation — do not promote yet
Public research_trees contains fc085265-5a4f-46f0-a616-f3b869bea8b0, Bishop’s Plane, Platanus x hispanica, coordinates 52.398245,0.261422, provenance Paul Wood — Tree Hunting (2025), source document and locality in attached public-research-evidence.json. linked_tree_id/converted_tree_id null, research_only. Preserve all fields/ID and its recorded geo_precision exact as source assertion, not proof of surveying.

This is a strong same-tree candidate: taxon, Ely cathedral precinct locality and name all fit the witnessed tree. Original public spreadsheet CSV row #437 independently retrieved and matches the imported name/taxon/locality/coordinates and source what3words. This verifies imported provenance, not by itself the same-individual relationship. No name/proximity-only identity merge. Request source row/entry or steward confirmation before recording a verified same-individual relationship. Public trees name search finds no actual Ely individual; all-tier fresh duplicate check remains necessary via Lovable read-only backend tools before insertion.

Existing species_index UUID 32e5a004-f8c5-45eb-a74f-8e6d1f205a68 verified: species_key platanus-acerifolia, stored scientific name Platanus × acerifolia; accepted human content Platanus × hispanica uses existing identity, no new species. trees uses species_key, not a new species UUID column.

## Source delta / production effects — revised after Lovable review
Frontend-only candidate: only explicit location_provenance.basis = satellite_estimate triggers the warning. location_confidence = approximate alone never triggers text or marker changes. Ordinary/public map/access wording is preserved, including original Open path labels. Only explicit metadata.visiting_access.kind = managed_grounds on an effective public record triggers Public record / check visiting arrangements. It is presentation only, never a permission/visibility grant. The exact approved access_notes text appears in its public popup/profile; outside the height-limited hero to prevent mobile clipping. Notes are escaped in popups and included in cache keys.

Map query projects only required provenance basis/access note fields, never full metadata. Private tiers/grants remain authoritative; explicit metadata cannot override private/garden/visible/granted wording or permissions. No broad rewrite of existing records, no coordinate writes, no private encounter GPS.

ZERO deployable Edge Function diff from main. supabase/functions/og-proxy/index.ts, og-card, api-gateway and shared backend source remain identical to baseline. The frontend helper now lives entirely in src/lib/treeLocationEvidence.ts. Independently reviewable, BLOCKED Edge location proposal is stored only as docs/releases/ely-afc-20261014/BLOCKED_EDGE_PROPOSAL.patch. It recognises explicit satellite basis only; it must be reconciled with captured privacy-safe deployed source before any separate approval. The unsafe global Staff lookup is not fixed or deployed by this PR. Backend RECOVERY HOLD remains.

No migrations, schema, RLS, authority, dependencies, held realms or Council source changes. Do not publish frontend as evidence that geographic social metadata is fixed: live Edge output remains a separate release gate.

## Assets and consent
Eight approved gallery files, order 1,3,2,5,6,4,7,8; final captions and derivative hashes in gallery JSON. Images intentionally NOT committed/uploaded. Exact files remain privately under notes/ely/private-photo-review-20261014/approved-public-gallery in Codex’s project workspace. Lovable lacks these assets until a separately approved transfer/upload. Photo 9 remains private, Photo 10 remains existing Council illustration. No camera filename assignments, private original GPS or raw originals in this branch. Copy derivative bytes unchanged and validate hashes before/after approved handoff. Photos are user-supplied encounter evidence, not independently verified untouched camera originals.

## Identity and connections
No actual trees.id assigned. Existing companion ely-plane-companion is individual-tree kind with illustration, reader false, no lives. Preserve it. Proposed create-or-match exactly one authenticated individual after research reconciliation; reuse it for future Councils. AFC is a Council relationship, never separate tree database/authority. Existing Birch context contract is reused when real Plane UUID becomes available. No placeholder production route or UUID added. Existing Heartwood UI unchanged; specific Ely memory/harvest is not manufactured. Ed reports Fire occurred with Ed and Leo; lifecycle remains PREPARING in source, no automatic change. Claude frozen edition/PDF not edited.

## Claude handoff limitation
Requested claude/council/circle-236/Circle-236_Codex-Handoff_URLs-and-Identities_2026-10-14.md is not present in current main or available local files. Exact ten-row audit cannot be honestly inferred. Claude/Ed must supply that file or its Git commit; current route coverage follows, not a substitute for the missing handoff.

| Surface | Route | Status / evidence |
|---|---|---|
| Council | /council-of-life | Existing source + release smoke |
| Circle | /review/council/236 | Existing seven-companion manifest; PREPARING |
| Spatial | /tetol | Existing source retained; no new numeric URL |
| Plane appearance | Circle with ely-plane-companion | Present, no individual Atlas target yet |
| Individual Ely | /tree/<real UUID> | Blocked: no verified canonical UUID |
| Research entry | /tree/research/fc085265-5a4f-46f0-a616-f3b869bea8b0 | Record confirmed, route exists; identity reconciliation pending |
| Species | /species/platanus-acerifolia | Existing species verified; route source exists |
| Gallery | Existing tree offerings/photo surface | Prepared assets; no upload/record association |
| Heartwood memory | Existing Heartwood doors | Specific memory missing; no invented permalink |
| Fire | Existing Circle group/recurring room | Existing doorway retained; frozen handoff Meet URL not independently received |

No printed QR codes or new URL grammar prepared from unverified destinations. Authenticated live Ely journey blocked until a real record exists and final approval. Local mocks/denial tests are not real-origin authentication evidence.

## Stage GO requests
1. Recovery artifact or authoritative source-equivalent restoration package from Lovable Support; inspect source/dependencies/runtime/JWT/config, secret NAMES, cache/CDN and no-overwrite Publish behaviour. Nine-table/storage exports do not recover functions. Support request included, not sent.
2. Approve captured-live-based location-only Edge patch and independent restore procedure; verify public/private/Staff metadata before frontend.
3. Approve isolated frontend correction; preserve 6d4071d9 as rollback ring; verify served bundle/routes, no backend overwritten.
4. Approve one individual record creation/promotion only after identity/source/duplicate checks, owner read-back and automatic check-in/reward review. Preserve research ID/source coordinates; public satellite estimate only and exact uncertainty/access note.
5. Approve eight public derivatives upload after hash mapping; never originals/Photo 9.
6. Approve minimal actual UUID Plane binding; test Circle↔profile, Map return, anonymous/auth desktop and mobile; durable Heartwood relation only to genuinely recorded memory.

Rollback: capture actual privacy-safe function checkpoint and current frontend before changes; restore independently without privacy migration reversal. Do not fall back to a known unsafe Staff/global lookup. After creation, retain warning-capable presentation or obtain explicit temporary visibility decision before reverting to unlabeled UI. Preserve all records/media.

Noku untouched; plan only after Ely verified live. No sensitive/private data in Git handoff. Review fixture files and private images excluded.

## Local verification receipt
Complete release-check: 534/534 tests across 69 files, typecheck/build/security/asset/duplicate/Council checks passed. Lint: 0 errors, 179 existing warnings. Config churn guard passed. Production-build Playwright release-reconciliation smoke: 4/4, desktop 1280 and mobile 390, external requests intercepted; not live authenticated proof. Earlier isolated location fixture reviewed at 320/390/1440; no actual Ely live profile exists yet. Private-photo hash/metadata checks are separate from application build.

Additional responsive smoke: 4/4 at 320/1440 using an uncommitted temporary copy of the same read-only smoke; temporary file removed. Total local navigation checks 8/8 across 320/390/1280/1440. No authenticated live Ely assertion.

Do not use Lovable’s suggested a43da19 redeployment as a recovery shortcut: matching editor code still contains the unrelated global Staff-binding query and does not establish a privacy-safe live recovery checkpoint. Source-equivalent recovery requires independently reviewed privacy-safe source, complete inputs and credible restoration procedure accepted by Ed; hash equality alone is insufficient.

## Before/after scope correction
| Record | Previous PR | Revised frontend |
|---|---|---|
| Ely with explicit satellite + managed markers | Satellite warning; globally neutralised public wording | Same satellite warning; scoped managed note/wording only |
| Unrelated public tree | Public record wording applied globally | Original Open path wording, no warning absent explicit marker |
| Existing approximate tree | Generic unverified-trunk warning inferred from approximate | No new warning or marker text from approximate alone |
| Private tree | Generic warning if approximate; private tier otherwise unchanged | No inferred warning; tier/grants/denial remain unchanged |

Counts 791 total/671 public are Lovable-reported review context, not rewritten by this change. Current Circle 235 pointer/Circle 236 PREPARING preserved. Fire/Harvest copy and permanent route remain separate proposals, not implemented here.

## Revised regression receipt
Complete release-check passed: 539 tests across 69 files, typecheck/build/security/assets/duplicates/Council checks; lint zero errors with 179 warnings. Exact managed-note/explicit-satellite local fixture checks passed 3/3 at 320/390/1440 with external requests intercepted, no live writes. Initial fixture attempt was refused because its local server was stopped; server started and tests passed. Existing privacy test file and deployable functions are restored byte-for-byte to main. Revised CI receipt belongs to this new PR head, not the previous head.
