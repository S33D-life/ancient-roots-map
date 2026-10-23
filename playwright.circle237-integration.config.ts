import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',testMatch:'circle237-integration.spec.ts',workers:1,timeout:30000,
 webServer:{command:'./node_modules/.bin/vite preview --host 127.0.0.1 --port 4240 --strictPort',url:'http://127.0.0.1:4240/council/237',reuseExistingServer:false},
 outputDir:'output/playwright/circle237-integration',reporter:'list',
 use:{baseURL:'http://127.0.0.1:4240',serviceWorkers:'block',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
});
