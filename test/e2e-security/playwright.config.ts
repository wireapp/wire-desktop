import {defineConfig, devices} from '@playwright/test';

import * as path from 'path';

export default defineConfig({
  testDir: './specs',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 0,

  workers: 1,

  reporter: [
    ['html', {outputFolder: 'security-test-report', open: 'never'}],
    ['json', {outputFile: 'security-test-report/report.json'}],
    ['list'],
  ],

  timeout: process.env.CI ? 45000 : 60000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: process.env.CI ? 15000 : 30000,
    navigationTimeout: process.env.CI ? 15000 : 30000,
  },

  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'security-exposure',
      testMatch: '**/exposure/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'security-validation',
      testMatch: '**/validation/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'security-regression',
      testMatch: '**/regression/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  globalSetup: path.join(__dirname, 'utils', 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'utils', 'global-teardown.ts'),

  outputDir: 'test-results/',
});
