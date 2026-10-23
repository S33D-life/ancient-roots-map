# Circle 237 release safety: read-only review (23 Oct 2026)

Analysis only. Approving this card does not start any action.

## Verified (observed this turn)
- Live site `/version.json`: build `9503b07`, generated 2026-10-15 21:31 UTC.
- Editor workspace branch: `edit/edt-7a44d166…`, HEAD `b8b0bf56`. The only commit since the last sync is this plan note.
- The editor's git remote is Lovable's internal mirror, not GitHub. **I cannot see which GitHub branch is synced.** That setting lives only in Project settings → Git.

## Unverified (from docs only, no observation)
- A push to a non-synced feature branch does not reach the editor or the live site (Git sync docs: only the synced branch syncs). If someone has switched the synced branch to PR #111's branch, the push WOULD change the editor. Check Project settings → Git before pushing.
- Git sync on Lovable Cloud never deploys Edge Functions or migrations (docs).
- Publish ships only the website (docs). You cannot see deployed-function version IDs, so you can't prove before and after that they are unchanged.
- History Revert restores the whole project, redeploys functions and does not roll back data (docs, Issue #103).

## Verdict: NO-GO for a provider-supported, frontend-only publish plus exact-byte restore
Lovable has no documented way to re-serve an earlier website deployment by ID, and no frontend-only rollback. The only rollback is Revert, which is unsafe here.

## Recommended: isolated static staging off production (3 steps)
1. **Build:** CI builds the exact Codex commit and the current live commit `9503b07`, then stores both `dist/` artifacts with SHA-256 manifests.
2. **Stage:** deploy both artifacts to a separate static host on a throwaway URL (Cloudflare Pages, Netlify or Vercel), never the s33d.life domain. Port `_redirects` and `_headers`. Run signed-out checks only, so there are no writes to the shared backend.
3. **Rehearse recovery:** on that host, promote the candidate, then roll back to the `9503b07` deploy. Compare served asset hashes with the manifests. Receipts: the host's deploy IDs, matching hashes, and the deploy log showing static uploads only. That host never has backend access.

Moving the production domain to that host later is a separate, approved DNS decision.
