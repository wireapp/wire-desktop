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

import {test as baseTest} from '@playwright/test';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {BrigApiClient, createBrigApiClient} from './backend/brig';
import {createApp, type App} from './utils/createApp';

type FixtureOptions = {appOptions: {env?: string; lang?: string}};

type Fixtures = {app: App; brigApi: BrigApiClient};

export const test = baseTest.extend<FixtureOptions & Fixtures>({
  appOptions: {env: process.env.WEBAPP_URL, lang: 'en'},

  brigApi: async ({}, use) => {
    await use(createBrigApiClient());
  },

  app: async ({appOptions}, use) => {
    // Always use a fresh temporary directory for the user data to ensure test isolation
    const tempUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-desktop-e2e-tests-'));
    const app = await createApp({...appOptions, dataDir: tempUserDataDir});

    await use(app);

    await app.close();
    await fs.rm(tempUserDataDir, {recursive: true});
  },

  // Overwrite of the default page fixture to reference the apps page instead
  page: async ({app}, use) => {
    await use(app.page);
  },
});

export * from '@playwright/test';
