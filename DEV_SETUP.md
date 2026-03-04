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

## CSP note for local dev

If the app shows a white screen with Vite preamble/HMR errors (for example: `Refused to execute a script` or `@vitejs/plugin-react-swc can't detect preamble`), your dev CSP must allow inline scripts:

- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

Production CSP should remain strict and must not include `unsafe-inline` for scripts.

## Port troubleshooting

- If port `8080` is already in use, run:
  - `npm run dev -- --host 127.0.0.1 --port 8081`
- If local policies block port binding, confirm your shell has permission to open localhost listeners.
