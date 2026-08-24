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

import {app} from 'electron';

import * as assert from 'assert';
import * as path from 'path';

import {getLogDirectory, getMainProcessLogPath, getSsoLogPath, getWebViewLogPath} from './logPaths';

describe('desktop log paths', () => {
  it('resolves the log root from the final Electron user-data path', () => {
    const originalUserDataPath = app.getPath('userData');
    const configuredUserDataPath = path.join(originalUserDataPath, 'configured-user-data');

    app.setPath('userData', configuredUserDataPath);
    const actualLogDirectory = getLogDirectory();
    app.setPath('userData', originalUserDataPath);

    assert.strictEqual(actualLogDirectory, path.join(configuredUserDataPath, 'logs'));
  });

  it('preserves the existing main-process log path', () => {
    const actualPath = getMainProcessLogPath({logDirectory: path.join('user-data', 'logs')});
    const expectedPath = path.join('user-data', 'logs', 'electron.log');

    assert.strictEqual(actualPath, expectedPath);
  });

  it('preserves the existing webview directory format', () => {
    const actualPath = getWebViewLogPath({
      accountIndex: 2,
      date: new Date('2026-07-10T12:34:56.000Z'),
      logDirectory: path.join('user-data', 'logs'),
      webViewId: 'account-webview-id',
    });
    const expectedPath = path.join('user-data', 'logs', '2_2026_07_10_12_34_56_account-webview-id', 'console.log');

    assert.strictEqual(actualPath, expectedPath);
  });

  it('preserves the existing SSO log path', () => {
    const actualPath = getSsoLogPath({
      logDirectory: path.join('user-data', 'logs'),
      logFileName: 'console.log',
      webViewId: 'sso-webview-id',
    });
    const expectedPath = path.join('user-data', 'logs', 'sso-webview-id', 'console.log');

    assert.strictEqual(actualPath, expectedPath);
  });
});
