# Auth callback URL race — bounded candidate

## Observed device evidence

Ed's one controlled iPhone Safari attempt on diagnostic build `8622f7a`
(full deployed source `8622f7a907fa8aed0f7add1c598d20dcdc3c9a11`) reached
`/auth/callback` at 2026-09-25 15:11:29 UTC.

- Rows 83–87: callback credentials and effective nonempty access/refresh values,
  plus implicit-flow metadata, were present at early capture.
- Row 92: SDK initialization settled without a session or reported error.
- Row 113: callback completion reported `AuthSessionMissingError`.
- No validation request, session-write attempt, or storage failure was recorded.

The supplied journal ends with a truncated row 120, but the relevant callback
sequence is intact. No token values or callback URLs are reproduced here.

## Reproduced cause

`MapFilterProvider` mounts globally inside `BrowserRouter`. Its effect invokes
`setSearchParams(..., { replace: true })` even if no map filters changed.
React Router's search-only navigation discards the URL fragment. Supabase Auth
2.81.0 starts initialization under a browser lock and reads the callback URL
inside that lock. When the provider's effect runs before the lock is granted,
the SDK sees no callback credentials and successfully initializes an empty
session instead of validating/saving the callback session.

The regression test mounts the real provider and BrowserRouter while the real
installed SDK waits on a controlled lock. Before the source fix, both the
Google-style implicit callback and recovery callback lose their fragments and
produce no session. This reproduces the device trace's failure mode. Device
logs do not directly record the browser lock or URL mutation, so the precise
on-device ordering remains an inference until the candidate is tested there.

## Candidate boundary

Prevent map-filter URL synchronization on `/auth`, its child routes, and
`/reset-password`. Filter state stays available and resumes URL synchronization
when the user returns to Atlas. The SDK remains the sole consumer of callback
credentials. No manual token capture, second exchange, retries, storage fallback,
SDK upgrade, generated-client edits, database changes, or production configuration
changes are needed.

The candidate is based directly on the diagnostic SHA. It does not incorporate
PRs #69/#71/#72/#68/#70. Claude's research-bridge created_by/RLS lane is separate.

## Verification

`src/tests/MapFilterAuthCallback.test.tsx` covers delayed SDK callback processing,
recovery notification, preservation of auth URLs when filters change, and filter
synchronization after leaving auth. Synthetic credentials and stubbed HTTP
responses are used; no real account sign-ins are performed.

Before fix: six of seven new checks fail; Atlas synchronization passes.
After fix: all nine new checks pass, including trailing-slash routes. The full
local release gate passes: typecheck, lint, security, duplicates, assets,
46 test files / 346 tests, and production build. Browser smoke and remote CI
results are recorded in the PR.

Deployment and another real-device attempt require a separate decision for the
new exact candidate SHA. The prior approval covered only the diagnostic SHA.
