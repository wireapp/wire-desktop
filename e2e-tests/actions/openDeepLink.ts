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

import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

import {App} from './createApp';

// Open a deep link from outside of the application.
// On macOS the link is handed to the OS, which forwards it to the app registered for the `wire://` protocol (see README).
// On other platforms the link is delivered to the running app through its main process.
export const openDeepLink = async (app: App, url: string) => {
  if (process.platform === 'darwin') {
    await promisify(execFile)('open', [url]);
    return;
  }

  await app.evaluate(({app}, deepLink) => {
    app.emit('open-url', {preventDefault: () => {}}, deepLink);
  }, url);
};
