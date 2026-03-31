import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config';

export default defineConfig({
  testDir: './src/tests',
  timeout: config.defaultTimeoutMs * 2,
  expect: {
    timeout: config.expectTimeoutMs,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: 'test-results',
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    screenshot: 'only-on-failure',
    video: {
      mode: 'retain-on-failure',
      size: { width: 640, height: 360 },
    },
    trace: 'retain-on-failure',
    actionTimeout: config.defaultTimeoutMs,
    navigationTimeout: config.defaultTimeoutMs,
  },
  reporter: [
    ['./src/utils/CustomTTAReporter.ts'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
