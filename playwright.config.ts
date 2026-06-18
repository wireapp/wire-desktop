/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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
import dotenv from 'dotenv';

import path from 'node:path';

dotenv.config({path: path.resolve(__dirname, './e2e-tests/.env')});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e-tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests because there can only be one running instance of the app at a time */
  workers: 1,
  // Only generate reports on CI
  reporter: process.env.CI
    ? [
        ['html', {outputFolder: 'playwright-report/html', open: 'never'}],
        ['json', {outputFile: 'playwright-report/report.json'}],
        ['line'],
      ]
    : 'line',
  timeout: 90_000,
  expect: {timeout: 10_000},
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Behavior for tracing the web browser, for traces of the electron app see its fixture in `e2e-tests/fixtures.ts`
    trace: 'retain-on-first-failure',
    testIdAttribute: 'data-uie-name',
    baseURL: process.env.WEBAPP_URL,
    permissions: ['camera', 'microphone'],
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream', // Provide fake devices for audio & video device input
            '--use-fake-ui-for-media-stream', // Bypasses the popup to grant permission and select video / audio input device by automatically selecting the default one
            '--mute-audio', // Mute all audio output from the test browser because e.g. the ringtone of a call can be annoying during testing
          ],
        },
      },
    },
  ],
});
