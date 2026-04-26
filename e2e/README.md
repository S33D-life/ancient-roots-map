# End-to-end smoke tests

Production-bundle smoke tests run with [Playwright](https://playwright.dev).

## What they cover

Four routes, one assertion each: **the page does not crash.**

- `/` — home / S33D gateway
- `/map` — atlas
- `/library` — Heartwood library
- `/tree/:id` — tree detail page (the one that hit React #310)

Each test verifies:
1. HTTP 200
2. The header landmark mounts
3. The `GlobalErrorBoundary` fallback is NOT visible
4. Page-specific landmark mounts within 15s
5. No uncaught `pageerror` or unfiltered `console.error`

These are deliberately shallow. Behavioural tests live in `src/**/*.test.ts`.

## Run locally

```sh
npm run build
npx playwright install chromium
npm run e2e
```

The config auto-spawns `vite preview` on port 4173. To target a deployed URL:

```sh
PLAYWRIGHT_BASE_URL=https://ancient-roots-map.lovable.app npx playwright test
```

## Configuring the sample tree id

The `/tree/:id` test uses a stable seed id. Override with:

```sh
PLAYWRIGHT_TREE_ID=<uuid> npx playwright test
```

If the id is unknown to the database, the test still passes provided the
"not found" / "loading" state renders without crashing.

## CI

Runs as a separate job in `.github/workflows/ci.yml` — `e2e-smoke`. Target
wall-time: < 2 minutes.
