# Adaptive Council frames — review only

Stacked on PR #127 at d926be725328d092e053dcd85bd4d2fa32fd727c. This branch does not modify #127. Review the incremental diff against its branch; after a separately approved merge, retarget and recompute the diff/checks.

Current 1120×730 textures were complete: camera/viewport and sheet overlap caused clipping. The independent fixed-backing orientation defect is also addressed. Circle 238 only: bounded uniform image containment, .04 wood border, aspect-derived backing and cord attachment, full default UVs. Decoded dimensions replace metadata dimensions on image load. The complete hanging assembly fits above seats and below the 2.55 hanging line. Scene data, original artwork and historical geometry remain unchanged.

Selected-camera fitting excludes actual overlay rectangles, safe areas and visual viewport, including transitions/orientation. An off-axis camera projection positions the assembly inside that usable area without moving the camera below the Deck. Projection resets on other nodes/editions. Stable bounds do not reset user gestures. The full mobile companion sheet is capped at 70dvh (or less with safe-area/short-screen minimum), with existing scrolling, because the original full state leaves no useful picture viewport. This cap applies only to Circle 238 companion context, never gathering/history.

## Files

- public/tetol/circle-235/pre-fire/runtime/entry.js
- public/tetol/circle-235/pre-fire/runtime/council-frame-layout.js
- src/tests/councilFrameLayout.test.ts
- e2e/council-adaptive-frames.spec.ts
- playwright.frames.config.ts
- .github/workflows/council-adaptive-frames.yml
- artifacts/adaptive-council-frames-review.md

## Verification

Pure geometry/fit tests cover landscape/portrait/square/10:1/1:10 and invalid dimensions. Browser matrix checks all ten actual decoded scenes at 390×844, 844×390 and 1440×900, full UVs, projected backing/cord bounds, sheet states and reload; edge-marked fixtures use browser response substitution only. Existing #127 touch, navigation, Time Tree 234–238 and Staff Room tests must also pass. CI/software rendering and desktop WebKit are not native iPhone evidence. No artwork file or manifest is edited. No backend, Auth, permission, DNS, deployment or persistent data change.

## Native iPhone Safari — required, not yet verified

- Record exact candidate commit, served entry/module hashes, device/iOS, viewport/orientation, standalone/PWA vs Safari. Check fresh and existing-cache tabs; no claim that CI proves the live origin version.
- Enter from 2D and confirm approved StarPod heading, question, CURRENT/OPEN and no scheduled Fire.
- Meet all ten companions. Verify all four artwork edges and full hanging frame in peek/mid/full sheet states, portrait/landscape and safe areas. Scroll the expanded panel and confirm the intentional retained picture area is usable.
- Tap portraits/edge targets, Previous/Next/chooser and return to gathering. Pan/pinch/orbit; stable sheets must not snap the camera back. Resize/orient or change sheet and confirm refit. Check off-axis picking matches visible targets.
- VoiceOver names/order, control labels, focus and enlarged text. Keyboard/switch access where available; reduced-motion navigation.
- Refresh/deep links, Safari back/forward, 2D returns. Walk 238→237→236→235→234 and forward, encounter/return in each supported edition, Staff Room and older records. Historical frame layout must match the baseline.
- Reject release if full-image containment is lost, controls obscure it, picking/gestures regress, cache serves mixed runtime/module versions or history changes.

## Reconciliation

#127 navigation first after human approval; this frame draft downstream, retarget only after separate authorization and green recomputed checks. #130 remains an independent demo branch based on main, overlapping Circle238Page.tsx with #127 and using the old main Deck presentation. Reconcile #130 by preserving #127 as the source for headings/lore/navigation, then reapply only inert optional fixture props and harness changes. Do not merge a stale whole-file replacement. Claude design reconciliation is separate from these renderer files. No production or backend release follows automatically from any merge.
