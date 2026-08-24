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

import {deleteAccountLogDirectories, getAccountLogDirectories} from './accountLogDeletion';

const logDirectory = path.join('user-data', 'logs');
const accountId = '11111111-1111-4111-8111-111111111111';
const otherAccountId = '22222222-2222-4222-8222-222222222222';

describe('account log deletion', () => {
  it('matches new daily and supported legacy layouts by exact account identity', () => {
    const filePaths = [
      path.join(logDirectory, '2026-07-10', 'accounts', accountId, 'console.log'),
      path.join(logDirectory, accountId, 'console.log'),
      path.join(logDirectory, `2_2026_07_10_12_34_56_${accountId}`, 'console.log'),
      path.join(logDirectory, `2_2026_07_10_12_34_56_${otherAccountId}`, 'console.log'),
      path.join(logDirectory, '2026-07-10', 'accounts', `${accountId}-suffix`, 'console.log'),
    ];

    const actualDirectories = getAccountLogDirectories({accountId, filePaths, logDirectory});
    const expectedDirectories = [
      path.join(logDirectory, accountId),
      path.join(logDirectory, '2026-07-10', 'accounts', accountId),
      path.join(logDirectory, `2_2026_07_10_12_34_56_${accountId}`),
    ].toSorted();

    assert.deepStrictEqual(actualDirectories, expectedDirectories);
  });

  it('skips unsafe directories and continues after deletion failures', async () => {
    const removedDirectories: string[] = [];
    const failures: string[] = [];
    const filePaths = [
      path.join(logDirectory, accountId, 'console.log'),
      path.join(logDirectory, '2026-07-10', 'accounts', accountId, 'console.log'),
    ];

    await deleteAccountLogDirectories({
      accountId,
      dependencies: {
        async isSafeDirectory(directoryPath: string): Promise<boolean> {
          return directoryPath === path.join(logDirectory, accountId);
        },
        async removeDirectory(directoryPath: string): Promise<void> {
          if (directoryPath === path.join(logDirectory, accountId)) {
            throw new Error('test failure');
          }

          removedDirectories.push(directoryPath);
        },
        reportFailure: (message: string): void => {
          failures.push(message);
        },
      },
      filePaths,
      logDirectory,
    });

    assert.deepStrictEqual(removedDirectories, []);
    assert.strictEqual(failures.length, 1);
  });
});
