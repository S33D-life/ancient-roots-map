# Council + Fire demonstration soft launch

## Candidate and scope

Base: main `e2f2830f0af383f14d7f0165cd3eb9be4ec9d057`.
Approved interaction: PR #136 `1258497d68034d1f0a0100f98a155360a608e07b`.
Public URL after deployment: `/council/238/offerings.html`, linked from `/council-of-life`.

This release brings only the approved composer, Fire, recommendation flow, styles, synthetic examples and required Circle238 presentation hooks from #130/#136. It does not merge or alter those PRs. #127, #131, #135 and all unrelated drafts remain independent.

The standalone Vite HTML entry shares the ordinary frontend build but does not mount App, Auth providers, Supabase clients, live offering submission, uploads, rewards, votes or attendance. The six offering types, private default, separate review/read-aloud intentions and demo receipts remain unchanged. No persistence is implemented. Typed text and synthetic selections disappear on reload; original Tree navigation preferences remain original Tree behaviour.

The only runtime adaptation to approved #136 is public-document navigation: existing Council/history anchors leave the standalone demo instead of staying inside its router. Existing full application and static Tree URLs remain available. The normal build pins the approved experience identity; `/version.json` identifies the actual release commit. The response CSP permits local assets and synthetic blob audio, blocks external API connections and forms, and never registers a new service worker. The existing app service worker is told not to substitute the main app for this HTML route.

## Preserved material and known differences

`preservation.json` records all ten unchanged scene SHA256 values, the unchanged companion manifest digest, and the aggregate of 255 public files copied byte-for-byte into the normal build. Only `_headers` gains a new route-specific section; generated version metadata changes normally. No original Tree renderer, adapter, artwork, Circle234–238 record, Staff Room, permission or backend source is included in the release diff.

The private iPhone composite used #131 Tree assets alongside #136. This public release deliberately retains current main's Tree assets, not #127/#131. It therefore does not claim those drafts' guided navigation/adaptive frame changes. Circle238 symbolic 3D objects remain absent by existing adapter design. Native Safari/VoiceOver full acceptance is not inferred from automated WebKit or Ed's initial positive visual review. Full application historical route rendering is covered by the existing smoke/history suite; the new standalone handoff test uses synthetic destination documents to isolate navigation ownership.

The full frontend build's existing Lovable MCP plugin regenerates a local backend bundle as a side effect. That generated drift is discarded and is not part of this PR. No backend deployment is authorised.

## Checks

- `npm run release-check`
- `node scripts/check-council-public-bytes.mjs`
- `npx playwright test --config playwright.council-demo.config.ts` (Chromium + WebKit, original assertions and budgets retained)
- `npx playwright test` (existing production smoke and historical Tree checks)
- `git diff --check`; verify no Supabase, lockfile or existing public artwork diff.

The new dedicated CI runs the production build and both browsers. Existing CI and unrelated CI optimisation drafts are untouched. Browser tests block external traffic and non-GET/HEAD requests, assert no writes, and use fictional input. The private fixture server’s global HTTP rejection assertion is replaced with an assertion that this public document makes no backend requests or mutations, because existing application API routing must remain untouched. The route-specific synthetic audio test checks actual production-response CSP and playback. Reviewer screenshots/traces are CI artifacts and local `output/playwright/council-demo` files.

## Separate approval gates

1. **Merge GO:** review this exact release PR and its exact-head CI. Merge only this PR against main; no other draft is required. Recheck final merge diff and checks if main moves.
2. **Deployment GO:** after merge, verify the existing S33D Lovable project editor reports that merged SHA. Capture its current production deployment/version and recovery target before publishing. Request explicit approval to update the existing site's frontend through its current Publish workflow. Do not use AI editing prompts, History Revert, new hosting, DNS, SQL, backend deployments or migrations.
3. **Served verification:** inspect the actual public HTML, associated hashed JS/CSS, `/version.json`, demo identity and deployed commit. Test all three journeys at390px and desktop, synthetic receipts, 2D/3D return, history and Staff Room. Check clean Safari and an existing PWA session; an older installed service worker may require its normal update/reload before recognising the new standalone route. Never claim deployment merely because a merge succeeded.

At preparation, the connector reports S33D's editor at the baseline main SHA and the project is published. GitHub has no deployment records for this repository. An automated HTTP probe of the custom domain was denied, so the actual served production version has not been independently captured here. Resolve that deployment/recovery evidence before deployment GO; no new hosting channel is proposed.

## Rollback

Before deployment, retain the last verified frontend deployment identifier/artifact and served version. Prefer redeploying that previous frontend artifact through the same hosting system. If the provider has no demonstrated frontend-only rollback, revert only this release merge in a reviewed recovery PR, verify the resulting frontend build, sync that recovery SHA and obtain explicit deployment GO. Do not use History Revert or touch backend data. Verify the existing Council routes, history, Tree, authentication entry and `/version.json` after recovery.

The separate private Tailscale session is not a production deployment. Leave it untouched while review continues; on shutdown stop Serve and verify its mapping is absent before stopping its loopback server or restoring any broader ACL.
