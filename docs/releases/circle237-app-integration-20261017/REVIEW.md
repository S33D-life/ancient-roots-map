# Circle 237 — application integration review

17 October 2026. Local-only candidate; publication HOLD.

Source: frozen f0361bc6ae2b0109379a247b7fdfe6ed9a56602b on codex/circle237-completion-20261017. New isolated branch: codex/circle237-app-integration-20261017. No remote fetch or production check performed; recorded origin/main is 9503b07d38ba852fc9fb44f461568a9b65fee9a3, not a claim about today's remote or served site. This branch requires fresh main reconciliation before release.

## Changes

- Add application route /council/237; spatial mode /council/237?mode=spatial; invitation /council/237?c237view=invitation.
- Export the existing pilot experience as a shared component, retaining its standalone review entry. React Router now owns navigation, refresh and Back. Namespace the integrated view parameter as c237view: the existing MapFilterProvider owns view and strips incompatible values. Keep historical pilot URLs intact.
- Existing TETOL homepage Canopy leads to /council-of-life. Add a separately labelled 237 draft, spatial and invitation doorway on that page. This is a spatial page reached through TETOL, not a replacement of the historical embedded235/236 chambers.
- Confirm Opening Fire: Tuesday 20 October 2026 at 19:30 UK (BST), ISO 2026-10-20T19:30:00+01:00. Telegram is Council community only; no verified direct Fire-room link. Central question and introductions remain proposed. No completed Fire or encounter asserted.
- All ten portraits remain null/text fallbacks. Noku and Fly Agaric keep existing IDs and read-only local summaries; no live-record availability claims, private documents or external twin embedding. Other eight canonical bindings remain unresolved. No contributions saved.
- Scope styles under .circle237 to prevent page-wide changes; leave space for existing mobile app navigation.

## Exact inventory relative to frozen source

Application: src/App.tsx; src/lib/routes.ts; src/pages/CouncilOfLifePage.tsx; src/pages/council/Circle237Page.tsx; src/components/council/Circle237Experience.tsx.

Shared pilot: src/review/circle237/main.tsx; registry.ts; invitation.ts; pilot.css.

Tests: src/tests/circle237Pilot.test.ts; src/tests/circle237Integration.test.ts; e2e/circle237-pilot.spec.ts; e2e/circle237-integration.spec.ts; e2e/fixtures/circle237-disconnected-transport.ts; playwright.circle237-integration.config.ts.

Recovery: scripts/rehearse-circle237-frontend-rollback.mjs; this review note.

No supabase/, public artwork, historical Council assets, current-Circle registry, auth, storage, permissions, Staff Room, Roots or archive changes. Existing Lovable Vite plugin regenerates supabase/functions/mcp/index.ts during build from route constants. That generated drift must be restored byte-for-byte after builds and never included. A future publishing mechanism must be proven not to deploy backend outputs; no such provider proof is claimed.

## Verification and limits

Local release-check: 558 tests, 73 files; typecheck/security/assets/duplicate/static/share/build PASS; lint 0 errors, 183 warnings. Dedicated 20 unit tests PASS. Integrated browser journeys 10/10 and historical236/235 checks 6/6 PASS across Chromium and WebKit at 320/390/1440. Tests cover all ten 2D doorways, real touch on all ten spatial frames at 390, refresh, focus, Back, invitation, unknown identity/return input, and already-loaded offline reading.

Browser tests use a fictional disconnected WebSocket transport and block all external requests. The application's inherited realtime client throws synchronously in WebKit when a strict local-only CSP denies its socket. Initial unmocked failures, traces and video are preserved; this fixture isolates Council UI testing, not backend/auth/network acceptance. No production reads or real accounts were used. Native Safari/Android, installed-worker upgrades, signed-in and real-origin behaviour NOT VERIFIED. Fonts are local fallbacks under the preview policy.

The public production route does not exist by virtue of this local change. No current-Circle transition: 236 stays OPEN;235 history preserved. Source public/tetol, public/council and src/data/council remain identical to frozen source. 236 spatial runtime and Birch field journey not independently retested in full here; their source is unchanged.

## Reproducible checks

npm run release-check
npx vitest run src/tests/circle237Pilot.test.ts src/tests/circle237Integration.test.ts
npx playwright test --config playwright.circle237-integration.config.ts
node scripts/rehearse-circle237-frontend-rollback.mjs BASELINE_DIST CANDIDATE_DIST

Browser config expects a local built-app server at 127.0.0.1:4240, SPA index fallback, no-store and CSP denying external connections. Preserve traces on failure. Do not let a local test contact the shared backend. The evidence package includes the exact preview server and build artifacts.

## Rollback

Rehearsed LOCAL static artifact switch, not a Git reset or backend rollback: build exact frozen baseline into a separate worktree; preserve baseline and candidate dist and SHA256 manifests. Script switches one loopback server baseline→candidate→baseline, fetches and verifies every byte at every stage, checks SPA route index fallback and proves neither snapshot changed. Observed 836→840→836 files verified. Script does not claim browser/SW upgrade recovery or provider restoration.

Production gate: capture actual served frontend (index,version,worker and all referenced/lazy/static assets), prove its provenance and retain immutable deployment identity. Obtain/test provider-supported FRONTEND-ONLY restore on a nonproduction target. Whole-project Lovable Revert may redeploy functions and is unacceptable. Retain previous hashed assets during cache transition. Without supported restore plus backend deployment-scope evidence, production HOLD.

## Native iPhone acceptance — prepared, NOT performed

A test-only native harness is supplied in the external evidence package. It prepends the same disconnected transport fixture used by browser tests, removes preconnect tags and refuses worker installation. CSP denies all external resources/connections. Bundles/assets remain byte-identical; the served index wrapper intentionally differs and is NOT the release artifact. No sign-in or data writes are supported. It is for visual/navigation review only, not authentication, production CSP, worker or backend acceptance. The strict uninstrumented local preview hits an inherited WebKit realtime exception when CSP denies its socket; no unrelated application repair was included.

Native harness is prepared for trusted local Wi-Fi, port 4241. Confirm the actual interface/IP at session time; never assume a historical address. Loopback is not a phone address. Native Safari/Android remain NOT TESTED.

Native acceptance steps: record exact build+manifest, device/iOS version; open /council-of-life→237 draft→all ten 2D doorways→return; refresh and Back; Noku/Fly local identity and exact companion/mode return; TETOL Canopy→spatial; actual finger taps, vertical scrolling and orientation change; dismiss First Walk when shown and verify return controls stay reachable. Check 320/390-equivalent portrait, landscape, large text, safe areas; ten text fallbacks; Fire date/BST; provisional question; Telegram labelled community. Simulate loaded-offline/lazy3D failure; confirm 2D remains available. Test fresh offline/installed-worker behaviour separately; no guaranteed cold offline entry is claimed. Verify 235/236 history and Birch returns before release.

## Remaining approvals / HOLD

1. Independent review of this local candidate and fresh main reconciliation.
2. Editorial question/intros/naming approval; portraits remain missing/unapproved unless text-first release explicitly accepted.
3. Independent review of the native disconnected test harness and real-device acceptance; production auth/privacy and old-worker acceptance not covered by fictional UI tests.
4. Actual served baseline and provider frontend-only publication/restoration evidence, including generated MCP backend side effect.
5. Separate push/PR, merge and publication GO. No backend change, current-Circle transition or release approval is implied.
