# Circle 237 — focused Fire-schedule release review

23 October 2026. Source checkpoint 3831a711c5f7061c11f26d4f10a05f077362a343 is preserved. No redesign or replacement artwork. New review branch codex/circle237-fire-release-20261023 contains the recovered three-commit frontend lineage plus the minimum schedule correction, associated tests and explicit CI routing. Frozen f0361bc6 and 3831a711 remain unchanged.

## Reconciliation

- GitHub main API and fresh isolated clone: 9503b07d38ba852fc9fb44f461568a9b65fee9a3. Lovable project 206b4e97-2343-48d0-89b8-f5647bb248f1 reports the same editor SHA. Main is an ancestor of 3831a711; no rebase, cherry-pick, auth or broader integration is required. Earlier local-mirror refs disagreed with GitHub; the fresh network read is used.
- Public www.s33d.life/version.json reports build 9503b07, generated 2026-10-15T21:31:21.538Z. Public /council/237 returns HTTP 200 SPA index, but an anonymous frontend-only browser renders 404 and Page Not Found, with zero companion buttons. Backend, analytics, worker and non-GET requests were blocked for this observation. This is not a signed-in/live-backend acceptance test.
- Observed public main bundle:/assets/index-RkjDnA05.js. Headers, full downloaded bytes and SHA256 are preserved in the external receipt. A reported build prefix/editor SHA is not independent proof of complete served-source equivalence.

## Runtime scope

- Preserve existing ten-companion 2D/spatial draft, application route/council/237, invitation query c237view=invitation and TETOL Canopy→Council→237 spatial doorway. No historical embedded chamber is relabelled/replaced.
- Superseding Opening Fire:Friday 23 October 2026,15:30 UK (BST), 2026-10-23T15:30:00+01:00. No occurrence/attendance claim. Previous 20 October schedule removed from executable237 surfaces; historical evidence documents are preserved.
- Community link:https://t.me/s33dlife. It is not a verified direct Fire-room URL. Central question remains provisional.
- All ten portrait references remain null. Ed confirms curation; actual selected files/mappings have not been located or inspected. Do not substitute older screenshots, Circle 236 artwork or generated images. EDITORIAL-INTAKE.json gives ten exact intake gaps. Supply original curated files or their private folder URL to complete image verification.
- No Circle 237 PDF is available/registered in this candidate. This PR does not expand into the separate weekly archive implementation or generate an unapproved PDF.
- Circle 236 OPEN,235 question/history, canonical identities and return validation preserved. No Radio, quests, Moon Root Sync, Roots interface/security, Staff Room, auth, DB, storage, RLS or Edge source change.

## CI and local evidence

The standalone pilot requires a separate Vite build and port; it is intentionally excluded from default production smoke discovery, along with the integrated suite which has its own disconnected server. No existing smoke assertions removed. Existing CI gains an explicit Chromium integrated 237 step against the downloaded production dist; dedicated configuration starts its own loopback server. All remote requests are blocked and socket behaviour is fictional, so this proves frontend journeys only. Local Chromium+WebKit 320/390/1440 plus actual touchscreen taps of all ten frames, refresh/Back, return focus, provisional invitation and 235/236 history are checked. Native iPhone and real-origin authenticated acceptance remain NOT VERIFIED. Independent review is still required.

Exact local command: npm run release-check; npx playwright test --config playwright.circle237-integration.config.ts. Repository CI remains authoritative for required checks; report failures/cancellations separately. No claim that green tests clear missing artwork or deployment safety.

## Publication and recovery — NO-GO

Official documentation re-read 23 October:
- https://docs.lovable.dev/features/publish — publication deploys the current project snapshot; GitHub sync is not publication.
- https://docs.lovable.dev/features/projects/history — Revert restores code AND redeploys Edge Functions; it does not roll back database data. Thus Project Revert is not a frontend-only restoration mechanism.

Issue 103 still has no provider-supported/tested immutable frontend restoration path proven to exclude Edge Functions, RLS, auth, secrets, storage and Roots systems. Existing Lovable messages describe frontend-only publication as platform behaviour but explicitly lack deployed-function identifiers/checkpoints and served-artifact recovery evidence. They are reports, not an independently verified guarantee.

Observed local build seam: @lovable.dev/mcp-js's existing Vite plugin regenerates supabase/functions/mcp/index.ts from shared route constants, adding CIRCLE237. Its diff/checksums were captured and the generated file restored to exact frozen source bytes; it is not committed or deployed. The source PR has an empty supabase diff, but a build can still produce changed backend output. Do not merge/sync/publish and assume this is harmless. Provider evidence or a separately reviewed mechanism must establish that such generated output cannot redeploy the live function.

The October17 local 836→840→836 artifact-restoration rehearsal remains historical evidence only. It is NOT restoration of today's actual production deployment and is NOT Lovable/provider or installed-service-worker recovery. Preserve all old receipts.

Smallest delivery clearance: obtain a provider-supported frontend deployment/restoration operation for the immutable live website ID, with explicit exclusion of all backend systems and read-only before/after function/config identities, and rehearse that operation on an authorised isolated target. No Project Revert, production experiment, backend query or support message is authorised by this PR. No alternative host, DNS or new pipeline is introduced.

## Remaining gates / proposed execution (not executed)

1. Receive/inspect exact ten curated portraits and mappings; record bytes, readable plaque, safe public content and hashes. Until then text fallback remains; no claim the requested artwork-equipped release is complete.
2. Review exact PR head and required CI; no merge while backend publishing/restoration scope remains unproved.
3. Provider safety clearance as above; preserve the actual served frontend and proven restore instruction. Native Safari/installed-worker/anonymous and authorised signed-in acceptance separately, without real family data.
4. Separately authorised merge of only this reviewed head after unchanged-main check; sync source readback; exact built/served artifact provenance. No Roots branches or backend repair rollback.
5. Publish only once all release conditions and human approval are satisfied; verify public route, ten companions/approved images, Fire schedule, community label, both 237 modes and returns, 236/235 history, serving hashes and unchanged backend identities. Until then no usable public 237 invitation link is claimed.

Verdict: HOLD for publication. Review branch/PR and CI are safe preparation; neither is a release GO.
