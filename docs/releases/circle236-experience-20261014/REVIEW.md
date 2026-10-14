# Circle 236 final experience follow-up — pending Ed approval

## Baseline and scope

Local follow-up branch: `codex/circle236-final-experience-20261014`, based on intact tested checkpoint `cb55b7eb6cb120d144b7bf70e0a47cbcf2f65644`. No Staff Room #95, Ely Phase 0, backend projection, species/tree write or Circle 237 work.

Sources reviewed in Drive folder [2026-10-14_circle236-final-experience-review](https://drive.google.com/drive/folders/1g244DjNIP7vftZtt60LsRZPVNHqC_wpz):

- [HANDOFF.md](https://drive.google.com/file/d/1ImQnJamjEdCsfTlae2w0TrlDuEGrDpYR/view)
- [PLATE-SPECS.md](https://drive.google.com/file/d/1M5csT0Iv1EYV4bLu2pYNSVInd6pAUO0P/view)
- [WEEKLY-RHYTHM.md](https://drive.google.com/file/d/1dx6j6jIJ4x_MZ8T2BJIg-gO1KBLQ7rJY/view)

The rhythm is a review contract, not permission to advance Circles or deploy the shared projection. No new companion, date, Fire, attendance or offering is introduced.

## Reviewable changes

- Phone return link moves below the decorative scene heading, retaining existing hiding rules for expanded sheets and embedded rooms. Shorten the scene sign to OPEN / Circle 236; the past-date reference stays in readable panel text.
- Warm welcome and companion copy are visible in the local preview with a pending-Ed-approval notice. The proposed “Fire was held” assertion is **not applied**. The existing 13 October / 19:30 UK reference remains explicitly a past date, and the group doorway explains where future Fire times are shared.
- Shared manifest supplies readable summaries and six observation themes for all seven companions. These are accessible equivalents, not verbatim transcriptions of problematic plate text. No disputed quotation or edibility instruction is reproduced. The Rose text uses pollen while noting the plate wording awaits correction.
- Bay Bolete care line appears in the 2D caption, dialog and spatial panel: “Look closely, leave it growing. Never eat a wild mushroom on the strength of a picture.” The dialog and spatial panel put the care line before the image so it cannot be buried below the plate. The existing Edible label remains in unchanged artwork and is explicitly disclaimed in its caption.
- Ely uses The Great London Plane of Ely, with Bishop’s Plane / Paul Wood / entry 437 attribution. Identity confirmation is distinguished from a permanent S33D profile, which does not exist. Illustration claims are qualified, with no new route, UUID, private photograph or location.
- Winnie-the-Pooh keeps the same identity and book presence. Its existing JPEG is retained untouched in history/files, but neither 2D nor 3D Council loads/displays it. A typographic text card/texture replaces its presentation, with no character image or quotation. This is an interim fallback, not replacement commissioned artwork.
- Council-only First Walk experiment starts collapsed on `/council-of-life` and numbered review Circle pages; users can expand it or use the existing dismiss action. The Council-only chip also clears the existing mobile navigation bar with a 96px offset; other pages retain their existing 72px offset. Collapse never writes onboarding completion/dismissal. Other pages keep the original full widget. No onboarding hook/storage logic is changed.
- Provenance records use actual Birch/Ely runtime bytes and preserve the former hashes/sizes as original-supply history. No origin/tool/date/approval is invented. All seven asset files remain byte-identical to the checkpoint.

## Exact approvals needed

1. Approve the displayed warm copy, readable summaries, Ely attribution/caption, Bay Bolete care line and shorter sign. Confirm separately before asserting that the Fire occurred.
2. Approve Pooh text-only fallback as the public interim. The three replacement plates still require a separate visual/hash review and GO; this branch swaps none of them.
3. Approve the Council-only collapsed onboarding presentation and mobile control placement after screenshot/device review.
4. Separate GO to push/open a review PR. Merge and production publication require later distinct approvals and independently resolved delivery/privacy/recovery gates.

## Remaining release gates

Real-origin authenticated testing and physical iPhone/Safari acceptance remain unverified. This local anonymous browser suite blocks external requests and does not certify the running backend. The existing og-proxy/Staff privacy/recovery and incomplete rollback-artifact concerns remain HOLD/UNKNOWN. A frontend-only diff is not proof of Lovable publication scope. No backend inspection or modification is part of this follow-up.

Rollback for review: discard this isolated follow-up and return to intact `cb55b7eb`; never rewrite shared history. This is not a production rollback procedure or approval to publish.

## Copy decision still pending

Claude's proposed occurrence wording is: “The Fire was held on Tuesday 13 October. It was one moment in this Circle; the Circle stays open.” The proposed short sign is “OPEN · Fire held 13 October”. Neither is applied here. This candidate uses the neutral past-date reference and “OPEN · Circle 236” sign. An approval of welcome copy does not silently approve the occurrence assertion.

## Verification scope

The existing Birch Living Thread tests exercise genus → Silver Birch → public individual selection → contextual return and restored focus in both 2D and spatial modes, including denial of private/QA records. These use isolated fixtures, not live authenticated records. Other browser smoke paths remain in the suite; no claim of real-origin OAuth or live backend remediation is made.

## Final local result

- Complete release-check PASS: 529 tests / 69 files; typecheck, security, static/share, duplicate and asset guards, production build. Lint zero errors, 179 existing warnings.
- Full Playwright PASS: 20 passed, two expected skips (external live tiles and installed-worker baseline are not configured). The care line is asserted in the dialog opening viewport. No Pooh JPEG requests occur in the checked Circle journeys. Historical Circle 235 and existing smoke routes pass.
- Additional isolated visual/interaction checks PASS at 320×640, 390×844 and 1440×900: arrival, care dialog, book fallback, spatial return geometry and spatial care text. Actual pointer-drag sheet opening/closing and return tap pass at 390×844. These are Chromium simulations, not physical-device or real-origin authenticated acceptance.
- All seven artwork files are byte-identical to the checkpoint; only provenance entries for two assets were corrected. No `supabase/` or `.lovable/plan.md` delta.
- Logs and screenshots: `/tmp/c236-experience-evidence`. The first draft screenshot placed the care text below the large plate; final code puts it first and verifies viewport visibility.
- No remote branch, PR or GitHub CI run has been created. No production or backend changes occurred. Staff Room #95 remains separate.

## Changed-file inventory

Frontend/content: `public/council/circle-236/companions.json`; `public/tetol/circle-235/pre-fire/runtime/{companion-frames.js,entry.js}`; `src/components/FirstWalkTrail.tsx`; `src/components/council/Circle236Fire.tsx`; `src/pages/{CouncilOfLifePage.tsx,library/BirchThreadPage.tsx}`; `src/styles/birch-thread.css`.

Provenance: `docs/releases/circle236-frames-artwork-provenance.json`.

Regression checks: `src/tests/{birchLivingThread.test.tsx,circle236Experience.test.tsx,circle236Fire.test.tsx,circle236Frames.test.ts}`; `e2e/{circle236-open.spec.ts,release-reconciliation.spec.ts}`.

Review receipt: this file. Sixteen files total; no binary asset changes.
