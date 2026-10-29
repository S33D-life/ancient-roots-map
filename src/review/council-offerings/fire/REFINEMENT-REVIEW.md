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
