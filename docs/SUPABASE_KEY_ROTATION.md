# Supabase Key Rotation Runbook

This runbook is required whenever secrets were committed (for example, `.env` tracked in git).

## Scope

- Supabase publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`)
- Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- Any API keys that appeared in committed env files

## Immediate actions

1. Rotate exposed keys in the Supabase project dashboard.
2. Update all environments with new keys:
   - local `.env`
   - preview/staging hosting secrets
   - production hosting secrets
   - Supabase function secrets
3. Invalidate old credentials and confirm old keys no longer work.

## Git history purge

Run this once from a clean clone (maintainer-only):

```bash
# install once (if missing): brew install git-filter-repo
git filter-repo --invert-paths --path .env --path-glob '.env.*'
git push --force --all
git push --force --tags
```

After force-push, all contributors must re-clone or hard-reset to the rewritten history.

## Verification

```bash
# should return no tracked env files
git ls-files | rg '^\\.env(\\..+)?$' -n

# security guard should pass
npm run security:check
```

## Ongoing policy

- `.env` and `.env.*` are never committed.
- `.env.example` contains variable names only (no values).
- CI runs `npm run security:check` on every PR and `main`.
