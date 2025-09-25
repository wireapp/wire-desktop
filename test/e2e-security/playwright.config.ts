/*
 * Wire
 * Copyright (C) 2025 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {defineConfig, devices} from '@playwright/test';

import * as path from 'path';

export default defineConfig({
  testDir: './specs',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 3 : 0,

  workers: 1,

  reporter: [
    ['html', {outputFolder: 'security-test-report', open: 'never'}],
    ['json', {outputFile: 'security-test-report/report.json'}],
    ['list'],
  ],

  timeout: process.env.CI ? 120000 : 60000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 30000, // 30 seconds
    navigationTimeout: 30000, // 30 seconds

    // Ensure environment variables are available to tests
    ...(process.env.CI || process.env.GITHUB_ACTIONS ? {
      launchOptions: {
        env: {
          DISPLAY: process.env.DISPLAY || ':99',
          ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
          ELECTRON_DISABLE_GPU: 'true',
          ELECTRON_NO_ATTACH_CONSOLE: 'true',
          NODE_ENV: 'test',
          WIRE_FORCE_EXTERNAL_AUTH: 'false',
        }
      }
    } : {}),
  },

  expect: {
    timeout: 10000, // 10 seconds for assertions
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
