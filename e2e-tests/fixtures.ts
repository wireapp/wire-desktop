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

import {test as baseTest, BrowserContext, Page} from '@playwright/test';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {createApp, type App} from './actions/createApp';
import {createTeam, Team} from './actions/createTeam';
import {createUser, registerUser} from './actions/createUser';
import {BrigApiClient} from './backend/BrigApiClient';
import {GalleyApiClient} from './backend/GalleyApiClient';
import {PublicApiClient, RegisteredUser, TeamOwner} from './backend/PublicApiClient';

export type TestOptions = {
  os: 'windows' | 'macOS';
  appOptions: {env?: string; lang?: string};
};

type Fixtures = {
  app: App;
  publicApi: PublicApiClient;
  brigApi: BrigApiClient;
  galleyApi: GalleyApiClient;

  createUser: () => Promise<RegisteredUser>;
  createPage: () => Promise<Page>;
  createTeam: (...args: Parameters<typeof createTeam> extends [any, ...infer Args] ? Args : never) => Promise<Team>;
};

export const test = baseTest.extend<TestOptions & Fixtures>({
  // The os option is set by the project within playwright.config.ts
  os: ['macOS', {option: true}],
  appOptions: {env: process.env.WEBAPP_URL, lang: 'en'},

  publicApi: async ({}, use) => {
    if (process.env.BACKEND_URL === undefined) {
      throw new Error('Missing env var BACKEND_URL');
    }

    await use(new PublicApiClient({baseUrl: process.env.BACKEND_URL}));
  },

  brigApi: async ({}, use) => {
    if (process.env.BACKEND_URL === undefined) {
      throw new Error('Missing env var BACKEND_URL');
    }

    if (process.env.BACKEND_BASIC_AUTH === undefined) {
      throw new Error('Missing env var BACKEND_BASIC_AUTH');
    }

    await use(new BrigApiClient({baseUrl: process.env.BACKEND_URL, basicAuth: process.env.BACKEND_BASIC_AUTH}));
  },

  galleyApi: async ({}, use) => {
    if (process.env.BACKEND_URL === undefined) {
      throw new Error('Missing env var BACKEND_URL');
    }

    if (process.env.BACKEND_BASIC_AUTH === undefined) {
      throw new Error('Missing env var BACKEND_BASIC_AUTH');
    }

    await use(new GalleyApiClient({baseUrl: process.env.BACKEND_URL, basicAuth: process.env.BACKEND_BASIC_AUTH}));
  },

  app: async ({appOptions}, use, testInfo) => {
    // Always use a fresh temporary directory for the user data to ensure test isolation
    const tempUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-desktop-e2e-tests-'));
    const app = await createApp({...appOptions, dataDir: tempUserDataDir});

    // Traces for the electron app need to be collected manually as it uses a non default context
    await app.page.context().tracing.start({screenshots: true, snapshots: true});

    await use(app);

    // Add the trace of the first run as attachment if it failed
    if (testInfo.status === 'failed' && testInfo.retry === 0) {
      const tracePath = testInfo.outputPath('app-trace.zip');
      await app.page.context().tracing.stop({path: tracePath});
      await testInfo.attach('app-trace.zip', {path: tracePath});
    }

    await app.close();
    await fs.rm(tempUserDataDir, {recursive: true, maxRetries: 3, retryDelay: 1_000});
  },

  createUser: async ({publicApi, brigApi}, use) => {
    const users: RegisteredUser[] = [];

    await use(async () => {
      const userData = createUser();
      const user = await registerUser(userData, {publicApi, brigApi}, {telemetryDataSharing: false});
      users.push(user);
      return user;
    });

    await Promise.all(users.map(user => publicApi.deleteUser(user)));
  },

  createTeam: async ({publicApi, brigApi, galleyApi}, use) => {
    const teamOwners: TeamOwner[] = [];

    await use(async (teamName, options) => {
      const team = await createTeam({publicApi, brigApi, galleyApi}, teamName, options);
      teamOwners.push(team.owner);
      return team;
    });

    await Promise.all(teamOwners.map(owner => publicApi.deleteTeam(owner)));
  },

  createPage: async ({browser}, use) => {
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    await use(async () => {
      const context = await browser.newContext();
      contexts.push(context);

      const page = await context.newPage();
      pages.push(page);
      await page.goto('/'); // Open the base url to ensure the page starts in the same state as the app

      return page;
    });

    // Close all pages created throughout the tests and dismiss before unload dialogs
    await Promise.all(pages.map(page => page.close({runBeforeUnload: true})));
    await Promise.all(contexts.map(ctx => ctx.close()));
  },
});

export * from '@playwright/test';
