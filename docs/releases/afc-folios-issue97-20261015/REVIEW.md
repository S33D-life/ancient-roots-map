# Issue #97 — isolated Ancient Friend folios, 15 October 2026

Status: LOCAL REVIEW CANDIDATE ONLY. No push, merge, deployment, backend mutation, photo upload, Circle 237 opening, Staff Room/NFT or commerce work.

## Recovered source vs current main
- Repository: S33D-life/ancient-roots-map.
- Current main inspected: df9041d86eb4583cb0e842706105bb0a0180c7e8. Actual public version.json fetched with a browser user-agent: 6d4071d, generated 2026-10-12T23:25:16.437Z. GitHub main and served frontend are different checkpoints.
- Frozen PR #96 stays 1fdbc5dca61789123e1657187ce52905da673e3f, clean and unchanged. Its existing iPhone preview is independent.
- Claude bundle head 08c02d9ae00feab34c15bc143751f37f5a86ec37; base 23004e2ebb28331f1595d22ac7e3c499153b1334; tree 95ee1dd11aba92c88eea26a14422a3093d17a99d.
- Bundle SHA256 07a0babb245e8b9bdc1d2aa36c843b5105449c80adb2f1d0d5c1de7868f60acd; mbox SHA256 739fb81dab742ed611515a49ecb2757f579718eb0c825497df78da159dd1c883. Both match the recovery receipt. git bundle verify passes.
- Five commits recovered: a6b84502 (record doorway), 90a83fbf (canonical name), b5f5c014 (explicit companion return), 8dabb56e (browser tests), 08c02d9a (handoff). Original objects preserved on local codex/recovered-ely-phase0-08c02d9a; detached worktree /tmp/s33d-ely-phase0-recovered-audit. Its 23 focused unit tests passed independently.
- A merge simulation finds conflicts in companion-frames.js, CouncilOfLifePage.tsx and birchLivingThread.test.tsx. Nothing was merged or cherry-picked.

| Phase 0 element | Decision for this candidate |
|---|---|
| Exact research identity / canonical name | Reuse identity and Ed confirmation; not a trees.id |
| Named companion + query-surviving context | Selectively reuse contract via existing strict parser and registered appearances |
| ResearchTreeDetailPage mount / full row read | DO NOT PORT; curated static safe projection instead |
| PREPARING / backend235 snapshot | Preserve in archive; do not copy into present Circle236 |
| Canonical-name commit 90a83fbf | Reviewed separately; name used only in new review surfaces |
| Existing 2D/3D Circle changes | No replacement: separate review routes and explicit afcPreview opt-in |
| 22 mocked browser tests / 4 smoke failures | Historical claim, not current-main evidence; own tests run separately |
| PR #92 access/location/provenance work | Held separately; no whole-source merge, no og-proxy deployment |

## Read-only identity and privacy audit
Anonymous GETs selected only id/tree_name/species_scientific for Ely and id/name/species/accessibility_tier for Noku. No full research rows, precise locations, personal profiles or private encounter fields were requested.
- Ely: research_trees.fc085265-5a4f-46f0-a616-f3b869bea8b0, Bishop's Plane, Platanus x hispanica. Ed has confirmed the individual match. No permanent trees.id created or guessed.
- Noku: existing public trees.59eb1fe8-3c29-4696-ae00-f42edeb1c886, Unabantu Nokuphila, Ficus natalensis. This UUID is reused, never duplicated. Source/taxon reconciliation remains explicit.
- Current ResearchTreeDetailPage selects research_trees(*) and verification_tasks(*), maps research coordinates into TreePageHero/map navigation, and exposes promotion/task controls according to existing user/keeper logic. Repository migration 20260214121121 creates SELECT USING(true) on research_trees. A source policy is NOT proof of current live RLS configuration. Only the limited anonymous identity query was verified live; authenticated and column-level privacy guarantees remain UNKNOWN.
- Therefore no new folio links into the full research detail page. New folios perform no research data fetch, include no coordinates and publish no private Notion/source URLs. The existing research page and all policies remain untouched.
- Global application providers/auth/backend configuration remain existing code, not a separately isolated backend. Browser checks mock external requests. Do not claim real authenticated or production privacy acceptance.
- No supabase/, RLS, auth, storage, config, .github/, .lovable/plan.md or artwork changes are included. Existing broad research-page risk and backend recovery/OG issues remain independent release blockers, not repaired by this preview.

## Identity/source contract
AFC is an appearance relationship, not a recognition tier or new database. public/review/afc-folios.json is a curated review projection of existing IDs and source-attributed summaries. It does not persist a new identity.
Ely's eight approved documentary derivatives remain held; Photo9 private and Photo10 Council illustration only. No originals/derivatives copied or uploaded. The existing Ely illustration is labelled as illustration.
Noku's private working source and guardian material were inspected read-only. No private contact, location, quotation, photograph or document URL is exposed. Ian's restrained attributed summary remains guardian-approval gated. Circle234 is preserved as prior appearance; Circle237 is PREPARING with Noku alone chosen. No question, Fire, other companions, physical Pod or livestream is invented.

## Routes and return contract
- /review/afc/council/236 and /review/ancient-friends/ely.
- /review/afc/council/237 and /review/ancient-friends/noku.
- /review/afc/council/234: historical relationship study, NOT a replacement for the original Circle234 record.
- Spatial study: existing room, ?circle=236&afcPreview=236|234|237. The legacy circle=236 parameter boots the existing frame/presence renderer; the explicit review adapter supplies the selected study. It is NOT a public237 manifest or change to current-Circle projection.
- Only registered circle/companion pairs can return. returnContext transport is validated; cross-identity, duplicate, foreign focus and hostile URLs fail closed. Return includes mode, returned=1 and exact companion id; refresh and Back do not depend on transient history.state.
- Both model/frame share existing companion identity. The preview adds an HTML folio action to the selected companion panel. No new chamber, elaborate model or generated evidence.
- Full-screen spatial link is the recommended phone entry. The embedded frame remains available for desktop.
- Library and existing Noku Atlas profile are existing route links. Browser Back retains the folio context; their pages are not modified to add new return controls. No permanent QR routes approved.

## Sources inspected 15 October
- The Tree Council: https://treecouncil.org.uk/science-and-research/the-london-plane-of-ely/ — live stream section confirmed, 2025 pruning / April2026 bracing source. External credited page link only; no player embed, stream copying, source-image download or uptime assertion.
- Cambridge: https://www.eng.cam.ac.uk/news/cambridge-engineers-lend-support-uk-first-conservation-ancient-trees — project source linked, no unqualified partnership or copied imagery.
- Private Ely and Noku Notion records consulted; private URLs intentionally omitted from runtime output.

## Proposed files
- Shared curated public projection, typed lookup, strict contextual return helper and isolated route patterns.
- One semantic HTML folio + two study entries; reuse existing ParchmentGround. Readable mobile/desktop text, source statuses, timeline, explicit source links, accessible return and reduced-motion CSS. No page-turn animation needed.
- App registers only new review routes and suppresses FirstWalk only on these routes. Existing onboarding unchanged. Initial mobile test demonstrated intercepting FirstWalk overlay; failure retained and scope-limited correction verified.
- Existing spatial adapter gains a query-gated import; entry.js one conditional uses preview circle when present, existing236 otherwise. All other room and Staff logic unchanged.
- Unit/browser tests and this receipt. No package/dependency changes.

## Release and rollback gates
1. Ed reviews both isolated folios, source treatment and proposed file diff. Physical iPhone Safari and keyboard/screen-reader review remain separate from Chromium emulation.
2. Guardian consent / source-image rights; approved gallery byte/provenance handoff. No upload authorised here.
3. Independent frontend/privacy review, real-origin anonymous/auth tests, verifiable frontend-only delivery and production/Edge recovery. Unsafe research lookup stays held.
4. Any permanent Ely creation or promotion and relationship writes need separate explicit GO; none required for curated preview.
5. Only after review: separately authorise push/PR, merge and publication. No changes to PR#96, #92, #95 or backend235 projection.
Rollback of this local study: stop its preview and remove its isolated branch/worktree only after preserving evidence. Future source rollback is a reviewed revert of this isolated diff; no data rollback is required because it writes no data. Do not alter unrelated production or frozen release records.

## Interaction findings retained during development
- Initial 2D phone clicks were intercepted by FirstWalk and bottom chrome. FirstWalk is now omitted only on new review routes; phone reading reserves bottom space. Six corrected 320/390/1440 refresh/focus/Back journeys passed.
- Initial embedded spatial tap could be outside the visible iframe viewport. A full-screen spatial doorway is now explicit for phones; the embedded study remains for desktop.
- The first spatial test selector also matched hidden scene labels. Tests now address the visible panel and wait for arrival to finish; no forced DOM clicks.
- Inherited g-still can disable sheet pointer events; the opt-in adapter keeps its sheet visible AND pointer-enabled during stillness. However, direct touch-event instrumentation showed the unwanted selection was NOT caused by missed pointerdown/up: both targeted grab correctly. The sheet expands on pointerup, then a compatibility click hits a newly positioned companion button. The adapter consumes only that touch-handle sequence’s compatibility click, preserving later taps, swipes and keyboard clicks. An assertion checks that handle expansion does not select another companion. This is not a repair or claim about PR#96’s separate CI timeout.
- Noku's newly projected node initially inherited Ely's botanical description from the existing base node. The adapter now explicitly supplies per-specimen species/part, neutral location/source/status notes; no Ely identity data is used for Noku.
