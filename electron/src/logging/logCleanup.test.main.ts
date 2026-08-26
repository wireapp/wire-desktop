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

import {createLogCleanup, LogCleanupDependencies, RunLogCleanupParameters} from './logCleanup';
import {LogFileMetadata} from './logRetention';

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
    async removeEmptyDirectory(directoryPath: string): Promise<void> {
      state.removedDirectories.push(directoryPath);
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
      {filePath: 'logs/old/console.log', fileSizeBytes: 10, isSymbolicLink: false, modifiedTimeMilliseconds: 1},
      {
        filePath: 'logs/recent/console.log',
        fileSizeBytes: 10,
        isSymbolicLink: false,
        modifiedTimeMilliseconds: 999_999,
      },
    ];
    const cleanup = createLogCleanup(createCleanupTestDependencies(fileMetadata, state));

    await cleanup.run(createCleanupParameters(new Set()));

    assert.deepStrictEqual(state.removedFiles, ['logs/old/console.log']);
    assert.deepStrictEqual(state.removedDirectories, ['logs/recent', 'logs/old']);
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
});
