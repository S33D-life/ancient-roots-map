# Provider safety answer: frontend-only publish and exact rollback (Circle 237, PR #111)

Written analysis only. Nothing was published, deployed, reverted or changed. Approving this card does not start any action. It only records the answer.

## Verdict: NO-GO for a provider-guaranteed, independently testable, frontend-only release and rollback inside this Lovable project

## What the provider does document (platform statement, not observed proof)
- Publish builds and serves the website. Backend changes (functions, migrations) deploy separately and immediately when they are edited or explicitly deployed, not through Publish. Source: Lovable deployment docs ("Frontend vs Backend Deployment").
- Git sync on Lovable Cloud never deploys edge functions, and it never applies migration files. Source: Lovable Git sync docs. So merging PR #111 into the synced branch does not, by documented design, redeploy functions.
- History/chat Revert restores the whole project state. When restored files include `supabase/functions/`, those functions redeploy, and stored data is not rolled back. This matches Issue #103. Revert is not a frontend-only rollback.

## What does not exist (UNKNOWN or absent)
- No documented frontend-only Publish mode or "website only" switch. Publish separates frontend from backend by design, but you cannot set or confirm that per release.
- No documented way to re-serve the exact earlier website bytes by deployment ID (for example the current `x-deployment-id`) without a project Revert. The only documented rollback is History Revert, which carries the backend risk above.
- No user-visible deployed-function version IDs, bundle hashes or deployment history. You can't independently prove that function identities stayed the same before and after. Read-only function logs and test calls show behaviour, not identity.
- No isolated preview backend. Preview and production share one backend.

So the guarantee you asked for (an official process that is testable and covers both publish and exact-byte restore with zero backend effect) cannot be shown from the documented features of this project.

## Least-risk path inside Lovable, if a human accepts the residual risk
1. Merge PR #111 only if its diff against the published build has zero changes under `supabase/`. Git sync does not deploy functions on Cloud.
2. Before publishing, record `/version.json`, the `x-deployment-id` header, asset filenames and their SHA-256 hashes, plus read-only probes of key function responses.
3. Publish. Then compare `/version.json`, the assets and the same probes.
4. For rollback, do NOT use History Revert. Fix forward instead: put a commit on main that restores the earlier frontend files, keep `supabase/` unchanged, then Publish. The result is a rebuild, not the exact earlier bytes.
This proves behaviour, not provider-level identity. Lovable support would need to give before/after function deployment versions to close that gap.

## Only path that fully meets the requirement: separate static hosting
- Build `dist/` from the exact PR #111 commit in CI (already produced as an artifact by `.github/workflows/ci.yml`). Host it on an independent static host that supports immutable deploys and instant rollback to an earlier deploy (for example Cloudflare Pages, Netlify or Vercel). Point the domain there. The app still calls the same backend through its public key, and no function, schema, RLS, auth or data is touched.
- Rehearsal: deploy the earlier artifact (`6d4071d` or the current build) and the candidate to a preview URL on that host. Switch between them, and check byte hashes against the artifact checksums. No backend write is needed for signed-out checks. Signed-in checks write to the shared backend, so limit them to read-only views.
- Proof that backend function identities stayed the same: by construction the host has no access to the backend. Its deploy log shows static uploads only.
- Things to account for: `public/_redirects` (og-proxy proxy rules and SPA fallback) and `public/_headers` (CSP) must be ported to the new host's format. Auth redirect URLs for the new origin must be allowed. Moving the custom domain away from Lovable hosting changes DNS, and that needs its own approval.

## Support items needed to make the in-Lovable path GO
1. Written confirmation that Publish never deploys edge functions, migrations, auth or RLS for this project.
2. A supported way to re-serve an earlier website deployment by ID without Revert.
3. Before/after deployed-function version identifiers.
