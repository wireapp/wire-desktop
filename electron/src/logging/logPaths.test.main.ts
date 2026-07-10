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

import * as assert from 'assert';
import * as path from 'path';

import {
  getAccountLogFilePath,
  getLegacyWebviewLogDirectory,
  getLegacyWebviewLogFilePath,
  getLogDirectoryPath,
  getMainProcessLogFilePath,
} from './logPaths';

describe('logPaths', () => {
  it('constructs the log directory from the supplied user data directory', () => {
    const actualLogDirectory = getLogDirectoryPath('/temporary/user-data');
    const expectedLogDirectory = path.join('/temporary/user-data', 'logs');

    assert.strictEqual(actualLogDirectory, expectedLogDirectory);
  });

  it('preserves the legacy webview log directory format', () => {
    const actualLogDirectory = getLegacyWebviewLogDirectory({
      accountId: 'a0fddc04-8bf4-4e06-9741-060ac777ed00',
      accountIndex: 1,
      createdAt: new Date('2020-05-04T13:42:00.000Z'),
      logDirectory: '/temporary/user-data/logs',
    });
    const expectedLogDirectory = path.join(
      '/temporary/user-data/logs',
      '1_2020_05_04_13_42_00_a0fddc04-8bf4-4e06-9741-060ac777ed00',
    );

    assert.strictEqual(actualLogDirectory, expectedLogDirectory);
  });

  it('preserves the account log file format used by SSO', () => {
    const actualLogFilePath = getAccountLogFilePath({
      accountId: 'a0fddc04-8bf4-4e06-9741-060ac777ed00',
      logDirectory: '/temporary/user-data/logs',
      logFileName: 'console.log',
    });
    const expectedLogFilePath = path.join(
      '/temporary/user-data/logs',
      'a0fddc04-8bf4-4e06-9741-060ac777ed00',
      'console.log',
    );

    assert.strictEqual(actualLogFilePath, expectedLogFilePath);
  });

  it('constructs a legacy webview log file path', () => {
    const actualLogFilePath = getLegacyWebviewLogFilePath(
      {
        accountId: 'a0fddc04-8bf4-4e06-9741-060ac777ed00',
        accountIndex: 1,
        createdAt: new Date('2020-05-04T13:42:00.000Z'),
        logDirectory: '/temporary/user-data/logs',
      },
      'console.log',
    );
    const expectedLogFilePath = path.join(
      '/temporary/user-data/logs',
      '1_2020_05_04_13_42_00_a0fddc04-8bf4-4e06-9741-060ac777ed00',
      'console.log',
    );

    assert.strictEqual(actualLogFilePath, expectedLogFilePath);
  });

  it('constructs the main process log file path', () => {
    const actualLogFilePath = getMainProcessLogFilePath('/temporary/user-data/logs');
    const expectedLogFilePath = path.join('/temporary/user-data/logs', 'electron.log');

    assert.strictEqual(actualLogFilePath, expectedLogFilePath);
  });
});
