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

import * as assert from 'assert';
import * as path from 'path';

import {BoundedLogWriter, BoundedLogWriterDependencies, createBoundedLogWriter} from './boundedLogWriter';
import {createLogMaintenanceCoordinator} from './logMaintenance';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

function createTestFileSystemDependencies(currentTimeMilliseconds: number): BoundedLogWriterDependencies {
  return {
    async appendFile(filePath: string, content: string): Promise<void> {
      await fs.appendFile(filePath, content);
    },
    async ensureDirectory(directoryPath: string): Promise<void> {
      await fs.ensureDir(directoryPath);
    },
    getCurrentTimeMilliseconds: (): number => {
      return currentTimeMilliseconds;
    },
    async getFileSize(filePath: string): Promise<number> {
      if ((await fs.pathExists(filePath)) === false) {
        return 0;
      }

      const fileStatistics = await fs.stat(filePath);

      return fileStatistics.size;
    },
    async moveFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
      await fs.move(sourceFilePath, destinationFilePath, {overwrite: false});
    },
    async pathExists(filePath: string): Promise<boolean> {
      return fs.pathExists(filePath);
    },
  };
}

async function writeLogMessages(
  boundedLogWriter: BoundedLogWriter,
  logFilePath: string,
  messages: readonly string[],
): Promise<void> {
  await Promise.all(
    messages.map(message => {
      return boundedLogWriter.write({logFilePath, message});
    }),
  );
}

function waitMilliseconds(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

function ignorePostWriteCleanup(): Promise<void> {
  return Promise.resolve();
}

function createTestMaintenanceCoordinator() {
  const invoker = createFireAndForgetInvoker({
    reportFailure(): void {
      // The coordinator's public promises report expected operation failures.
    },
  });

  return createLogMaintenanceCoordinator({fireAndForget: invoker.fireAndForget});
}

describe('bounded desktop log writer', () => {
  it(
    'preserves the order of concurrent writes to one file',
    withTemporaryDirectory('wire-bounded-log-writer-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(1),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });

      await writeLogMessages(boundedLogWriter, logFilePath, ['first', 'second', 'third']);

      const actualLogContent = await fs.readFile(logFilePath, 'utf8');
      const expectedLogContent = 'first\nsecond\nthird\n';

      assert.strictEqual(actualLogContent, expectedLogContent);
    }),
  );

  it(
    'does not serialize writes to different files',
    withTemporaryDirectory('wire-bounded-log-parallel-', async (temporaryLogDirectory: string) => {
      const firstLogFilePath = path.join(temporaryLogDirectory, 'first.log');
      const secondLogFilePath = path.join(temporaryLogDirectory, 'second.log');
      let activeAppendCount = 0;
      let maximumConcurrentAppendCount = 0;
      const baseDependencies = createTestFileSystemDependencies(5);
      const dependencies: BoundedLogWriterDependencies = {
        ...baseDependencies,
        async appendFile(filePath: string, content: string): Promise<void> {
          activeAppendCount += 1;
          maximumConcurrentAppendCount = Math.max(maximumConcurrentAppendCount, activeAppendCount);
          await waitMilliseconds(5);
          await fs.appendFile(filePath, content);
          activeAppendCount -= 1;
        },
      };
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies,
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });

      await Promise.all([
        boundedLogWriter.write({logFilePath: firstLogFilePath, message: 'first'}),
        boundedLogWriter.write({logFilePath: secondLogFilePath, message: 'second'}),
      ]);

      assert.strictEqual(maximumConcurrentAppendCount, 2);
    }),
  );

  it(
    'appends to a pre-existing current file with a fresh writer instance',
    withTemporaryDirectory('wire-bounded-log-restart-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const firstWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(7),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });
      const secondWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(7),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });

      await firstWriter.write({logFilePath, message: 'before restart'});
      await secondWriter.write({logFilePath, message: 'after restart'});

      const actualLogContent = await fs.readFile(logFilePath, 'utf8');

      assert.strictEqual(actualLogContent, 'before restart\nafter restart\n');
    }),
  );

  it(
    'rotates before an entry exceeds the configured file size',
    withTemporaryDirectory('wire-bounded-log-rotation-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      let rotationCount = 0;
      const boundedLogWriter = createBoundedLogWriter({
        async afterWrite(): Promise<void> {
          rotationCount += 1;
        },
        dependencies: createTestFileSystemDependencies(2),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 10,
      });

      await boundedLogWriter.write({logFilePath, message: '12345'});
      await boundedLogWriter.write({logFilePath, message: '6789'});

      const actualCurrentLogContent = await fs.readFile(logFilePath, 'utf8');
      const actualRotatedLogContent = await fs.readFile(`${logFilePath}.2-0.old`, 'utf8');

      assert.strictEqual(actualCurrentLogContent, '6789\n');
      assert.strictEqual(actualRotatedLogContent, '12345\n');
      assert.strictEqual(rotationCount, 1);
    }),
  );

  it(
    'chooses a new rotated path when the first candidate already exists',
    withTemporaryDirectory('wire-bounded-log-collision-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const existingRotatedLogPath = `${logFilePath}.3-0.old`;
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(3),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 10,
      });

      await fs.outputFile(existingRotatedLogPath, 'existing\n');
      await boundedLogWriter.write({logFilePath, message: '12345'});
      await boundedLogWriter.write({logFilePath, message: '6789'});

      const actualRotatedLogContent = await fs.readFile(`${logFilePath}.3-1.old`, 'utf8');

      assert.strictEqual(actualRotatedLogContent, '12345\n');
      assert.strictEqual(await fs.readFile(existingRotatedLogPath, 'utf8'), 'existing\n');
    }),
  );

  it(
    'allows an individual entry larger than the configured file size',
    withTemporaryDirectory('wire-bounded-log-large-entry-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(4),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 5,
      });

      await boundedLogWriter.write({logFilePath, message: '123456'});
      await boundedLogWriter.write({logFilePath, message: 'x'});

      const actualCurrentLogContent = await fs.readFile(logFilePath, 'utf8');
      const actualRotatedLogContent = await fs.readFile(`${logFilePath}.4-0.old`, 'utf8');

      assert.strictEqual(actualCurrentLogContent, 'x\n');
      assert.strictEqual(actualRotatedLogContent, '123456\n');
    }),
  );

  it(
    'runs post-write cleanup after an oversized entry',
    withTemporaryDirectory('wire-bounded-log-large-entry-cleanup-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      let cleanupCount = 0;
      const boundedLogWriter = createBoundedLogWriter({
        async afterWrite(): Promise<void> {
          cleanupCount += 1;
        },
        dependencies: createTestFileSystemDependencies(5),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 5,
      });

      await boundedLogWriter.write({logFilePath, message: '123456'});

      assert.strictEqual(cleanupCount, 1);
    }),
  );

  it(
    'does not deadlock when rotation cleanup requests maintenance',
    withTemporaryDirectory('wire-bounded-log-rotation-cleanup-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const maintenanceCoordinator = createTestMaintenanceCoordinator();
      let cleanupCount = 0;
      const boundedLogWriter = createBoundedLogWriter({
        async afterWrite(): Promise<void> {
          cleanupCount += 1;
          await maintenanceCoordinator.runMaintenance(async (): Promise<void> => {
            // The test only verifies that the maintenance request completes.
          });
        },
        dependencies: createTestFileSystemDependencies(6),
        maintenanceCoordinator,
        maximumFileSizeBytes: 10,
      });

      await boundedLogWriter.write({logFilePath, message: '12345'});
      await boundedLogWriter.write({logFilePath, message: '6789'});

      assert.strictEqual(cleanupCount, 1);
    }),
  );
});
