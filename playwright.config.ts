import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — production-build smoke tests.
 *
 * Runs `vite preview` (the built bundle) so tests catch real
 * routing, code-split, and lazy-chunk problems. Targets two
 * minutes total wall-time on CI.
 */
const PORT = Number(process.env.PORT || 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Don't grant geolocation — we want to see the no-location path.
    permissions: [],
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --host 127.0.0.1 --port " + PORT,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
