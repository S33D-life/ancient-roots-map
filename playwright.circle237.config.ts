import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'circle237-pilot.spec.ts', workers: 1, timeout: 30000,
  reporter: 'list', outputDir: 'test-results-circle237',
  use: { baseURL:'http://127.0.0.1:4238', trace:'retain-on-failure', screenshot:'only-on-failure', video:'retain-on-failure' },
  projects: [{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
  webServer: {command:'./node_modules/.bin/vite preview --config vite.circle237.config.ts',url:'http://127.0.0.1:4238/review/circle237.html',reuseExistingServer:false},
});
