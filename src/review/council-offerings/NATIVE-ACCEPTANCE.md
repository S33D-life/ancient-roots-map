# Council Offerings V1 — Ed’s native acceptance run

REVIEW ONLY. Fixture refinement of #130 from bcd8f57386d74127520be06330d54b186bdd820d. Record the new candidate SHA from the PR receipt before testing. Desktop Chromium/WebKit and computed accessibility names do not establish native Safari, VoiceOver, safe-area, keyboard or frame-rate acceptance.

## Secure access — current boundary

The approved server is **loopback only**. On this Mac:

```sh
npx vite build --config vite.offering-fixture.config.ts
npx vite preview --config vite.offering-fixture.config.ts --port 4248
```

- 2D: http://127.0.0.1:4248/review/council-offerings.html?companion=bishop-ely-plane
- Original Deck: same URL with `&view=deck`.
- Build receipt: temporarily append `&qa=1`, check the exact full SHA in the footer, then remove QA for the normal acceptance journey. QA controls are not part of the default flow.

**These URLs do not work from an iPhone:** its 127.0.0.1 points to the phone, not this Mac. A shared Wi-Fi network, USB cable or Safari Web Inspector does not by itself expose Mac loopback. No working native-device URL is claimed at this stage. Do not use `--host 0.0.0.0`, a LAN bind, public tunnel, router forwarding or certificate/security bypass under this GO.

For secure iPhone testing, request a **separate access GO**. Preferred proposal: an HTTPS preview restricted to Ed by an authenticated, short-lived allowlist/proxy, with the reviewed exact build served from loopback. Before activation, approve the access provider, tester identities, expiry and exact route/static-asset allowlist, and review historical bundled content exposed by that allowlist. Keep authentication credentials in the provider’s secure secrets; never put them in chat/source. Retain the existing read-only method restrictions, backend-route denial, CSP, no-store and memory-only state. Verify unauthorized/private-window requests are denied and revoke access after the test. This is a proposal, not an activated service or deployment approval. No production DNS/Auth/Supabase changes are needed or authorized.

Once approved and independently verified, Ed opens that one protected HTTPS URL in **native Safari** after authenticating. Use synthetic wording only. No personal photos, recordings or family details. The photo/voice choices remain synthetic and must never request camera/library/microphone access.

## Record evidence

Candidate full SHA; preview origin; authorization/expiry; iPhone model/iOS; Safari vs installed PWA; viewport/orientation; VoiceOver and Reduce Motion states. Record pass/fail for each host, screenshot identifiers and exact spoken wording for failures. Use a fresh tab first, then an existing tab/cache. Do not call a build native-verified if its served SHA differs.

## 1. Entry and identity — repeat for 2D and genuine original Deck

- [ ] Enter Bishop of Ely’s Plane Tree. Confirm StarPod Circle 238, approved question, current/open all week and no scheduled Fire; identities/order come from the unchanged manifest. Fig wood remains artwork language, not a replacement Council name.
- [ ] On the Deck use the original panel and `#grab`; reach the invitation by scrolling the mid sheet. Confirm one invitation after lore, with original scene and navigation intact.
- [ ] Baseline note: #130 is main-based. #127 owns final public StarPod heading/lore/navigation, and #131 owns the separate frame correction. Record any old in-world main-based naming as an integration gate; do not claim this isolated fixture includes either draft. A combined acceptance run requires separate approved reconciliation, without changing those PRs.

## 2. Opening, focus and accessible names

- [ ] Turn on VoiceOver (Settings → Accessibility → VoiceOver). Activate “Offer something” on each host.
- [ ] Expect dialog/companion context and the question “What would you like to offer this companion?”; initial focus must be the question, **not Close**. Repeat after return, reopen and next companion.
- [ ] Swipe through the six types in order: Song, Story, Photograph, Voice, Message, Poem; then the future-companion seed and quiet exit. At small width the grid must retain the same semantic order.
- [ ] Seed name must include “Suggest a companion · a future path to the curators”. Decorative images/icons should not add duplicate announcements.
- [ ] With a hardware keyboard and full keyboard navigation enabled, Tab from the focused question reaches Song; Shift-Tab reaches Close. Verify Tab/Shift-Tab stay in the dialog, including wrapping at both ends. Desktop macOS Safari/WebKit may use Option-Tab for full keyboard access; this is not evidence of iPhone hardware-keyboard behavior. The underlying page/iframe must not receive focus or activation while the composer is open.

## 3. Holding choice and privacy — every primary type, including photograph

- [ ] Compose using synthetic examples or fictional text; Continue to holding. Expect the visible “How should your … be held?” question as the group name.
- [ ] Private “Keep it with me” starts selected for every new offering. VoiceOver must announce its explanation about Heartwood and “seen only by you”.
- [ ] The review option must announce the curator/Harvest explanation and the separate later agreement before anything could be public. Review selection is not publication consent. Check checked/unchecked announcements and arrow-key radio navigation with a keyboard.
- [ ] Read the conditional future-design promises. The demo must never claim actual saving, sending, rewards, minting or public sharing.
- [ ] Go Back and Continue: preserve an explicit choice within that draft. Close and start a new draft: reset to private.

## 4. Sheet, scrolling, keyboard, orientation and safe areas

- [ ] On each host try normal portrait, landscape and the smallest available phone; larger text/Display Zoom too. No horizontal scroll, clipped controls or hidden Close.
- [ ] Scroll to the final action. Focus a text field and show/dismiss the iOS keyboard; continue editing without focus jumps, accidental host navigation or lost access to actions. Check keyboard dictation does not start any fixture microphone/capture workflow.
- [ ] Expand/collapse Safari’s bars by scrolling; rotate with the composer open; test home-indicator/notch safe areas. No controls or descriptions may become unreachable. Record any keyboard/visual-viewport issue as a blocker; simulation is not sufficient.
- [ ] Use normal and Reduce Motion settings. Opening/placing should be comfortable; reduced motion removes the animation and reaches an honest demo receipt without duplicate or missing announcements.

## 5. Close, return and next companion

- [ ] Test Close, quiet exit, Escape (hardware keyboard), veil tap and receipt Return. Focus returns to the exact originating invitation, preserving 2D `?companion=` or Deck hash. No accidental move to the canopy.
- [ ] Reopen immediately; focus the question again. Meet next companion through the receipt: Fig follows Bishop, its correct scene/lore appears, and its invitation is focused. Continue through all ten; the existing manifest-ordered end wraps to the first companion—record whether acceptable rather than inventing an eleventh.
- [ ] In the Deck check that `#grab`, sheet state, native sheet gestures, panel scrolling, taps and camera pan/pinch still behave as before. Offering scrolling must not move the underlying camera. Close must not replace or duplicate the grab handler.
- [ ] Refresh discards the demo. Safari Back/Forward and deep links retain authentic companion/history navigation; reopening never resurrects a previous draft.

## 6. History and safety

- [ ] Leave the composer and use existing Time Tree links for Circles 234–238; encounter and return within each supported edition and visit Staff Room. No fixture offering action on historical companions, no invented attendance/Fire, no rewritten records or artwork.
- [ ] Existing #127/#131 combined-candidate frame/touch/history acceptance remains separate. Preserve all approved artwork, including existing companion decisions; do not use this run to replace media.
- [ ] Confirm the visible “DEMO · nothing is saved” and “Demo receipt · nothing was stored or sent.” No camera/library/microphone prompt, upload, external media search, login, real Ledger record, reward or archival claim.

## Decision

Native status is **UNVERIFIED** until actual device evidence is recorded for the exact accessible candidate. Any inaccessible choice/description, escaped focus, unsafe sharing implication, lost return path or altered historical identity is HOLD. After a pass, return the evidence for human review; no merge, retarget, publication or permanent Ledger implementation follows automatically. Revoke any separately approved device-access route when the session ends.
