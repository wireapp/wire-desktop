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

import * as fs from 'fs-extra';
import {Result} from 'true-myth';

import * as assert from 'assert';
import * as path from 'path';

import {
  createLogCleanup,
  createLogCleanupFileSystemDependencies,
  LogCleanupDependencies,
  RunLogCleanupParameters,
} from './logCleanup';
import {LogDirectoryCleanupResult} from './logDirectoryCleanup';
import {LogFileMetadata} from './logRetention';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';

type CleanupTestState = {
  failures: string[];
  removedDirectories: string[];
  removedFiles: string[];
};

function createCleanupTestDependencies(
  fileMetadata: readonly LogFileMetadata[],
  state: CleanupTestState,
): LogCleanupDependencies {
  return {
    async discoverLogFilePaths(): Promise<readonly string[]> {
      return fileMetadata.map(file => {
        return file.filePath;
      });
    },
    getCurrentTimeMilliseconds: (): number => {
      return 1_000_000;
    },
    async getFileMetadata(filePath: string): Promise<LogFileMetadata> {
      const foundFileMetadata = fileMetadata.find(file => {
        return file.filePath === filePath;
      });

      if (foundFileMetadata) {
        return foundFileMetadata;
      }

      throw new Error(`Missing test metadata for ${filePath}`);
    },
    async removeEmptyDirectory(directoryPath: string): Promise<LogDirectoryCleanupResult> {
      state.removedDirectories.push(directoryPath);

      return Result.ok();
    },
    async removeFile(filePath: string): Promise<void> {
      state.removedFiles.push(filePath);
    },
    reportFailure: (message: string): void => {
      state.failures.push(message);
    },
  };
}

function createCleanupParameters(activeFilePaths: ReadonlySet<string>): RunLogCleanupParameters {
  return {
    activeFilePaths,
    logDirectory: 'logs',
    policy: {maximumAgeMilliseconds: 100, maximumTotalSizeBytes: 100},
  };
}

describe('desktop log cleanup', () => {
  it('removes planned files and their empty parent directories', async () => {
    const state: CleanupTestState = {failures: [], removedDirectories: [], removedFiles: []};
    const fileMetadata: LogFileMetadata[] = [
      {
        filePath: 'logs/2026-08-20/accounts/account/console.log',
        fileSizeBytes: 10,
        isSymbolicLink: false,
        modifiedTimeMilliseconds: 1,
      },
      {
        filePath: 'logs/recent/console.log',
        fileSizeBytes: 10,
        isSymbolicLink: false,
        modifiedTimeMilliseconds: 999_999,
      },
    ];
    const cleanup = createLogCleanup(createCleanupTestDependencies(fileMetadata, state));

    await cleanup.run(createCleanupParameters(new Set()));

    assert.deepStrictEqual(state.removedFiles, ['logs/2026-08-20/accounts/account/console.log']);
    assert.deepStrictEqual(state.removedDirectories, [
      'logs/2026-08-20/accounts/account',
      'logs/2026-08-20/accounts',
      'logs/2026-08-20',
    ]);
    assert.deepStrictEqual(state.failures, []);
  });

  it('never removes active files', async () => {
    const state: CleanupTestState = {failures: [], removedDirectories: [], removedFiles: []};
    const fileMetadata: LogFileMetadata[] = [
      {filePath: 'logs/active.log', fileSizeBytes: 200, isSymbolicLink: false, modifiedTimeMilliseconds: 1},
      {filePath: 'logs/eligible.log', fileSizeBytes: 10, isSymbolicLink: false, modifiedTimeMilliseconds: 2},
    ];
    const cleanup = createLogCleanup(createCleanupTestDependencies(fileMetadata, state));

    await cleanup.run(createCleanupParameters(new Set(['logs/active.log'])));

    assert.deepStrictEqual(state.removedFiles, ['logs/eligible.log']);
  });

  it('continues after an individual removal failure', async () => {
    const state: CleanupTestState = {failures: [], removedDirectories: [], removedFiles: []};
    const fileMetadata: LogFileMetadata[] = [
      {filePath: 'logs/first.log', fileSizeBytes: 60, isSymbolicLink: false, modifiedTimeMilliseconds: 1},
      {filePath: 'logs/second.log', fileSizeBytes: 60, isSymbolicLink: false, modifiedTimeMilliseconds: 2},
    ];
    const dependencies = createCleanupTestDependencies(fileMetadata, state);
    const cleanup = createLogCleanup({
      ...dependencies,
      async removeFile(filePath: string): Promise<void> {
        if (filePath === 'logs/first.log') {
          throw new Error('test failure');
        }

        state.removedFiles.push(filePath);
      },
    });

    await cleanup.run(createCleanupParameters(new Set()));

    assert.deepStrictEqual(state.removedFiles, ['logs/second.log']);
    assert.strictEqual(state.failures.length, 1);
  });

  it('coalesces concurrent cleanup triggers', async () => {
    const state: CleanupTestState = {failures: [], removedDirectories: [], removedFiles: []};
    let discoveryCount = 0;
    const fileMetadata: LogFileMetadata[] = [];
    const dependencies = createCleanupTestDependencies(fileMetadata, state);
    const cleanup = createLogCleanup({
      ...dependencies,
      async discoverLogFilePaths(): Promise<readonly string[]> {
        discoveryCount += 1;
        await new Promise<void>(resolve => {
          setTimeout(resolve, 5);
        });

        return [];
      },
    });
    const cleanupParameters = createCleanupParameters(new Set());

    await Promise.all([cleanup.run(cleanupParameters), cleanup.run(cleanupParameters)]);

    assert.strictEqual(discoveryCount, 1);
  });

  it(
    'removes empty ancestors without removing the log root or following symbolic links',
    withTemporaryDirectory('wire-log-cleanup-directories-', async (temporaryLogDirectory: string) => {
      const reportFailure = (): void => {
        // The test expects no filesystem failures.
      };
      const dependencies = createLogCleanupFileSystemDependencies(reportFailure);
      const dateDirectory = path.join(temporaryLogDirectory, '2026-08-20');
      const accountsDirectory = path.join(dateDirectory, 'accounts');
      const accountDirectory = path.join(accountsDirectory, 'account');
      const symbolicLinkTarget = path.join(temporaryLogDirectory, 'symbolic-link-target');
      const symbolicLinkPath = path.join(accountsDirectory, 'symbolic-link');

      await fs.ensureDir(accountDirectory);
      await fs.ensureDir(symbolicLinkTarget);
      await fs.symlink(symbolicLinkTarget, symbolicLinkPath, 'dir');

      await dependencies.removeEmptyDirectory(accountDirectory);
      await dependencies.removeEmptyDirectory(accountsDirectory);
      await dependencies.removeEmptyDirectory(dateDirectory);
      await dependencies.removeEmptyDirectory(symbolicLinkPath);

      assert.strictEqual(await fs.pathExists(accountDirectory), false);
      assert.strictEqual(await fs.pathExists(accountsDirectory), true);
      assert.strictEqual(await fs.pathExists(dateDirectory), true);
      assert.strictEqual(await fs.pathExists(temporaryLogDirectory), true);
      assert.strictEqual((await fs.lstat(symbolicLinkPath)).isSymbolicLink(), true);
    }),
  );
});
