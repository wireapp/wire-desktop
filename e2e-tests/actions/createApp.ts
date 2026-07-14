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

import {_electron as electron} from '@playwright/test';

export type App = Awaited<ReturnType<typeof createApp>>;

export const createApp = async (options: {
  env?: string;
  lang?: string;
  dataDir: string;
  bypassPermissions?: boolean;
}) => {
  if (!options.env) {
    throw new Error(`Can't create app without environment, make sure the env var "WEBAPP_URL" is set`);
  }

  const app = await electron.launch({
    args: [
      // Chromium launch args
      `--user-data-dir=${options.dataDir}`,
      '--mute-audio', // Mute all audio output from the test browser because e.g. the ringtone of a call can be annoying during testing
      ...(options.bypassPermissions ?? true
        ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
        : []), // Provide fake devices for audio & video device input and bypasses the popup to grant permission and select video / audio input device by automatically selecting the default one
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

  /**
   * The webview element isn't treated as a regular webcomponent / iframe by electron but as individual window.
   * So in order to access the contents of the application we need to use the second window.
   */
  const wrapper = await app.waitForEvent('window');
  const page = await app.waitForEvent('window');

  return Object.assign(app, {
    /* The playwright page for the main electron window wrapping the webapp */
    wrapper,
    /* The playwright page for the currently shown webapp */
    page,
    /**
     * Utility function to re-open the application re-using the existing storage state
     * **Important:** the existing app won't be updated by this, instead the variable needs to be re-assigned
     * @returns {App} app
     */
    reopen: async () => {
      await app.close();

      // During the re-launch the old instance of the app is closed. However the fixture is still pointing to it, so we set its close function to now close the relaunched instance.
      // This way it's ensured that even after relaunch(es) the app will always be cleaned up.
      const relaunchedApp = await createApp(options);
      app.close = relaunchedApp.close;

      return relaunchedApp;
    },
  });
};
