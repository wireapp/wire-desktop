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

import {createApp, type App} from './utils/createApp';

type FixtureOptions = {appOptions: {env: string}};

type Fixtures = {app: App};

export const test = baseTest.extend<FixtureOptions & Fixtures>({
  appOptions: {env: 'https://wire-webapp-dev.zinfra.io'},

  app: async ({appOptions}, use) => {
    const app = await createApp(appOptions);
    await use(app);
    await app.close();
  },

  // Overwrite of the default page fixture to reference the apps page instead
  page: async ({app}, use) => {
    await use(app.page);
  },
});

export * from '@playwright/test';
