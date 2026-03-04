# CSP: dev-safe, prod-safe

This project uses different Content Security Policy behavior for local development vs production.

## Development (`npm run dev`)

Vite dev server now sets a dev-only CSP header that includes:

- `script-src 'self' 'unsafe-eval'`
- `connect-src` entries for local HMR (`ws:`, `http://localhost:*`, `http://127.0.0.1:*`)

Reason: Vite/HMR and dev tooling may rely on eval-based transforms and websocket connections.

## Production (`npm run build` + `npm run preview`, deployed hosting)

Production CSP is strict and does **not** allow `unsafe-eval`:

- `script-src 'self'`

It is applied in:

- Vite preview server (`preview.headers` in `vite.config.ts`)
- Static host headers (`public/_headers`)

## Why this split exists

- Dev should not block iteration or hot module reload.
- Production should minimize script execution surface and avoid eval.

## Verify

1. Run `npm run dev`.
2. Open DevTools and confirm no CSP `unsafe-eval` blocking warnings from local dev tooling.
3. Run `npm run build && npm run preview`.
4. Check response headers for the preview URL and confirm `Content-Security-Policy` includes `script-src 'self'` and does not include `unsafe-eval`.
