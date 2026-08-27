import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'ENABLE_SIMULATOR=true npm run dev -- --hostname 127.0.0.1 --port 3000',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'ENABLE_SIMULATOR=false npm run dev -- --hostname 127.0.0.1 --port 3001',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: ['**/simulator-guard.spec.ts', '**/status-guards.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'simulator-enabled',
      testMatch: ['**/simulator-guard.spec.ts'],
      grep: /loads simulator/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3000',
      },
    },
    {
      name: 'simulator-disabled',
      testMatch: ['**/simulator-guard.spec.ts'],
      grep: /returns 404/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3001',
      },
    },
    {
      name: 'status-guards',
      testMatch: ['**/status-guards.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3000',
      },
    },
  ],
});
