# Development Setup

1. Install dependencies:
   - `npm install`
2. Start local dev server:
   - `npm run dev`
   - default URL: `http://127.0.0.1:8080` (or `http://localhost:8080`)

## Environment variables

Set local variables in `.env` (never commit env files):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

For hosted environments, set the same variables in the hosting dashboard.

If variables are missing, the app now shows a non-blocking in-app warning banner instead of failing with a white screen.

Optional species-vision backend vars (for `/api/identify-tree`):

- `PLANTNET_API_KEY` (enables PlantNet fallback when iNaturalist confidence is low)
- `INATURALIST_VISION_URL` (optional override; defaults to iNaturalist API)
- `PLANTNET_API_BASE_URL` (optional override; defaults to PlantNet API)

Security guard:

- Run `npm run security:check` before opening a PR.
- This blocks committed `.env` files and common leaked key patterns.

## CSP note for local dev

If the app shows a white screen with Vite preamble/HMR errors (for example: `Refused to execute a script` or `@vitejs/plugin-react-swc can't detect preamble`), your dev CSP must allow inline scripts:

- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

Production CSP should remain strict and must not include `unsafe-inline` for scripts.

## Port troubleshooting

- If port `8080` is already in use, run:
  - `npm run dev -- --host 127.0.0.1 --port 8081`
- If local policies block port binding, confirm your shell has permission to open localhost listeners.

## If Vite restarts repeatedly

If you see repeated restart logs like `.env changed` or `vite.config.ts changed`:

1. Confirm no local tools/scripts are auto-editing `.env` or `vite.config.ts`.
2. Run:
   - `npm run guard:config-churn`
3. Keep env values in local `.env` only, and keep Vite config static.
4. Build/version generation is build-only and writes `public/version.json` only.

## Duplicate artifact guardrail

Files or folders ending in `" 2"` (for example, `MapPage 2.tsx`) are banned because they create unstable builds and ambiguous imports.
Run `npm run check:duplicates` before pushing to detect offenders quickly.
The script fails with a list of exact paths, so CI blocks accidental duplicates early.
To fix an offender, rename it to the canonical filename or remove it if stale.
Only keep one source of truth per module/page/script path.
