# Circle 236 final functional candidate — review only

## Source and scope

Base: actual main `df9041d86eb4583cb0e842706105bb0a0180c7e8`, including PR #94 merge `5643b9f6`, its historical return corrections, and the subsequent plan-only commit. No old baseline substitution or wholesale Claude import.

Claude's mbox was retrieved through the authenticated Drive handoff. Its SHA-256, `a0a950c3503db6a7a4b70e6de5817e79dc98f120d918c74713a566760b074845`, matches the supplied receipt. Only the missing question-clear assignments and mobile return positioning are carried forward. Assertions that the Fire occurred, Ely Phase 0 and combined preview integration are excluded.

Runtime changes: clear `croom.question` and `c236.question`; position the phone return link at the top, clear of the sheet heading. Existing OPEN status, seven companions, archived 235, first-click repairs and navigation are retained. The 13 October date remains a past reference without a new occurrence claim.

No changes to `supabase/`, auth, backend current-Circle projection, canonical records, privacy policies, held realms or Circle 237. The documented frontend-236/backend-235 boundary persists. Content corrections and plan cleanup are separate proposals, not applied asset or canonical-content changes.

## Verification

Complete release-check: PASS; 524 tests, typecheck, security, asset/duplicate guards and production build. Lint: zero errors, 179 existing warnings.

Mobile regression: actual pointer drags open and close the spatial sheet; return-link geometry and touch navigation pass at 390px. An initial handle-tap assertion failed because a tap left the sheet in peek mode; the final test exercises the intended drag gesture rather than bypassing interaction with DOM clicks. The full concurrent run initially reproduced a moving-sheet measurement race. Waiting for Playwright actionability/stability before measuring the handle resolved it. Final full browser run: 20 passed, 2 expected skips (live tiles and installed-worker baseline checks require explicit external configuration). Logs are preserved in `/tmp/c236-final-evidence`.

Visual review at 390px confirms the return control clears the sheet but overlaps part of the decorative scene heading; this remains a human visual-review limitation. No physical iPhone or Safari acceptance is claimed.

Anonymous tests isolate external requests; they establish frontend navigation, not live backend privacy or authenticated acceptance. Real-origin authenticated acceptance remains unverified.

## Delivery and recovery gates

A read-only evidence request was sent to the existing Lovable project. It acknowledged the restriction but did not provide independently verifiable publication-scope or recovery evidence. Main remained `df9041d8` afterward. Preview reported out-of-date/unsuccessful builds. Frontend-only publishing, running Edge Function preservation, Staff privacy and og-proxy recovery remain UNKNOWN/HOLD.

A local capture of public production frontend files is being preserved under `/tmp/s33d-live-rollback-6d4071d-20261014`. Capture completed with 759 saved files and 49 failed/fallback paths. All 759 saved-file checksums verified. Manifest SHA-256: `ebec24909903d6a91a0a3bd226cb98e378ecbf51fc315e057156f33b0cd4071a`. Live version reports `6d4071d`, generated `2026-10-12T23:25:16.437Z`. This is an incomplete capture, NOT a certified rollback artifact; completeness and restoration remain HOLD. It does not recover backend functions or data.

## Proposed approval sequence

1. Review the isolated functional patch and separate content proposals.
2. Authorise branch push and review PR; obtain CI and independent approval.
3. Obtain vendor evidence for frontend-only publication and a credible recovery checkpoint; resolve privacy and backup holds.
4. Verify exact materialised artifact, authenticated real-origin journey and phone acceptance.
5. Request separate merge and publication approvals.
6. Verify served version, bundle/runtime hashes, Circle 235 history, seven companions and Birch return after any authorised publication.

No push, merge, publication, upload, record creation or backend change is authorised by this receipt.
