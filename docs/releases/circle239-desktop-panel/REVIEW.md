# Circle 239 desktop panel: failure and bounded correction

Baseline: main2fe6837b0be5d5f8555d9965d9d28a6eeefffcd9. Independent of funding122 and all other drafts.

## Reproduction and cause

At1440px, open the original tetol.html?circle=239#croom. Wait for original Grace stillness (>12seconds). The DOM aside#panel has opacity0 and pointer-events:none; the Tree underneath becomes the hit-test target. The prior live verifier explicitly waited for g-still then attempted to click that inactive panel. Normal pointer movement already wakes it. That failure alone was not proof of a raycasting, camera, frame-hitbox or z-index defect.

A genuine keyboard case remains: focus a companion button, leave it focused while reading for12seconds. Stillness hides the focused panel. Both Chromium and WebKit regression tests fail with pointer-events:none before this correction. The original pointerover-based g-reading mechanism does not cover keyboard reading.

The original companion panel is DOM UI, not a3D mesh; raycasting selects hanging artwork separately. No renderer, camera, geometry, artwork, scene composition or hitbox changes are necessary.

## Correction

Circle239 only: one desktop min-width601px :focus-within style in the modern entry adapter keeps an idle focused panel opaque and pointer-enabled. Unfocused stillness remains, normal pointer wake remains, and phone rules remain. Frozen classic-1/classic-2 sources and all historical scenes/assets are unchanged. No silent test force-click or broad z-index override.

## Acceptance

New desktop fixture reproduces natural idle, verifies ordinary pointer wake, then verifies focused keyboard reading stays usable after the real timer. It exercises all ten default-front/reverse pairs through keyboard and mouse, full texture UVs, focus, refresh/Back/Forward, return to Deck and239→238→239. It uses the original renderer with bounded continuous software-GPU drawing and explicitly draws tested reverses, following the existing fixture approach. This does not certify native rendering performance or unobscured camera framing.

Run: npm run release-check; npx playwright test --config playwright.living-frames.config.ts; node scripts/check-council-public-bytes.mjs. Desktop before/after screenshots and traces live under output/playwright/desktop-panel*. Test outcomes and exact commit are reported in the PR receipt; no approval is implied by this document.

Known390px camera clipping, old browser/PWA shell behaviour and actual native iPhone Safari/VoiceOver acceptance remain separate. No new mobile or historical behaviour is intentionally introduced. Human source merge and frontend publication require separate GOs. Frontend recovery is a separately approved source-based build of the previous main; no History Revert or backend rollback.
