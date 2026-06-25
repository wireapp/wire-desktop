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
      // Chromium launch args
      `--user-data-dir=${options.dataDir}`,
      '--use-fake-device-for-media-stream', // Provide fake devices for audio & video device input
      '--use-fake-ui-for-media-stream', // Bypasses the popup to grant permission and select video / audio input device by automatically selecting the default one
      '--mute-audio', // Mute all audio output from the test browser because e.g. the ringtone of a call can be annoying during testing
      '.',
      // Wire specific cli flags to set during launch
      `--env=${options.env}`,
      `--lang=${options.lang ?? 'en'}`,
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

  const enhancedApp = Object.assign(app, {wrapper, page});

  /* Make a callback function available on the wrappers window object so it can notify the paywright process */
  const onActiveAccountChange = (newAccountId: string) => {
    const newActivePage = app.windows().find(page => {
      // Compare the id of the window to the one which became active (removing the hash based routing)
      return newAccountId === new URLSearchParams(page.url().split('#')[0]).get('id');
    });

    // If there's a new active account, update the page property of app with its page
    if (newActivePage !== undefined) {
      enhancedApp.page = newActivePage;
    }
  };
  await wrapper.exposeFunction('onActiveAccountChange', onActiveAccountChange);

  /* Observe the list of webviews for changes, if the currently visible webview changes inform the playwright process about the new accountId */
  await wrapper.locator('ul.WebviewList').evaluate(list => {
    new window.MutationObserver(() => {
      const activeAccountId = list.querySelector('webview[visible="true"]')?.getAttribute('data-accountid');
      if (activeAccountId != undefined) {
        onActiveAccountChange(activeAccountId);
      }
    }).observe(list, {attributeFilter: ['visible'], childList: true, subtree: true});
  });

  return enhancedApp;
};
