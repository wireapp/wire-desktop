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

import {LogDirectoryCleanupDependencies, LogDirectoryMetadata, removeEmptyLogDirectory} from './logDirectoryCleanup';

describe('log directory cleanup', () => {
  it('returns unexpected filesystem failures as an Err result', async () => {
    const expectedFailure = new Error('directory removal failed');
    const dependencies: LogDirectoryCleanupDependencies = {
      async getDirectoryMetadata(): Promise<LogDirectoryMetadata> {
        return {isDirectory: true, isSymbolicLink: false};
      },
      async removeDirectory(): Promise<void> {
        return Promise.reject(expectedFailure);
      },
    };

    const cleanupResult = await removeEmptyLogDirectory({dependencies, directoryPath: 'logs/2026-08-20'});

    assert.strictEqual(cleanupResult.isErr, true);

    if (cleanupResult.isErr) {
      assert.strictEqual(cleanupResult.error, expectedFailure);
    }
  });
});
