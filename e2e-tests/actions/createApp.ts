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

import {_electron as electron, Page} from '@playwright/test';

export type App = Awaited<ReturnType<typeof createApp>>;

export const createApp = async (options: {
  env?: string;
  lang?: string;
  dataDir: string;
  bypassPermissions?: boolean;
  /* When set, a packaged build is launched instead of the sources in the working directory (needed for OS level deep links) */
  executablePath?: string;
}) => {
  if (!options.env) {
    throw new Error(`Can't create app without environment, make sure the env var "WEBAPP_URL" is set`);
  }

  const {executablePath} = options;

  const app = await electron.launch({
    ...(executablePath ? {executablePath} : {}),
    args: [
      // Chromium launch args
      `--user-data-dir=${options.dataDir}`,
      '--mute-audio', // Mute all audio output from the test browser because e.g. the ringtone of a call can be annoying during testing
      ...(options.bypassPermissions ?? true
        ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
        : []), // Provide fake devices for audio & video device input and bypasses the popup to grant permission and select video / audio input device by automatically selecting the default one
      ...(executablePath ? [] : ['.']),
      // Wire specific cli flags to set during launch
      `--env=${options.env}`,
      `--lang=${options.lang ?? 'en'}`,
    ],
  });

  // Register the listener right away, windows opening while we await something else would be missed otherwise
  const windows: Page[] = [];
  const windowListeners = new Set<() => void>();
  const addWindow = (window: Page) => {
    if (!windows.includes(window)) {
      windows.push(window);
      windowListeners.forEach(listener => listener());
    }
  };
  app.on('window', addWindow);
  // Playwright only injects its loader (which holds back the app's "ready" event until it's attached) when launching from the sources.
  // A packaged build (executablePath) can therefore open windows before Playwright is connected, those never emit a "window" event.
  app.windows().forEach(addWindow);

  const mainProcessLogs: string[] = [];

  // Forward all logs from the electron apps main thread to the terminal
  app.on('console', async msg => {
    const args = (await Promise.allSettled(msg.args().map(arg => arg.jsonValue())))
      .filter(result => result.status === 'fulfilled')
      .map(arg => arg.value);

    mainProcessLogs.push(args.map(String).join(' '));
    // eslint-disable-next-line no-console
    console.log(...args);
  });
  app.process().stdout?.on('data', data => mainProcessLogs.push(String(data)));
  app.process().stderr?.on('data', data => mainProcessLogs.push(String(data)));

  /**
   * The webview element isn't treated as a regular webcomponent / iframe by electron but as individual window.
   * So in order to access the contents of the application we need to use the second window.
   */
  const timeout = 30_000;
  let timer: NodeJS.Timeout | undefined;
  let onWindow: (() => void) | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      onWindow = () => windows.length >= 2 && resolve();
      windowListeners.add(onWindow);
      onWindow();
      timer = setTimeout(() => {
        const urls = windows.map(window => window.url());
        reject(
          new Error(
            `Expected 2 windows (wrapper and webapp) within ${timeout}ms but got ${windows.length}: ${JSON.stringify(
              urls,
            )}\n` +
              `Main process output (last 50 lines):\n${mainProcessLogs.join('\n').split('\n').slice(-50).join('\n')}`,
          ),
        );
      }, timeout);
    });
  } finally {
    clearTimeout(timer);
    if (onWindow) {
      windowListeners.delete(onWindow);
    }
  }
  // Windows that already existed when Playwright attached aren't guaranteed to be in creation order, the wrapper is the local renderer
  const wrapper = windows.find(window => window.url().startsWith('file:')) ?? windows[0];
  const page = windows.find(window => window !== wrapper)!;

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
      const closePromise = app.waitForEvent('close');
      await app.close();
      await closePromise; // Wait until the app is fully closed before continuing

      // During the re-launch the old instance of the app is closed. However the fixture is still pointing to it, so we set its close function to now close the relaunched instance.
      // This way it's ensured that even after relaunch(es) the app will always be cleaned up.
      const relaunchedApp = await createApp(options);
      app.close = relaunchedApp.close;

      return relaunchedApp;
    },
  });
};
