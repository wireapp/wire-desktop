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

import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';

import {App} from './createApp';

const SECOND_INSTANCE_LOG = 'Second instance detected';

// Open a deep link from outside of the application, the same way the operating system delivers it.
// - macOS: the link is handed to the OS via `open`, which forwards it to the app registered for the `wire://` protocol
//   (the packaged build under test, see README) and arrives in the app as `open-url` event.
// - Windows: the OS starts a second instance of the registered executable with the link as argument, the running app
//   receives it through the `second-instance` event (see `CoreProtocol.ts`). We start that second instance ourselves with
//   the same executable and user data dir, so the real single instance lock & `second-instance` handling is exercised.
//   What isn't covered is the protocol registration in the Windows registry itself.
export const openDeepLink = async (app: App, url: string) => {
  if (process.platform === 'darwin') {
    await promisify(execFile)('open', [url]);
    return;
  }

  await openDeepLinkViaSecondInstance(app, url);
};

const openDeepLinkViaSecondInstance = async (app: App, url: string) => {
  const timeout = 30_000;
  let timer: NodeJS.Timeout | undefined;
  let removeListeners = () => {};

  // Listen before starting the second instance, the running app may handle it right away
  const handled = new Promise<void>((resolve, reject) => {
    const onOutput = (text: string) => text.includes(SECOND_INSTANCE_LOG) && resolve();
    const onConsole = (msg: {text: () => string}) => onOutput(msg.text());
    const onData = (data: unknown) => onOutput(String(data));
    app.on('console', onConsole);
    app.process().stdout?.on('data', onData);
    removeListeners = () => {
      app.off('console', onConsole);
      app.process().stdout?.off('data', onData);
    };
    timer = setTimeout(
      () =>
        reject(
          new Error(`The running app didn't receive the deep link "${url}" from a second instance within ${timeout}ms`),
        ),
      timeout,
    );
  });

  const {executable, args} = app.launchCommand;
  const secondInstance = spawn(executable, [...args, url], {stdio: 'ignore'});

  try {
    await Promise.race([handled, new Promise<never>((_, reject) => secondInstance.once('error', reject))]);
  } finally {
    clearTimeout(timer);
    removeListeners();
    // The second instance has done its job once the running app got the link, make sure it doesn't linger
    if (secondInstance.exitCode === null && secondInstance.signalCode === null) {
      secondInstance.kill();
    }
  }
};
