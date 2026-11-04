# Circle 239 reverse frames — approved asset integration

This release note supersedes the earlier artwork HOLD in REVIEW.md and TYPESET-CANDIDATES.md; those files and the original candidate receipt are preserved as historical evidence. No implementation restart or duplicate PR. Continues #141 from90cee0aab4a5639f874001e0336a836b00877b37; main remains the live front-only d054f087fecb384e2d539930b4f37068059e62ce.

## Approval and exact bytes

Ed explicitly approved all ten typeset-candidates-v2 visual/editorial artwork hashes, then confirmed: **“Yes, I confirm rights and public use.”** `release-receipt.json` binds those decisions to the ten image and transcript digests. Rights are owner-attested; independent legal clearance and independent scientific peer review are not claimed. The source-linked factual/safety review is complete, with no material unresolved concern identified; generated illustrations remain illustrative, not verified specimen identification, encounters or medical/foraging advice.

All ten images and complete manually checked transcripts match the frozen candidate receipt exactly. Nothing was regenerated, recompressed or substituted. Ginkgo5/Dahlia6 mapping, new3:2 Nutcracker, Ginkgo cooked-seed warning, Fly Agaric poisoning boundary, Ginger/Rosehip qualifications and Secret Garden editorial banner are retained.

Restricted [handoff folder](https://drive.google.com/drive/folders/1UWTHQvfn63pvPtPDE7Ep2on5fLbcOQPQ) contains ten individual1536×1024 PNGs, ten TXT transcripts, contact sheet, candidate provenance, approval/rights/factual receipt, SHA256SUMS and [ZIP](https://drive.google.com/file/d/1jybMo4o4yvVZuOcoDHAXPkE3CcBplpFX/view?usp=drivesdk). Each uploaded PNG and TXT was downloaded independently and rehashed:20/20 matched. ZIP download also matched SHA-256526e359b4e546b3452f6011bbdf65e7c284feb464f78147bc2fcaa60bef144f1; archive integrity and all20 contained image/transcript digests passed. See drive-transfer-receipt.json. Owner/writer user permissions only were observed; no sharing/permission changes. Previous Drive iterations and source artwork remain intact.

## Scope

- Admit only10 approved PNGs +10 corresponding TXT files under public/council/circle-239/reverses. Catalogue embeds the same transcript bytes for accessible reading and separately links their TXT assets.
- Activate the existing shared front/reverse control with the existing fact/rights/owner approval metadata. `publicationApproved` means asset admission; it is NOT source-merge or deployment approval. No fabricated deeper Library link; all explore targets remain null.
- Existing interaction/renderer/React page/239 adapter are unchanged by this admission. Front portraits remain default; keyboard/touch/focus/announcements/reduced motion/history/full-art reading are preserved. Original entry.js still has only the optional239 scene hook added earlier in #141.
- Exact PNGs require ten explicit asset-budget exceptions;500KB global threshold remains unchanged. One additional PWA glob exclusion for reverses mirrors the existing front exclusion, preventing automatic15MB precaching. Images remain fetched on demand. No worker/update/caching algorithm or stale-shell workaround is changed.
- No source ZIP, private proof iteration, family media, backend files, secrets, database/auth/permission/DNS changes. Original fronts/manifests/234–238 history/Time Tree/Staff Room/fire:null remain unchanged.

## Verification

Run `npm run release-check`, `node scripts/check-council-public-bytes.mjs dist`, `npx playwright test --config playwright.living-frames.config.ts`, and the existing Circle239 front/history fixture via playwright.council-demo.config.ts. Feature CI now uses actual admitted public artwork by default, not mocked image routes:all ten2D pairs at320/390/1440, all ten original3D pairs at320/390, exact complete transcripts, focus, touch, fullUV/aspect, reduced motion, refresh/Back/Forward, quietFire and StaffRoom. Explicit held-catalogue and missing-image negative cases remain. Synthetic edge-marked and private-intake modes remain available for separate checks. No assertion, browser, existing per-test budget or original Tree rendering is removed.

The software-GPU harness bounds continuous whole-Tree drawing but explicitly draws every reverse using the original renderer. This proves texture/geometry/navigation behaviour, not native animation/performance.

## Native / release limitations

Native iPhoneSafari/VoiceOver is **unverified**, not equivalent to automated WebKit. Acceptance:all10 front/back pairs in2D/original3D; names/pressed-state/focus/transcript/full-image zoom; portrait/landscape/toolbars/safe areas; reduced motion; #grab, sheet scroll/touch/camera gestures; refresh/Back/Forward; returns/234–239 Time Tree/StaffRoom; no scheduledFire/no writes. No protected network exposure is activated by this PR.

Known390px spatial camera side-edge clipping remains:complete texture coordinates and contained frame geometry do not prove an unobscured camera view. Sheet image/full-art reading are available, but are not a camera fix. Native acceptance or explicit acceptance of this limitation remains a publication decision.

Stale Chrome shell is a separately documented old-shell/new-server mismatch; see STALE-SHELL-READONLY.md. No blind cache clearing, worker unregistering or update-hook changes. The narrow new asset precache exclusion above does not resolve that issue.

## Human decisions and recovery

Engineering/source-review GO requires exact-head CI. Mark ready for human review only after checks pass; no merge performed. Separate source-merge GO is required. Publication remains separate, after green post-merge checks, exact hosting sync and a decision on native/clipping/cache limitations. Asset approval does not grant either release action.

Recovery source is the live front-only d054f087fecb384e2d539930b4f37068059e62ce. After an authorised merge, a separately approved release-only revert of the #141 merge (git revert -m1 MERGE_SHA), frontend rebuild/release checks and frontend republish returns to front-only if main otherwise remains this base. If main gains other changes, inspect the resulting revert diff; do not reset unrelated work. This is a qualified source-based recovery route, **not** a newly demonstrated pinned-artifact redeploy. Lovable pinned-frontend-artifact restoration remains unsupported; never History Revert or backend rollback. No recovery operation is executed here.

Local first browser run:17/18 passed; WebKit’s held-catalogue network mock received the real approved catalogue on its final navigation. Trace records nine mocked6355-byte responses then a real16598-byte response. The held-only fixture now blocks service workers, following [Playwright network guidance](https://playwright.dev/docs/network); its focused rerun passed. Positive public-asset journeys keep their normal worker setting. This is test isolation, not a production cache fix. No assertion/budget was dropped. Full rerun and exact-head CI results are recorded separately.
