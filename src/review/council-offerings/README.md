# Council Offerings V1 — isolated interaction fixture

Draft #130, based on main e2f2830f0af383f14d7f0165cd3eb9be4ec9d057. Review harness only; no live offering system or Council Ledger record.

## Core decisions and design provenance

Claude’s 28 October fidelity review, two comparison sheets, all fourteen individual 390px frames, and full offline prototype were retrieved from the supplied [Drive folder](https://drive.google.com/drive/folders/1_h-XxY9jqtjsaJquirqo1Lah4jr5Ez84). The full prototype was exercised offline with HTTP requests blocked. Reference assets stay outside the production tree. Embedded Cinzel, EB Garamond and Inter font subsets come from that prototype (its SIL Open Font License attribution is retained in fonts.css). Artwork uses existing manifest URLs; no original bytes are changed or duplicated.

One Composer renders both host themes: Night Grove for the Deck and Living Parchment for 2D. Selection is six 76px-or-larger circular buttons around the companion disc, clockwise Song, Story, Photograph, Voice, Message, Poem. Keyboard/DOM order matches. Below 340px a grid replaces the ring. The separate dashed suggestion path and quiet exit follow the reference.

Normal path: invitation after lore → select → compose → holding → placing → demo receipt. Private is preselected. The separate optional curator-review choice requires asking the contributor before public sharing. All three promises are explicitly labelled future design, not implemented features. Every sheet says “DEMO · nothing is saved”; receipt says “Demo receipt · nothing was stored or sent.” Attribution input is removed. A receipt detail uses “a Wanderer · demo”. Seed privacy is conditional future wording. No Moonroot system is implemented; its optional P3 preview is deferred.

## Active build / run

```sh
npm ci
npx vite build --config vite.offering-fixture.config.ts
npx vite preview --config vite.offering-fixture.config.ts
```

- 2D: http://127.0.0.1:4242/review/council-offerings.html?companion=bishop-ely-plane
- Original Deck: same URL with `&view=deck`.
- Reviewer controls: append `&qa=1`. Only this mode exposes surface switches, source-offering reference, preview/outcome QA, build receipt and error simulation. QA mode is an explicit review flag, not an authorisation boundary or deployed feature.

Close/Escape and receipt return discard the in-memory draft, preserve companion identity and focus the originating invitation. “Meet the next companion” follows the existing manifest order and uses the existing Deck navigation API or 2D companion query. Opening a new offering resets privacy to private. Back within a draft retains its explicit choice. Reduced motion skips the timed placing stage.

## Isolation and #127/#131 integration

This PR stays main-based and fixture-only. Public/runtime and backend files are unchanged. `Circle238Page` has inert optional render hooks and preview heading only; no callback means no invitation, including forged `qa` query parameters. The fixture supplies a copy of #127’s exact approved lore from d926be725328d092e053dcd85bd4d2fa32fd727c in lore.ts. It uses the approved StarPod naming in its page and offering sheet.

In the Deck the harness adds one invitation after approved lore and before later navigation. On main, which predates #127, it supplies approved lore in the harness only. Where #127/#131 already supplies that lore, it reuses it. It uses the existing grab button once to make the companion’s mid sheet accessible, then leaves the current sheet state and controls intact. Scrolling the existing panel reaches the invitation without pulling to full. No renderer, camera, frame, gesture or historical content edits are included.

**Reconciliation rule:** #127 owns the final Circle238Page heading, lore, navigation and public copy. Reapply only the optional fixture render hook/preview title from #130 when resolving its page overlap, with the invitation after lore and before Return. Do not restore main’s Fig-wood heading, old review notice or older accuracy copy over #127. #131’s seven files have no direct overlap with this fixture. Keep #131’s geometry/camera/sheet cap unchanged; close/return must retain its existing sheet state. Manifest order, IDs, Circle 238 query and companion hashes remain authoritative.

A separate local integration checkout combines #131 at 86ab252114a438db00dff3815655b74feb23605b (including #127 at d926be72) with only these fixture files and a manual page-hook reconciliation. Its receipts are distinct from #130 CI and do not imply a merged or deployable release. No PR base changes, merges or publications are authorised here.

## Safety and verification

In-memory only. Song/photo/voice are synthetic fixtures: no external search, upload, camera/library, microphone, auth, rewards, submission persistence or database import. Poem input reuses offering-kit. A synthetic source ID is reviewer-only and never copies its private body.

The separate loopback-only Vite server rejects non-GET/HEAD and backend routes, uses self-only network CSP and no-store, and substitutes per-document memory for Tree preferences. Standard application build emits no fixture HTML/route; the separate build needs this checkout’s static Tree/Council assets. It is not a public hosting package.

```sh
npm run test -- src/tests/CouncilOfferingFixture.test.tsx
npm run release-check
npx playwright test --config playwright.offering-fixture.config.ts
```

The path-scoped Actions workflow runs Chromium/WebKit journeys and uploads comparison screenshots. Tests check ring bounds, both hosts, independent holding/private defaults, optional review, receipt, next companion, return focus, narrow/landscape layouts, reviewer-only unknown outcomes, suggestion privacy, no attempted write requests and no page errors. Desktop WebKit does not prove native iPhone Safari/VoiceOver acceptance.

## Remaining native iPhone acceptance

- Safari at 390px, smaller iPhone and landscape: safe areas, browser toolbar changes, readable sheet and scroll with software keyboard open.
- VoiceOver: dialog announcement, logical clockwise ring order, radio group labels/state, all controls discoverable, focus trap, Close/Escape/hardware keyboard return focus.
- Touch: offer without pulling companion sheet full, normal panel scrolling, no gesture interception, same companion/hash/2D query after return; next companion follows manifest order.
- With #127/#131 combined: opening/closing the offering leaves frame fitting and sheet state intact, original camera gestures and historical Circles still work.
- Reduced Motion skips placing; normal motion is comfortable; refresh loses draft; no camera/microphone/library prompt and no real submission.

## Public copy / longer-term language

User-facing copy follows Claude’s invitation and receipt guidance, with conditional demo language. “Different friends. One living song.” is a decorative receipt refrain. No long-term governance, withdrawal, storage, Moonroot or curator system is claimed to exist.
