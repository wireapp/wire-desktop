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
    const actualPath = getMainProcessLogPath({
      date: new Date('2026-07-10T12:34:56.000Z'),
      logDirectory: path.join('user-data', 'logs'),
    });
    const expectedPath = path.join('user-data', 'logs', '2026-07-10', 'electron.log');

    assert.strictEqual(actualPath, expectedPath);
  });

  it('uses the account UUID below the UTC daily directory for webview logs', () => {
    const actualPath = getWebViewLogPath({
      accountId: 'account-id',
      date: new Date('2026-07-10T12:34:56.000Z'),
      logDirectory: path.join('user-data', 'logs'),
    });
    const expectedPath = path.join('user-data', 'logs', '2026-07-10', 'accounts', 'account-id', 'console.log');

    assert.strictEqual(actualPath, expectedPath);
  });

  it('uses the same account directory for SSO logs', () => {
    const actualPath = getSsoLogPath({
      accountId: 'account-id',
      date: new Date('2026-07-10T12:34:56.000Z'),
      logDirectory: path.join('user-data', 'logs'),
    });
    const expectedPath = path.join('user-data', 'logs', '2026-07-10', 'accounts', 'account-id', 'sso.log');

    assert.strictEqual(actualPath, expectedPath);
  });

  it('switches daily directories at UTC midnight', () => {
    const beforeMidnightPath = getMainProcessLogPath({
      date: new Date('2026-07-10T23:59:59.999Z'),
      logDirectory: path.join('user-data', 'logs'),
    });
    const afterMidnightPath = getMainProcessLogPath({
      date: new Date('2026-07-11T00:00:00.000Z'),
      logDirectory: path.join('user-data', 'logs'),
    });

    assert.strictEqual(path.dirname(beforeMidnightPath), path.join('user-data', 'logs', '2026-07-10'));
    assert.strictEqual(path.dirname(afterMidnightPath), path.join('user-data', 'logs', '2026-07-11'));
  });
});
