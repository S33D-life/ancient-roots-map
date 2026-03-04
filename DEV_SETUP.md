# Development Setup

1. Install dependencies:
   - `npm install`
2. Start local dev server:
   - `npm run dev`

## CSP note for local dev

If the app shows a white screen with Vite preamble/HMR errors (for example: `Refused to execute a script` or `@vitejs/plugin-react-swc can't detect preamble`), your dev CSP must allow inline scripts:

- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

Production CSP should remain strict and must not include `unsafe-inline` for scripts.
