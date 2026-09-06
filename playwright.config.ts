import { defineConfig } from '@playwright/test';

// Deliberately attach to the coordinator's preview; never start another GPU preview.
export default defineConfig({
  testDir: './tests',
  outputDir: './docs/qa/test-results',
  globalSetup: './tests/global-setup.ts',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'docs/qa/results.json' }], ['html', { outputFolder: 'docs/qa/playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.QA_BASE_URL || 'http://127.0.0.1:5200',
    browserName: 'chromium',
    channel: process.env.QA_BROWSER_CHANNEL || 'msedge',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
