# Council + Fire fixture refinement — 29 October 2026

Review only; based on #136 d81d945c0f033bb1073bcad0812ed33f1b5c7712, stacked on #130. Claude's independent acceptance reviewed #130, not this combined fixture. This refinement follows Ed's three subsequent priorities; no new Claude acceptance is claimed.

## Bounded changes

- Companion invitation: “Leave something with [name]”; private confirmation: “Keep this private (demo)”; review confirmation: “Propose for curator review (demo)”. A companion remains the addressee, distinct from who would see an offering. Both receipts explicitly state nothing was saved/sent/shared.
- An independent “Recommend a companion for next week” doorway in the gallery and the review-only Deck Fire invitation opens the same existing recommendation composer without an artificial companion identity. Only a name is required. Category and reason are optional; categories derive from approved manifest kinds. No canonical addition or curator submission occurs.
- Plain-language introduction and privacy explanations precede deeper names. StarPod identity remains in the Council heading and receipts; Heartwood, Moonroot and Harvest remain explained in expandable/deeper context. Council and Fire retain separate intention models; Fire read-aloud consent stays separate and unchecked.
- Refresh focus returns to the actual Fire or recommendation entrance, never a shared styling-class match.

No original renderer, artwork, manifests, historical records, offering-kit, auth, backend, dependencies or workflows changed. #127/#130/#131/#135 branches remain untouched. The fixture uses synthetic memory only; reload clears composed content. POST is refused, backend routes are blocked, and external traffic is blocked. This is not a production submission experience.

## CI-only proposal — not implemented

The previous dedicated run 40845704234 exceeded its 12-minute job limit, after 13 passing cases; no failed assertion preceded cancellation. Partition browser execution into Chromium and WebKit matrix jobs, with two Playwright shards per engine, each retaining the existing 12-minute limit, fail-fast disabled, and installing only its browser. Each runs its assigned suite partition with --project=<browser> --shard=<index>/2; the complete matrix retains every case; keep one worker, every assertion, existing per-test budgets, original renderer and artifact capture. Give artifacts distinct browser names. If required checks depend on the current job name, retain a stable aggregate job requiring both engines. Check branch rules before changing its name. No global limit increase, skipped test, reduced scope, retries hiding failures, or workflow edit is part of this PR refinement.

The 849c4eba exact-head trace also showed the combined listening-plus-new-recommendation test exceeded its unchanged 180-second total budget under software rendering. Its receipt and final focus assertion both passed in the trace. The new recommendation journey is now a separate complete test with the same existing budget; no assertion or renderer was removed. Main CI at that head passed. The job split proposal needs sharding as well as engine separation because Chromium software rendering dominates runtime.

## Reproducible local review

npm ci
OFFERING_REVIEW_PORT=4246 npx playwright test --config playwright.offering-fixture.config.ts
OFFERING_REVIEW_PORT=4247 npx vite build --config vite.offering-fixture.config.ts
OFFERING_REVIEW_PORT=4247 npx vite preview --config vite.offering-fixture.config.ts

Open http://127.0.0.1:4247/review/council-offerings.html for the gallery, or add ?view=deck&node=live_fire for the authentic Tree Fire doorway. The shell's data-fixture-sha identifies the build commit. Bind only to loopback; no LAN/tunnel/remote device access is enabled.

## Human native-device gate

On an independently approved protected preview, test real iPhone Safari and VoiceOver: gallery and Deck recommendation entrances without selecting a companion; optional blank reason/category; six addressed offering types; private versus curator wording and explicit demo receipts; Fire's independent read-aloud choice; question focus and option descriptions; close/Back/refresh focus; keyboard, scrolling, safe areas, orientation and toolbar resizing; same-companion return and Next; original #grab/touch/camera gestures; StarPod 238 identity, Circles 234–238 and Staff Room. Simulator/WebKit success does not satisfy this gate. No secure remote route or production deployment is authorized by this receipt.

## Final arrival refinement — 29 October

The fixture moves the existing real Council header before history controls and mounts its one existing choice area immediately after the introduction, using a fixture-only DOM slot/React portal. No shared Circle238Page source change or #127/#130 reconciliation. History controls remain below. One focusable Meet action opens the existing gallery; one recommendation and one Fire action reuse existing journeys. At 320/390/1440px both browsers check actual heading-first DOM order, all three actions fully in the viewport, keyboard sequence and gallery focus. Visibility remains Only me / The curators for this Circle, with matching contextual confirmation labels; read-aloud remains a separate Fire choice. Tend uses a sprout, Gather a basket; accessible names/descriptions stay intact.

The optional “Back outside…” phrase was evaluated but not added: the implemented return action goes to the Council, not outside the screen. No app exit, live participation or publication is implied.

Builder's Bench was read; it records the same discoverability and CI gates. Claude's linked artifact could not be retrieved through the available web reader. Ed's explicit feedback and source inspection guide this refinement; no fresh Claude sign-off is claimed. Only the root agent was active before edits; other PR heads were rechecked and untouched.

### Latest CI evidence and smallest proposed CI-only change (NOT IMPLEMENTED)

At preceding6afb83ae, main run40874803641 passed; dedicated40874803668 exceeded12m. Downloaded artifact also confirms Chromium2D entry screenshot capture protocol failure at council-offering.fixture.ts:15. All four Chromium3D journeys passed individually (2.2m,2.9m,1.9m,2.9m); WebKit was incomplete. Keep the screenshot failure visible; no retries/suppressed capture or assertion removals.

Propose four browser/shard jobs (Chromium/WebKit × shard1/2), same12m each, one worker, same test/per-test budgets and original renderer. Install matching browser; invoke `npx playwright test --config playwright.offering-fixture.config.ts --project=<engine> --shard=<n>/2`. Verify the `--list` union covers every case exactly once. Current file grouping separates the Fire-heavy file from the Council file; validate balance from receipts. Upload distinct engine/shard artifacts with `if: always()`, fail-fast false. Retain job `disconnected-review` as an always-evaluated aggregate requiring every matrix job success; failures/cancellations must fail aggregate, never go green via a skip. Confirm existing required-check naming and rules read-only before any approved workflow edit. Measure first hosted run; sharding is not a guarantee against per-test or screenshot failures.

No `.github/workflows/ci.yml`, docs-only scope logic or PR133 change. PR133 only concerns main CI's docs-only fast path and is independent. No workflow/protection change in this fixture refinement.

### Native acceptance — NOT YET VERIFIED

Use a separately approved protected preview and record iPhone/iOS, Safari or Home Screen mode, exact fixture SHA and entry route.

- Fresh320/390-like phone arrival: heading/question first, then Meet / Recommend / Fire; no hidden top doorway. VoiceOver rotor headings and swipe order match visual order. Keyboard Tab order and visible focus match.
- Meet all ten companions in 2D and authentic Deck; correct identity/artwork/question, private destination, same-companion return and Next. Test independent recommendation from gallery/Deck without another companion; name only works, reason/category optional; receipt says nothing sent.
- Six offering types remain synthetic. Only me is default; curator review is explicit, not public sharing. Fire practices remain distinct; Tend/Gather symbols differ; read-aloud starts unchecked, requires curator choice and resets on private selection.
- Question initial focus, descriptions, sheet close/Escape, scrolling, keyboard opening/dismissal, safe areas, portrait/landscape and Safari toolbar resizing. No clipped actions or focus hidden behind keyboard.
- Back/Forward, refresh/deep links, closing then reopening, no stale composition after reload. Original touch/camera/#grab gestures and return context. Verify no real uploads/records/Hearts/attendance claim.
- StarPod238 CURRENT/OPEN, unchanged question and no scheduled live Fire; Circles234–238 and Staff Room preserved. PWA test only if already installed; no new service-worker/install claim for this fixture. WebKit automation is not native acceptance.

### Protected Tailscale Serve proposal — separate GO required; NOT ENABLED

No `tailscale` CLI was found on PATH; installation, login, tailnet identity, existing Serve mappings and policy remain unverified. Do not invent a hostname or enable access now.

After explicit approval, use Ed's Mac and iPhone on his existing tailnet. Inspect existing Serve configuration before changing it; use a dedicated review Mac/service if443 is occupied rather than replacing another mapping. Verify an access rule limited to Ed's approved device/principal → review Mac443 (default-wide tailnet access is insufficient). Obtain separate approval for any required installation/account/policy change. No Funnel, device sharing, public DNS or public tunnel.

Keep the fixture server bound to127.0.0.1:4249. For an approved unused HTTPS443 mapping, proposed command: `tailscale serve --bg --https=443 http://127.0.0.1:4249`. Open `https://<verified-Mac-MagicDNS-name>.<verified-tailnet>.ts.net/review/council-offerings.html` on the approved iPhone with Tailscale connected. Verify trusted HTTPS, exact compiled SHA, allowed-host/proxy behaviour, refused POST/backend requests and external-network block. If Host forwarding requires a change, allow only that verified hostname after approval; never a wildcard. Check from a disallowed device that access is denied before native testing. Tailnet network restriction supplements the fixture's no-write boundary; it is not app authentication.

Record existing mappings first and remove only this approved mapping afterwards (`tailscale serve --https=443 off`, after confirming CLI version/syntax), stopping the fixture server when finished. Do not reset unrelated Serve configuration. Tailscale Serve documentation: https://tailscale.com/docs/features/tailscale-serve . No network route, permission or deployment was activated by this proposal.
