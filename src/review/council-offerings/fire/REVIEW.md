# Council + The Fire — isolated no-write review

29 Oct 2026. Fire V1 frames1–9, downstream of draft #130 `6214b36e0004cea60833ac065274adb2b83c28d0`. No acceptance, merge, publication, persistent submission or live Fire implied. #130/#127/#131/#135 branches remain untouched.

## Already implemented and reused

#130's `Composer.tsx`, `Invitation.tsx`, six primary offering types, future-companion nomination, accessibility work, optional Circle238Page hooks, synthetic photo/audio helpers, fonts, dialog classes, no-write server/CSP and original TETOL iframe. These are reused, not rebuilt. Companion offerings and suggestions retain their existing separate journeys. `FireComposer` is one shared Fire interaction for both entry surfaces; it reuses those visual/primitives/media helpers but has a separate intention model instead of forcing Fire consents into the companion model.

## Changed here

- `fire/model.ts`, `FireComposer.tsx`, `FireArea.tsx`, `fire.css`: five practices, only words required, optional context/synthetic media, private-first curator intention, separate read-aloud opt-in, safety routing and accurate demo receipt. No public-publishing consent or implementation for future frames10–12.
- `main.tsx`: review-only 2D doorway; original Deck action rebinding for Circle238 at croom/live_fire/seat_you/c233rec; original camera, renderer, #grab and sheet gestures untouched. Query-based overlay history and stable iframe source preserve Back/refresh/context. Active238 stale live_fire eyebrow is corrected only in review DOM, not historical or renderer source.
- Fixture Vite/Playwright configs: optional `OFFERING_REVIEW_PORT` isolates the served version from a pre-existing preview. No workflow, production server or network policy change.
- New mocked unit and browser coverage, plus this receipt.

Untouched: existing Council composer/accessibility files, shared offering-kit, Circle238Page (relative to #130), public runtime/geometry, all Circle manifests/images/history/Staff Room, auth/backend/storage/RLS, ordinary Ancient Friends offerings and #135. The standard production build has no Fire entry point.

## Design provenance and explicit precedence

Read and visually inspected Claude's [r2 handoff](https://drive.google.com/file/d/1OETD-b22S3ICQfvb8uPljk0KjD8inkNP/view) and [r2 storyboard folder](https://drive.google.com/drive/folders/1jqcQkyUxfI5Mt5VwxlJ7vUclDiiyC5Jl). Local Drive bytes match supplied manifest:

- Handoff: `e7d9c76e3453150382de5b30e9cbffe6a412f45098c6b23f8cba7e22a9ee2064`
- HTML: `e870a725ee4253b6a5740519efb0af940ce6eb6a1b786b7256155890efa0643a`
- Storyboard PNG: `24d819682bfea5a03c2b9e1abfe0fb4d9319e73ecc2eee6adf7f83f8b3757231`

No Claude media is copied into the repository or used as factual data. Ed's current explicit fixture GO supersedes the older design handoff's wait-to-start note, but not native/release/persistence gates. Ed's exact welcoming question “What happened?” is used at entry. Night Grove arrival/receipt and Living Parchment composition/consent follow r2. Curator review is an explicit, initially unchecked radio intention; read aloud is a separate unchecked opt-in, disabled until curator review and cleared when returning to Only me. Choosing review never implies public consent. Default live tile is not happening now / no confirmed scheduled Fire. Hand-set gathering/afterglow/remembered states are QA-only, visibly synthetic, never clock-derived or a live announcement.

## Local review (Mac only)

```sh
npm ci
OFFERING_REVIEW_PORT=4246 npx vite build --config vite.offering-fixture.config.ts
OFFERING_REVIEW_PORT=4246 npx vite preview --config vite.offering-fixture.config.ts
```

- `http://127.0.0.1:4246/review/council-offerings.html?companion=hoopoe`
- `http://127.0.0.1:4246/review/council-offerings.html?view=deck&node=live_fire`
- Reviewer state only: add `&qa=1&fireState=gathering`; no live joining link exists.

The build is checkout-dependent and serves approved static public assets from this checkout. Use the exact candidate SHA, not an old process on another port. `127.0.0.1` on an iPhone points to that phone, not this Mac. No LAN bind, public tunnel or protected deployment is authorised or performed.

Walkthrough: meet Hoopoe → Offer something → choose Message (or another of six types) → compose → select holding intention → demo receipt → return to Hoopoe. Then Bring something to the Fire → Notice/Tend/Gather/Make/Learn → What happened? → optional extra context → Only me or explicit curator-review intention → separately opt in to read aloud if desired → demo receipt → Return to Council. Listening creates no example. New Fire offerings reset consent; refresh discards all words and session examples. Existing companion suggestions are for a future Circle, not addressed to the current companion.

## Acceptance and no-write proof

```sh
npm test -- src/tests/CentralFireFixture.test.tsx src/tests/CouncilOfferingFixture.test.tsx
npm run typecheck
npm run lint
OFFERING_REVIEW_PORT=4246 npx playwright test --config playwright.offering-fixture.config.ts
```

Tests cover both existing companion and Fire journeys in Chromium/WebKit;390px,1440px,320px,landscape; keyboard/question focus, accessible descriptions, consent independence/reset, listen/close focus, same companion/node, browser Back and refresh, synthetic media, zero normal-flow write requests, server405 for a synthetic POST and403 for backend paths. Unit source checks prohibit backend/upload/capture/persistence imports. Browser external requests are blocked; server is read-only with no backend routes; media are synthetic, no file chooser/mic/camera access. State is component memory only. These tests do not establish live RLS or production safety.

Screenshots: `output/playwright/offering-fixture/*fire*`. Standard application/CI and fixture workflow must be read at exact candidate SHA; screenshots before a commit are provisional. No simulated touch or WebKit result is native Safari acceptance.

## #127/#131 reconciliation — explicit HOLD

#127 `d926be725328d092e053dcd85bd4d2fa32fd727c`; #131 `9ee4b430da033fb2d268aeb10a1b5afaaa74eade` targets #127. #130 `6214b36e` targets main. All were green at entry check. Read-only three-way comparison of main/#127/#130 produces **two shared-page conflict blocks**: ReactNode/hook props/import versus companion-lore import; heading/status/encounter/gallery copy and slot insertion. This Fire delta does not touch that page or any public renderer files.

Later human-approved reconciliation must retain #127's StarPod heading, lore and guided navigation, add #130's inert optional slot props, and avoid duplicate lore. Then recompute diffs and rerun the full combined navigation/frame/fixture suites. Do not merge both page versions blindly. This draft's preview uses #130's baseline original Tree; it does not claim #127/#131 are merged or native accepted. The old 3D sign may still use Fig-wood wording on that baseline; Fire dialog and 2D heading use StarPod. Renderer/sign corrections belong to the existing navigation candidate, not this Fire fixture.

## Native acceptance and proposed protected route — NOT executed

On the exact future approved combined candidate, check physical iPhone Safari + VoiceOver: entry from2D/originalDeck; six companion types and nomination distinction; all five Fire practices; 44px targets/84px tokens; one-thumb scroll, safe areas, toolbar/keyboard/orientation changes; question focus and readable options/descriptions; Close/Escape-equivalent, Back/Forward/refresh; listen without receipt; consent reset and no implicit read-aloud/publication; return to same companion and #grab/sheet state; original camera gestures, Circles234–238 and Staff Room.

Proposed private access, requiring separate Ed GO: if an approved Tailscale tailnet already exists, join only Ed's Mac/iPhone under a device-restricted ACL and use **tailnet-only Tailscale Serve HTTPS** to the loopback4246 preview (`tailscale serve --bg http://127.0.0.1:4246`), never Funnel. Use the actual assigned HTTPS hostname after verification; no invented preview URL. Any installation/account/network change needs explicit approval. Revoke with `tailscale serve reset`. No production S33D.life DNS/Auth/backend changes or public tunnel. Until that separate approval, review on this Mac; native-device acceptance remains UNVERIFIED.

## Later real-use work — no GO here

Separate canonical Ledger persistence, exact Circle/companion/source-offering IDs, access/revocation/withdrawal/idempotency, private media validation/signing, curator roles, distinct read-aloud/publication consents, export/recovery and served/native proof. Never loosen offerings.tree_id, fabricate tree IDs, duplicate existing offerings, create automatic rewards or infer attendance/Fire schedules. Frontend fixtures are not a live release.
