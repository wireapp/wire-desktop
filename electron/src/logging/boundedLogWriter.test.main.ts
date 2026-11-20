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
import {Maybe} from 'true-myth';

import * as assert from 'assert';
import * as path from 'path';

import {BoundedLogWriter, BoundedLogWriterDependencies, createBoundedLogWriter} from './boundedLogWriter';
import {createLogCleanup, createLogCleanupFileSystemDependencies} from './logCleanup';
import {createLogMaintenanceCoordinator} from './logMaintenance';
import {
  appendPrivateLogFile,
  createLogFileIdentityChangedError,
  ensurePrivateLogDirectory,
  protectPrivateFile,
} from './logPermissions';
import {LogRetentionPolicy} from './logRetention';
import {createWebViewConsoleLogger} from './webViewConsoleLogger';

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

type CreatePrivateFileSystemDependenciesParameters = {
  currentTimeMilliseconds: number;
  logDirectory: string;
  openLogFile?: (filePath: string, flags: number, mode?: number) => Promise<fs.promises.FileHandle>;
};

function createPrivateFileSystemDependencies(
  parameters: CreatePrivateFileSystemDependenciesParameters,
): BoundedLogWriterDependencies {
  return {
    async appendFile(filePath: string, content: string): Promise<void> {
      await appendPrivateLogFile(filePath, content, parameters.openLogFile);
    },
    async ensureDirectory(directoryPath: string): Promise<void> {
      await ensurePrivateLogDirectory(parameters.logDirectory, directoryPath);
    },
    getCurrentTimeMilliseconds(): number {
      return parameters.currentTimeMilliseconds;
    },
    async getFileSize(filePath: string): Promise<number> {
      let fileStatistics: fs.Stats;

      try {
        fileStatistics = await fs.lstat(filePath);
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return 0;
        }

        throw error;
      }

      if (fileStatistics.isSymbolicLink()) {
        throw new Error(`Log file cannot be a symbolic link: ${filePath}`);
      }

      if (fileStatistics.isFile() === false) {
        return 0;
      }

      if (fileStatistics.nlink > 1) {
        throw new Error(`Log file has multiple hard links: ${filePath}`);
      }

      if (process.platform !== 'win32' && fileStatistics.uid !== process.getuid?.()) {
        throw new Error(`Log file is not owned by the current user: ${filePath}`);
      }

      await protectPrivateFile(filePath);
      const currentFileStatistics = await fs.lstat(filePath);

      if (currentFileStatistics.isSymbolicLink() || !currentFileStatistics.isFile()) {
        throw new Error(`Log file has an unexpected filesystem type: ${filePath}`);
      }

      if (currentFileStatistics.nlink > 1) {
        throw new Error(`Log file has multiple hard links: ${filePath}`);
      }

      if (process.platform !== 'win32' && currentFileStatistics.uid !== process.getuid?.()) {
        throw new Error(`Log file is not owned by the current user: ${filePath}`);
      }

      if (fileStatistics.dev !== currentFileStatistics.dev || fileStatistics.ino !== currentFileStatistics.ino) {
        throw createLogFileIdentityChangedError(filePath);
      }

      return currentFileStatistics.size;
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
    'retries once when another writer rotates the active file before append',
    withTemporaryDirectory('wire-bounded-log-concurrent-rotation-', async (temporaryLogDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(temporaryLogDirectory, 'logs');
      const logFilePath = path.join(logDirectory, 'electron.log');
      const rotatedLogPath = `${logFilePath}.external.old`;
      await ensurePrivateLogDirectory(logDirectory, logDirectory);
      await appendPrivateLogFile(logFilePath, 'previous process entry\n');
      let appendOpenCount = 0;
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createPrivateFileSystemDependencies({
          currentTimeMilliseconds: 12,
          logDirectory,
          async openLogFile(filePath, flags, mode) {
            appendOpenCount += 1;

            if (appendOpenCount === 1) {
              await fs.move(filePath, rotatedLogPath, {overwrite: false});
              await fs.writeFile(filePath, 'replacement process entry\n', {mode: 0o600});
              await fs.chmod(filePath, 0o600);
            }

            return fs.promises.open(filePath, flags, mode);
          },
        }),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });

      await boundedLogWriter.write({logFilePath, message: 'record from this process'});

      const actualCurrentLogContent = await fs.readFile(logFilePath, 'utf8');
      const actualRotatedLogContent = await fs.readFile(rotatedLogPath, 'utf8');

      assert.strictEqual(actualCurrentLogContent, 'replacement process entry\nrecord from this process\n');
      assert.strictEqual(actualRotatedLogContent, 'previous process entry\n');
      assert.strictEqual(appendOpenCount, 2);
    }),
  );

  it(
    'retries when a competing first append rotates the file before fallback lookup or open',
    withTemporaryDirectory('wire-bounded-log-first-append-rotation-', async temporaryLogDirectory => {
      for (const rotationPoint of ['beforeFallbackLookup', 'beforeFallbackOpen'] as const) {
        const logDirectory = path.join(temporaryLogDirectory, rotationPoint);
        const logFilePath = path.join(logDirectory, 'electron.log');
        const rotatedLogPath = `${logFilePath}.external.old`;
        let appendOpenCount = 0;
        const boundedLogWriter = createBoundedLogWriter({
          afterWrite: ignorePostWriteCleanup,
          dependencies: createPrivateFileSystemDependencies({
            currentTimeMilliseconds: 14,
            logDirectory,
            async openLogFile(filePath, flags, mode) {
              appendOpenCount += 1;

              if (appendOpenCount === 1) {
                assert.notStrictEqual(flags & fs.constants.O_CREAT, 0);
                assert.notStrictEqual(flags & fs.constants.O_EXCL, 0);
                await fs.writeFile(filePath, 'competing process entry\n', {mode: 0o600});

                try {
                  return await fs.promises.open(filePath, flags, mode);
                } catch (error) {
                  assert.ok(error instanceof Error && 'code' in error && error.code === 'EEXIST');

                  if (rotationPoint === 'beforeFallbackLookup') {
                    await fs.rename(filePath, rotatedLogPath);
                  }

                  throw error;
                }
              }

              if (rotationPoint === 'beforeFallbackOpen' && appendOpenCount === 2) {
                assert.strictEqual(flags & fs.constants.O_CREAT, 0);
                assert.strictEqual(flags & fs.constants.O_EXCL, 0);
                await fs.rename(filePath, rotatedLogPath);
              }

              return fs.promises.open(filePath, flags, mode);
            },
          }),
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          maximumFileSizeBytes: 1024,
        });

        await boundedLogWriter.write({logFilePath, message: 'record from this process'});

        assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), 'record from this process\n');
        assert.strictEqual(await fs.readFile(rotatedLogPath, 'utf8'), 'competing process entry\n');
        assert.strictEqual(appendOpenCount, rotationPoint === 'beforeFallbackLookup' ? 2 : 3);
      }
    }),
  );

  it(
    'does not retry when a hard link replaces the active file before append',
    withTemporaryDirectory('wire-bounded-log-unsafe-replacement-', async (temporaryLogDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(temporaryLogDirectory, 'logs');
      const logFilePath = path.join(logDirectory, 'electron.log');
      const rotatedLogPath = `${logFilePath}.external.old`;
      const outsideFilePath = path.join(temporaryLogDirectory, 'outside.log');
      await ensurePrivateLogDirectory(logDirectory, logDirectory);
      await appendPrivateLogFile(logFilePath, 'previous process entry\n');
      await fs.writeFile(outsideFilePath, 'outside contents\n', {mode: 0o600});
      let appendOpenCount = 0;
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createPrivateFileSystemDependencies({
          currentTimeMilliseconds: 13,
          logDirectory,
          async openLogFile(filePath, flags, mode) {
            appendOpenCount += 1;

            if (appendOpenCount === 1) {
              await fs.move(filePath, rotatedLogPath, {overwrite: false});
              await fs.link(outsideFilePath, filePath);
            }

            return fs.promises.open(filePath, flags, mode);
          },
        }),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });

      await assert.rejects(
        boundedLogWriter.write({logFilePath, message: 'must not be appended'}),
        /multiple hard links/,
      );

      assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), 'outside contents\n');
      assert.strictEqual(await fs.readFile(outsideFilePath, 'utf8'), 'outside contents\n');
      assert.strictEqual(await fs.readFile(rotatedLogPath, 'utf8'), 'previous process entry\n');
      assert.strictEqual(appendOpenCount, 1);
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
    'rotates structured batches intact and preserves LF and existing rotations',
    withTemporaryDirectory('wire-bounded-jsonl-rotation-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'application.jsonl');
      const existingRotation = `${logFilePath}.3-0.old`;
      const firstRecord = '{"level":30,"time":42,"component":"Account","msg":"first\\nsecond"}';
      const secondRecord = '{"level":40,"time":43,"component":"Account"}';
      const batch = [firstRecord, secondRecord];
      const expectedJsonl = `${firstRecord}\n${secondRecord}\n`;
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(3),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: Buffer.byteLength(expectedJsonl),
      });

      await fs.outputFile(existingRotation, `${secondRecord}\n`);
      await boundedLogWriter.writeJsonl({logFilePath, message: batch.join('\n')});
      assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), expectedJsonl);
      await boundedLogWriter.writeJsonl({logFilePath, message: firstRecord});

      assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), `${firstRecord}\n`);
      assert.strictEqual(await fs.readFile(`${logFilePath}.3-1.old`, 'utf8'), expectedJsonl);
      assert.strictEqual(await fs.readFile(existingRotation, 'utf8'), `${secondRecord}\n`);
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
    'removes an oversized entry during post-write cleanup',
    withTemporaryDirectory('wire-bounded-log-large-entry-retention-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const maintenanceCoordinator = createTestMaintenanceCoordinator();
      const retentionPolicy: LogRetentionPolicy = {
        maximumAgeMilliseconds: 7 * 24 * 60 * 60 * 1_000,
        maximumTotalSizeBytes: 10,
      };
      const cleanupFailureMessages: string[] = [];
      const cleanup = createLogCleanup(
        createLogCleanupFileSystemDependencies((message: string): void => {
          cleanupFailureMessages.push(message);
        }),
      );
      let isWriteCriticalSectionActive = false;
      let writtenLogSizeBytes = 0;
      let cleanupCount = 0;
      let cleanupStartedAfterWriteCriticalSection = false;
      const baseDependencies = createTestFileSystemDependencies(9);
      const dependencies: BoundedLogWriterDependencies = {
        ...baseDependencies,
        async appendFile(filePath: string, content: string): Promise<void> {
          isWriteCriticalSectionActive = true;

          try {
            await fs.appendFile(filePath, content);
            writtenLogSizeBytes = Buffer.byteLength(content);
          } finally {
            isWriteCriticalSectionActive = false;
          }
        },
      };
      const boundedLogWriter = createBoundedLogWriter({
        async afterWrite(): Promise<void> {
          cleanupCount += 1;
          await maintenanceCoordinator.runMaintenance(async (): Promise<void> => {
            cleanupStartedAfterWriteCriticalSection = isWriteCriticalSectionActive === false;
            await cleanup.run({
              activeFilePaths: new Set<string>(),
              logDirectory: temporaryLogDirectory,
              policy: retentionPolicy,
            });
          });
        },
        dependencies,
        maintenanceCoordinator,
        maximumFileSizeBytes: 5,
      });

      await boundedLogWriter.write({logFilePath, message: '1234567890'});

      assert.strictEqual(writtenLogSizeBytes, 11);
      assert.strictEqual(cleanupCount, 1);
      assert.strictEqual(cleanupStartedAfterWriteCriticalSection, true);
      assert.strictEqual(cleanupFailureMessages.length, 0);
      assert.strictEqual(await fs.pathExists(logFilePath), false);
    }),
  );

  it(
    'keeps queued console writes from recreating a deleted account directory',
    withTemporaryDirectory('wire-account-console-deletion-', async temporaryLogDirectory => {
      const boundedLogWriter = createBoundedLogWriter({
        afterWrite: ignorePostWriteCleanup,
        dependencies: createTestFileSystemDependencies(1),
        maintenanceCoordinator: createTestMaintenanceCoordinator(),
        maximumFileSizeBytes: 1024,
      });
      const accountDirectory = path.join(temporaryLogDirectory, 'deleted-account');
      const accountLogPath = path.join(accountDirectory, 'console.log');
      const otherAccountLogPath = path.join(temporaryLogDirectory, 'other-account', 'console.log');
      let formerWebViewAccountId: Maybe<string> = Maybe.just('deleted-account');

      function createConsoleCapture(getAccountId: () => Maybe<string>): ReturnType<typeof createWebViewConsoleLogger> {
        return createWebViewConsoleLogger({
          getAccountId,
          getLogFilePath(accountId) {
            return path.join(temporaryLogDirectory, accountId, 'console.log');
          },
          reportWriteFailure: assert.fail,
          writeLogMessage: boundedLogWriter.writeConsoleMessage,
        });
      }

      const formerWebView = createConsoleCapture(() => {
        return formerWebViewAccountId;
      });
      const otherWebView = createConsoleCapture(() => {
        return Maybe.just('other-account');
      });
      await formerWebView({message: 'before deletion'});
      assert.strictEqual(await fs.pathExists(accountLogPath), true);

      const maintenanceStarted = Promise.withResolvers<void>();
      const releaseMaintenance = Promise.withResolvers<void>();
      const earlierMaintenance = boundedLogWriter.runMaintenance(() => {
        maintenanceStarted.resolve();
        return releaseMaintenance.promise;
      });
      await maintenanceStarted.promise;

      const queuedWrite = formerWebView({message: 'queued before deletion'});
      formerWebViewAccountId = Maybe.nothing();
      const deletion = boundedLogWriter.runMaintenance(() => {
        return fs.remove(accountDirectory);
      });
      const writeDuringDeletion = formerWebView({message: 'during deletion'});
      const otherAccountWrite = otherWebView({message: 'other account stays active'});
      releaseMaintenance.resolve();
      await Promise.all([earlierMaintenance, deletion, queuedWrite, writeDuringDeletion, otherAccountWrite]);
      await formerWebView({message: 'after deletion'});

      assert.strictEqual(await fs.pathExists(accountDirectory), false);
      assert.strictEqual((await fs.readFile(otherAccountLogPath, 'utf8')).trimEnd(), 'other account stays active');

      const replacementWebView = createConsoleCapture(() => {
        return Maybe.just('deleted-account');
      });
      await replacementWebView({message: 'newly authorized WebView'});
      assert.strictEqual((await fs.readFile(accountLogPath, 'utf8')).trimEnd(), 'newly authorized WebView');
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
