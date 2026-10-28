import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — production-build smoke tests.
 *
 * Runs `vite preview` (the built bundle) so tests catch real
 * routing, code-split, lazy-chunk and original Tree journey problems.
 */
const PORT = Number(process.env.PORT || 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Standalone pilot needs its own build; integrated237 has a disconnected test server.
  testIgnore: ["**/circle237-pilot.spec.ts", "**/circle237-integration.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The original WebGL Tree is CPU-bound on the CI software renderer.
  workers: process.env.CI ? 1 : undefined,
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
