# Ancestral Roots #98 — isolated interface review, 15 October 2026

Base: main df9041d86eb4583cb0e842706105bb0a0180c7e8. Branch codex/ancestral-roots-issue98-20261015. Local review only; no push, merge, deployment or production write.

## Preserve / reuse
Existing grove_roots is the relationship; life_grove_offerings retains family memory. Reused AncestralInscriptions, RootPortal, SignatureMark, FullscreenTreeView, existing repository functions and approval mutations. No new OfferingType, tables, RPCs, storage or notifications. No family/Grove inspection or real family content. #95, #96, #97 and #100 remain separate.

## Interface diff
- Individual Ancient Friend: Memory → Archive adds Ancestral Roots with viewer-visible active count from existing list_tree_inscriptions RPC; ordinary offering totals/types untouched. Empty offering copy does not misdescribe the Roots section.
- Encounters: restrained doorway to the same Archive category. Existing Overview bark marks remain; Radix mounts only the active section, avoiding parallel portal owners.
- URL: ?tab=memory&view=archive&category=ancestral-roots, optional root=<returned-root-id>&rootView=grove. Preserve all unrelated Circle/Map context. Back, refresh, leave Grove and close portal stay on the same tree; focus returns to the mark. Legacy tab=living/offerings/ethereal remain understood. No arbitrary return URL.
- Only listed marks can open; can_enter gates Grove and media queries/rendering. Query caches include viewer identity. Missing/revoked Grove shows a calm unavailable state. Main page does not fetch marks before the tree itself resolves.
- One loading/error/empty view; handwritten accessible name preserved. No root creation/edit controls added on the Ancient Friend.

## Fictional personal preview
S33D_ROOTS_REVIEW=1 enables a separate HTML build entry /review/ancestral-roots.html. Default builds exclude it. This entry avoids the main application's telemetry, auto-sync and onboarding shell, seeds only a fictional query cache, and uses the SAME inscription/portal/immersive components. No backend permission is granted. The outsider/member/denied/empty controls are demonstrations, not authentication. All sample identities/text/signature strokes are invented; there are no photo/audio/video uploads or remote media URLs.

Local URLs: /review/ancestral-roots.html?visitor=outsider&tab=encounters and ?visitor=member&tab=memory&view=archive&category=ancestral-roots. Preview is trusted Wi-Fi only, not public hosting. No guaranteed iPhone Safari parity until real-device review.

## Read-only live audit (no family rows read)
Lovable query_database on existing managed project confirmed actual list_tree_inscriptions: active status filter; public inscriptions or contributor access; names/title/dedication disclosed only by named mode or contributor membership; can_enter requires Grove view permission plus entry-mode rule. Retrieved current relevant RLS definitions and confirmed offerings-private bucket public=false. Existing notification trigger covers proposed/pending approval requests, not final-active member notices.

This is definition/configuration evidence, NOT end-to-end family privacy acceptance. The public RPC returns associated grove UUID for marks; public mark_only is an intentional discoverable relationship, not a secret Grove ID. UUID knowledge must not grant media access. Live private-media function/deployed source, direct/signed-object access, invite expiry/revocation, contributor withdrawals and restoration still require independent tests using consented test accounts/assets. Do not test grandmother/cousin data implicitly.

## Privacy acceptance matrix
| Viewer | Interface expectation | Evidence today |
|---|---|---|
| Anonymous/public-root visitor | Public active mark only; private Grove entry denied; no family media fetch | Synthetic browser + unit pass; live definitions inspected |
| Signed-in unrelated user | Same restriction; account-keyed cache cannot reuse another viewer's Grove | Scoped query keys; real two-account test pending |
| Invited cousin | Only currently authorised Grove contents; invitation/revocation respected | Fictional member journey pass; actual invite/media tests HOLD |
| Grove steward | Existing approvals and private archive, no auto tree permission | Existing flow unchanged; live role rehearsal HOLD |
| Tree keeper | Root review rights do not imply family-media rights | Separate existing authority functions; role test HOLD |
| Revoked/missing Grove | Never render cached contents without current entry capability / Grove row | Synthetic missing-row/denied scenario pass; live revocation HOLD |

Existing offering SELECT policy permits contributors to read Grove offerings and authors their own contributions; verify consent semantics for each intended pilot role. No policy was changed here. No blanket privacy PASS claimed.

## Tests / known limitations
Unit tests cover context/legacy URLs, public mark without private fetch, forged root ID, RPC error vs empty. Browser suite covers touch at 320/390 and desktop1440, memory opening, refresh in Grove, Back stack, focus return, denied/empty/anonymous, and actual TreeDetail Archive integration with synthetic responses. Every remote request is intercepted. Existing tree_page_views POST attempts are captured/mocked, never sent live.

Initial actual-page mobile run failed because existing First Walk/BottomNav covered the mark. Tests exercise Dismiss trail and center the mark before ordinary interaction, without forced clicks. Onboarding remains unchanged; first-time real-device dismissal is a release gate. Traces/videos/errors retained. No native Safari or actual signed-in family test claimed. No GitHub CI run because no push authorised.

## Bounded integration / approvals
1. Review the interface and fictional preview. Approve any later push/PR separately. Production frontend release requires normal CI, main reconciliation and confirmation Lovable will not deploy backend changes.
2. Before real-family pilot: consented test accounts (outsider, contributor, steward, keeper), live RLS/RPC/media/invitation matrix, non-sensitive media, independent recovery export + isolated restore drill. Only then seek approval for exact pilot writes/uploads/invitations. Keep mark_only/members_only defaults. Ely requires #100's real Atlas UUID and independent Root approvals; no link now.
3. Optional active-Root notice: reuse notifications + NotificationsBadge. Default OFF per user/Grove opt-in; trusted pending→active/approved direct-active transition; dedupe root activation and recipient; exclude actor; current membership rechecked; no private names/marks/dedication/media URLs. Generic authenticated deep-link to Grove roots. Re-activation semantics and opt-out/revocation must be reviewed. No new email/push. Requires a separate minimal preferences/trigger migration, RLS tests and explicit GO; NOT implemented here.

Rollback: do not merge to cancel this candidate. Later frontend rollback restores prior artifact/source; no data migration rollback needed because this diff writes no backend configuration/data. Existing backend/privacy repairs must be preserved during any eventual hosting publication. Fictional review bundle is not a production approval.

## Final local gate receipt
- Full release-check PASS: 531 unit tests / 69 files; typecheck, security, asset, duplicate, static Council/share guards and build pass.
- Lint: zero errors, 180 warnings (one review-entry Fast Refresh warning; existing source warnings otherwise). Review-only entry is excluded from normal builds; normal production build also verified separately.
- Browser: 17/17 PASS: nine new Roots scenarios plus eight existing auth/navigation/public-route regression checks. Touch-enabled contexts used at 320/390; desktop 1440. Fictional memory opened and closed through the reused viewer.
- Initial failures retained separately: inherited First Walk interception on mobile; test selector ambiguity for two existing memory-close controls. No force-click or weakened permission assertion used to pass.
- No GitHub CI (local branch only). No actual family-account, native iPhone Safari, media revocation or restore acceptance claimed.
