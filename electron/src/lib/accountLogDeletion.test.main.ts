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

import {Result} from 'true-myth';

import * as assert from 'assert';
import * as path from 'path';

import {
  deleteAccountLogDirectories,
  getAccountLogDirectories,
  parseLegacyAccountLogDirectory,
} from './accountLogDeletion';

import {LogDirectoryCleanupResult} from '../logging/logDirectoryCleanup';

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
      path.join(logDirectory, `foo_${accountId}`, 'console.log'),
      path.join(logDirectory, `backup_2_2026_07_10_12_34_56_${accountId}`, 'console.log'),
      path.join(logDirectory, `2_invalid_${accountId}`, 'console.log'),
    ];

    const actualDirectories = getAccountLogDirectories({accountId, filePaths, logDirectory});
    const expectedDirectories = [
      path.join(logDirectory, accountId),
      path.join(logDirectory, '2026-07-10', 'accounts', accountId),
      path.join(logDirectory, `2_2026_07_10_12_34_56_${accountId}`),
    ].toSorted();

    assert.deepStrictEqual(actualDirectories, expectedDirectories);
  });

  it('parses only the historic timestamped account directory format', () => {
    const parsedDirectory = parseLegacyAccountLogDirectory(`2_2026_07_10_12_34_56_${accountId}`);
    const rejectedDirectoryNames = [
      `foo_${accountId}`,
      `backup_2_2026_07_10_12_34_56_${accountId}`,
      `2_invalid_${accountId}`,
      `-1_2026_07_10_12_34_56_${accountId}`,
    ];

    assert.strictEqual(parsedDirectory.isJust, true);

    if (parsedDirectory.isJust) {
      assert.strictEqual(parsedDirectory.value.accountId, accountId);
      assert.strictEqual(parsedDirectory.value.accountIndex, 2);
    }

    for (const directoryName of rejectedDirectoryNames) {
      assert.strictEqual(parseLegacyAccountLogDirectory(directoryName).isNothing, true);
    }
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
        async removeEmptyDirectoryAncestors(): Promise<LogDirectoryCleanupResult> {
          // Account directory pruning is covered by the filesystem boundary tests.

          return Result.ok();
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

  it('deletes new and valid legacy account directories and prunes their ancestors', async () => {
    const removedDirectories: string[] = [];
    const prunedDirectories: string[] = [];
    const filePaths = [
      path.join(logDirectory, '2026-07-10', 'accounts', accountId, 'console.log'),
      path.join(logDirectory, `2_2026_07_10_12_34_56_${accountId}`, 'console.log'),
    ];

    await deleteAccountLogDirectories({
      accountId,
      dependencies: {
        async isSafeDirectory(): Promise<boolean> {
          return true;
        },
        async removeEmptyDirectoryAncestors(directoryPath: string): Promise<LogDirectoryCleanupResult> {
          prunedDirectories.push(directoryPath);

          return Result.ok();
        },
        async removeDirectory(directoryPath: string): Promise<void> {
          removedDirectories.push(directoryPath);
        },
        reportFailure: (): void => {
          // The valid account layouts should not report failures.
        },
      },
      filePaths,
      logDirectory,
    });

    assert.deepStrictEqual(
      removedDirectories,
      [
        path.join(logDirectory, accountId),
        path.join(logDirectory, '2026-07-10', 'accounts', accountId),
        path.join(logDirectory, `2_2026_07_10_12_34_56_${accountId}`),
      ].toSorted(),
    );
    assert.deepStrictEqual(prunedDirectories, removedDirectories);
  });
});
