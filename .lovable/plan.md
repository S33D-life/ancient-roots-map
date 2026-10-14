# S33D / TETOL — Read-only release-safety audit (2026-10-14)

Nothing was changed. Evidence comes from read-only checks run in this turn, unless marked otherwise.

## Verified evidence
- Live `www.s33d.life/version.json`: build `6d4071d`, generated 2026-10-12T23:25Z.
- Live `/council/circle-236/companions.json`: `status: "PREPARING"`.
- GitHub main HEAD: `5643b9f6` (merge of PR #94, Circle 236 OPEN).
- Lovable editor HEAD: `5643b9f6`, the same as GitHub main. The editor sets 236 to OPEN.
- Neither the live nor the editor `companion-frames.js` clears `question`. That means the "clear 235 question in 3D" fix is NOT on main or live.

## 1. Published revision
- Published: `6d4071d` (verified). Latest edited: `5643b9f6` (verified). They differ.
- Last publish operation: we inferred it was the 6d4071d build on 12 Oct from the version.json timestamp. The publish log itself was UNKNOWN.
- Pushing or merging to GitHub syncs the editor. It does NOT publish the website automatically: the site only changes when someone clicks Publish/Update. The live 6d4071d build after the #94 merge confirms this.

## 2. What Publish does
- Publish builds and serves the website (frontend) only.
- Edge functions deploy separately, when function files are edited or deployed explicitly. Migrations, RLS, auth settings, records and storage are not touched by Publish.
- Risk: function files edited in the editor auto-deploy to the shared backend whether or not anyone publishes. Preview and production share one backend.
- Proving a publish was frontend-only:
  - diff the backend paths (`supabase/`) between the last deployed checkpoint and the candidate, and require an empty diff;
  - after publishing, confirm version.json shows the expected SHA;
  - check that function "last updated" times did not change.
- Vendor-level proof that functions were not redeployed: UNKNOWN. Only Lovable support can confirm it.

## 3. Comparison (236)

| Item | GitHub main | Lovable editor | Live |
|---|---|---|---|
| Status | OPEN | OPEN | PREPARING |
| 3D old question cleared | NO | NO | NO |
| First-tap fixes (1d941de) | present | present | present (6d4071d contains them) |
| #council-return mobile move | partial (left/bottom; hidden on mid/full sheet) | same | same |
| Archived 235 | preserved | preserved | preserved |

Whether 235's question actually renders in 236's 3D view at runtime was not checked: UNKNOWN until a browser check is run.

## 4. Live protection state
- og-proxy: no verified deployed-source checkpoint exists. The editor source still emits exact coordinates for public trees and does a global Staff lookup (earlier audit). HOLD.
- Private tree coordinates and creator identity for signed-out visitors: the RLS policy split was verified in the earlier audit. The Staff identity exposure finding is still open. HOLD.
- Signing in and reading back your own records: owner read-back is verified by policy. A real-device check on the real site is UNKNOWN.
- Backup/rollback: the website can roll back to `6d4071d`. CSV, inventory and schema export done 14 Oct. A full database backup was not taken, and there is no rollback for functions: UNKNOWN/HOLD.

## 5. Smallest release sequence (no backend changes)
1. Candidate patch on a branch: clear the `croom`/`c236` question in 3D, plus the council-return fix, plus a test.
2. Independent PR CI is green, and the `supabase/` diff against 6d4071d is empty.
3. Merge only after review.
4. Publication safety proof per section 2.
5. Explicit human production GO.
6. Publish. Record the version.json SHA and the rollback target `6d4071d`.
7. Checks on the real site: signed out and signed in, on mobile and desktop.

An isolated Lovable preview without writes to the shared backend is NOT possible. The preview uses the same live backend, so preview sign-ins and actions write live data.

## 6. Ely Phase 0
Not ready, not merged. A separate HOLD stands on research-page network and location privacy.

## P0/P1 checklist
- P0: published SHA identified (6d4071d): PASS
- P0: 236 OPEN live: HOLD (live is PREPARING)
- P0: 3D 235 question cleared: HOLD (not in main)
- P0: Publish is frontend-only: PASS by platform design; vendor-level proof UNKNOWN
- P0: og-proxy recovery checkpoint: HOLD
- P0: anonymous private coordinates and identity exposure: HOLD (Staff finding open)
- P1: first-tap fixes: PASS
- P1: archived 235 intact: PASS
- P1: mobile council-return: UNKNOWN (needs a real device)
- P1: isolated preview: not possible
- P1: full database backup: HOLD

Next safe step: write the 3D question patch on a branch, with CI and the empty backend diff, before any publish GO.
