import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config';

const reportRoot = 'Report';
const testResultsPath = `${reportRoot}/test-results`;

export default defineConfig({
  testDir: './src/tests',
  timeout: config.defaultTimeoutMs * 2,
  expect: {
    timeout: config.expectTimeoutMs,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: testResultsPath,
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    screenshot: 'off',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
    trace: 'retain-on-failure',
    actionTimeout: config.defaultTimeoutMs,
    navigationTimeout: config.defaultTimeoutMs,
  },
  reporter: [
    ['html', { open: 'never', outputFolder: `${reportRoot}/playwright` }],
    ['allure-playwright', { detail: true, resultsDir: `${reportRoot}/allure-results`, suiteTitle: false }],
    ['json', { outputFile: `${testResultsPath}/results.json` }],
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
