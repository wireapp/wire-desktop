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

import {_electron as electron, ElectronApplication, Page} from '@playwright/test';

export type App = ElectronApplication & {
  /* The playwright page for the main electron window wrapping the webapp */
  wrapper: Page;
  /* The playwright page for the currently shown webapp */
  page: Page;
};

export const createApp = async (options: {env?: string; lang?: string; dataDir: string}): Promise<App> => {
  if (!options.env) {
    throw new Error(`Can't create app without environment, make sure the env var "WEBAPP_URL" is set`);
  }

  const app = await electron.launch({
    args: [
      '.',
      `--env=${options.env}`,
      `--lang=${options.lang ?? 'en'}`,
      `--user-data-dir=${options.dataDir}`,
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  });

  // Forward all logs from the electron apps main thread to the terminal
  app.on('console', async msg => {
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
    // eslint-disable-next-line no-console
    console.log(...args);
  });

  // Mock safeStorage API of electron as it doesn't work for the headless linux used in CI
  app.evaluate(({safeStorage}) => {
    safeStorage.encryptString = (plainText: string) => Buffer.from(plainText, 'utf-8');
    safeStorage.decryptString = (encrypted: Buffer) => Buffer.from(encrypted).toString('utf-8');
  });

  /**
   * The webview element isn't treated as a regular webcomponent / iframe by electron but as individual window.
   * So in order to access the contents of the application we need to use the second window.
   */
  const wrapper = await app.waitForEvent('window');
  const page = await app.waitForEvent('window');

  return Object.assign(app, {wrapper, page});
};
