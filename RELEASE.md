# Release Safety

## Pre-publish checklist

1. Install dependencies:
   - `npm ci`
2. Run release checks:
   - `npm run release-check`
3. Verify local app boot:
   - `npm run dev -- --host 127.0.0.1 --port 8080`
4. Verify CSP split:
   - Dev header (Vite): allows `script-src 'unsafe-inline' 'unsafe-eval'`
   - Production header (`public/_headers`): `script-src 'self'` only
5. Verify update banner:
   - Click update once, refresh once, ensure banner does not immediately return.

## Rollback notes

1. Revert the release commit (or redeploy prior artifact) if:
   - White screen appears in preview/prod
   - Login/session persistence breaks
   - Update banner loops after refresh
2. Confirm rollback health quickly:
   - `/` loads
   - Google auth callback succeeds
   - `/map` loads markers and tiles
   - `/version.json` returns JSON and 200
