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

import AdmZip from 'adm-zip';
import * as fs from 'fs-extra';
import noop from 'lodash/noop';
import {Maybe} from 'true-myth';

import * as assert from 'assert';
import * as path from 'path';
import {Writable} from 'stream';

import {
  createLogSnapshot,
  CreateLogSnapshotOptions,
  exportLogFiles,
  LogSnapshot,
  LogSnapshotFileSystemDependencies,
  streamLogFilesToZip,
} from './logExport';
import {createLogArchiveDependencies, createLogSnapshotFileSystemDependencies} from './logExportDependencies';
import {getLogFilenames} from './logFiles';
import {createLogMaintenanceCoordinator} from './logMaintenance';
import {protectLogDirectoryAtStartup} from './logPermissions';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

type CreateSnapshotTestOptions = {
  cleanup: () => Promise<void>;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  maintenanceCoordinator: ReturnType<typeof createLogMaintenanceCoordinator>;
  reportFailure: (message: string, error: unknown) => void;
  temporaryDirectoryPrefix: string;
} & LogSnapshotFileSystemDependencies;

function runNoopCleanup(): Promise<void> {
  return Promise.resolve();
}

function createDeferredCompletion(): {promise: Promise<void>; resolve: () => void} {
  let resolvePromise: () => void = noop;
  const promise = new Promise<void>(resolve => {
    resolvePromise = resolve;
  });

  return {promise, resolve: resolvePromise};
}

function createTestMaintenanceCoordinator(): ReturnType<typeof createLogMaintenanceCoordinator> {
  const invoker = createFireAndForgetInvoker({
    reportFailure() {
      // The coordinator's public promises report expected operation failures.
    },
  });

  return createLogMaintenanceCoordinator({fireAndForget: invoker.fireAndForget});
}

function createSnapshotTestOptions(options: CreateSnapshotTestOptions): CreateLogSnapshotOptions {
  const {copyFile, createTemporaryDirectory, ensureDirectory, getFileMetadata, removeDirectory} = options;

  return {
    copyFile,
    cleanup: options.cleanup,
    createTemporaryDirectory,
    discoverLogFilePaths: options.discoverLogFilePaths,
    ensureDirectory,
    getFileMetadata,
    logDirectory: options.logDirectory,
    reportFailure: options.reportFailure,
    removeDirectory,
    runMaintenance: options.maintenanceCoordinator.runMaintenance,
    temporaryDirectoryPrefix: options.temporaryDirectoryPrefix,
  };
}

function getArchiveEntryContents(archive: AdmZip, relativePath: string): string {
  const archiveEntry = Maybe.of(archive.getEntry(relativePath));

  if (archiveEntry.isJust === false) {
    throw new Error(`Archive entry was not found: ${relativePath}`);
  }

  return archiveEntry.value.getData().toString();
}

describe('desktop log export', () => {
  it(
    'waits for pending writes before cleanup and snapshotting files',
    withTemporaryDirectory('wire-log-export-maintenance-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const writeCompletion = createDeferredCompletion();
      const maintenanceCoordinator = createTestMaintenanceCoordinator();
      const writePromise = maintenanceCoordinator.runWrite(async (): Promise<void> => {
        await writeCompletion.promise;
        await fs.outputFile(logFilePath, 'complete entry\n');
      });
      const events: string[] = [];
      const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
      const snapshotPromise = createLogSnapshot(
        createSnapshotTestOptions({
          async cleanup() {
            events.push('cleanup');
          },
          copyFile: snapshotFileSystemDependencies.copyFile,
          createTemporaryDirectory: snapshotFileSystemDependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            events.push('discover');

            return ['electron.log'];
          },
          ensureDirectory: snapshotFileSystemDependencies.ensureDirectory,
          getFileMetadata: snapshotFileSystemDependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator,
          reportFailure: noop,
          removeDirectory: snapshotFileSystemDependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );

      await Promise.resolve();
      assert.deepStrictEqual(events, []);

      writeCompletion.resolve();
      await writePromise;
      const snapshot = await snapshotPromise;

      try {
        assert.deepStrictEqual(events, ['cleanup', 'discover']);
        assert.deepStrictEqual(
          snapshot.files.map(file => {
            return file.relativePath;
          }),
          ['electron.log'],
        );
        const actualSnapshotContents = await fs.readFile(snapshot.files[0].absolutePath, 'utf8');

        assert.strictEqual(actualSnapshotContents, 'complete entry\n');

        if (process.platform !== 'win32') {
          assert.strictEqual((await fs.stat(snapshot.directoryPath)).mode & 0o777, 0o700);
          assert.strictEqual((await fs.stat(snapshot.files[0].absolutePath)).mode & 0o777, 0o600);
        }
      } finally {
        await fs.remove(snapshot.directoryPath);
      }
    }),
  );

  it(
    'copies retained files asynchronously without reading their complete contents into memory',
    withTemporaryDirectory('wire-log-export-copy-', async (temporaryLogDirectory: string) => {
      const sourceFilePath = path.join(temporaryLogDirectory, 'electron.log');
      await fs.outputFile(sourceFilePath, 'log entry\n');
      const copiedFiles: Array<{sourceFilePath: string; destinationFilePath: string}> = [];
      const defaultDependencies = createLogSnapshotFileSystemDependencies();
      const dependencies: LogSnapshotFileSystemDependencies = {
        async copyFile(sourceFilePath: string, destinationFilePath: string) {
          copiedFiles.push({sourceFilePath, destinationFilePath});
          await defaultDependencies.copyFile(sourceFilePath, destinationFilePath);
        },
        createTemporaryDirectory: defaultDependencies.createTemporaryDirectory,
        ensureDirectory: defaultDependencies.ensureDirectory,
        getFileMetadata: defaultDependencies.getFileMetadata,
        removeDirectory: defaultDependencies.removeDirectory,
      };
      const snapshot = await createLogSnapshot(
        createSnapshotTestOptions({
          cleanup: runNoopCleanup,
          copyFile: dependencies.copyFile,
          createTemporaryDirectory: dependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            return ['electron.log'];
          },
          ensureDirectory: dependencies.ensureDirectory,
          getFileMetadata: dependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
          removeDirectory: dependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );

      try {
        assert.deepStrictEqual(copiedFiles, [
          {
            sourceFilePath,
            destinationFilePath: path.join(snapshot.directoryPath, 'electron.log'),
          },
        ]);
        assert.deepStrictEqual(Object.keys(snapshot), ['directoryPath', 'files']);
      } finally {
        await fs.remove(snapshot.directoryPath);
      }
    }),
  );

  it(
    'skips a log that disappears after discovery and keeps stable files in the snapshot',
    withTemporaryDirectory('wire-log-export-disappearing-source-', async (temporaryLogDirectory: string) => {
      const disappearingLogPath = path.join(temporaryLogDirectory, 'rotating.log');
      const stableLogPath = path.join(temporaryLogDirectory, 'electron.log');
      await fs.outputFile(disappearingLogPath, 'rotated away\n');
      await fs.outputFile(stableLogPath, 'stable native log\n');
      const snapshotDependencies = createLogSnapshotFileSystemDependencies();
      const reportedFailures: string[] = [];
      const snapshot = await createLogSnapshot(
        createSnapshotTestOptions({
          cleanup: runNoopCleanup,
          copyFile: snapshotDependencies.copyFile,
          createTemporaryDirectory: snapshotDependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            const discoveredPaths = getLogFilenames({absolute: false, baseDirectory: temporaryLogDirectory});
            fs.removeSync(disappearingLogPath);

            return discoveredPaths;
          },
          ensureDirectory: snapshotDependencies.ensureDirectory,
          getFileMetadata: snapshotDependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure(message) {
            reportedFailures.push(message);
          },
          removeDirectory: snapshotDependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );

      try {
        const actualRelativePaths = snapshot.files.map(file => file.relativePath);

        assert.deepStrictEqual(actualRelativePaths, ['electron.log']);
        assert.strictEqual(await fs.readFile(snapshot.files[0].absolutePath, 'utf8'), 'stable native log\n');
        assert.strictEqual(reportedFailures.length, 1);
      } finally {
        await fs.remove(snapshot.directoryPath);
      }
    }),
  );

  it(
    'skips source-open ENOENT and safe inode changes when a log path is recreated',
    withTemporaryDirectory('wire-log-export-recreated-source-', async (temporaryLogDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const missingDuringOpenPath = path.join(temporaryLogDirectory, 'missing-during-open.log');
      const replacedDuringOpenPath = path.join(temporaryLogDirectory, 'replaced-during-open.log');
      const stableLogPath = path.join(temporaryLogDirectory, 'electron.log');
      await fs.outputFile(missingDuringOpenPath, 'original contents\n');
      await fs.outputFile(replacedDuringOpenPath, 'original contents\n');
      await fs.outputFile(stableLogPath, 'stable native log\n');

      const originalFileHandles = await Promise.all([
        fs.promises.open(missingDuringOpenPath, 'r'),
        fs.promises.open(replacedDuringOpenPath, 'r'),
      ]);
      let missingDuringOpenHandled = false;
      let replacedDuringOpenHandled = false;
      const snapshotDependencies = createLogSnapshotFileSystemDependencies({
        async openSourceFile(sourceFilePath, flags) {
          if (sourceFilePath === missingDuringOpenPath && missingDuringOpenHandled === false) {
            missingDuringOpenHandled = true;
            fs.removeSync(sourceFilePath);
            fs.writeFileSync(sourceFilePath, 'replacement contents\n');
            const openFailure = Object.assign(new Error('source disappeared before open'), {
              code: 'ENOENT',
              path: sourceFilePath,
            });

            throw openFailure;
          }

          if (sourceFilePath === replacedDuringOpenPath && replacedDuringOpenHandled === false) {
            replacedDuringOpenHandled = true;
            fs.removeSync(sourceFilePath);
            fs.writeFileSync(sourceFilePath, 'replacement contents\n');
          }

          return fs.promises.open(sourceFilePath, flags);
        },
      });
      const reportedFailures: string[] = [];
      let snapshotDirectoryPath: string | undefined;

      try {
        const snapshot = await createLogSnapshot(
          createSnapshotTestOptions({
            cleanup: runNoopCleanup,
            copyFile: snapshotDependencies.copyFile,
            createTemporaryDirectory: snapshotDependencies.createTemporaryDirectory,
            discoverLogFilePaths() {
              return ['missing-during-open.log', 'replaced-during-open.log', 'electron.log'];
            },
            ensureDirectory: snapshotDependencies.ensureDirectory,
            getFileMetadata: snapshotDependencies.getFileMetadata,
            logDirectory: temporaryLogDirectory,
            maintenanceCoordinator: createTestMaintenanceCoordinator(),
            reportFailure(message) {
              reportedFailures.push(message);
            },
            removeDirectory: snapshotDependencies.removeDirectory,
            temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
          }),
        );
        snapshotDirectoryPath = snapshot.directoryPath;

        assert.deepStrictEqual(
          snapshot.files.map(file => file.relativePath),
          ['electron.log'],
        );
        assert.strictEqual(await fs.readFile(snapshot.files[0].absolutePath, 'utf8'), 'stable native log\n');
        assert.strictEqual(reportedFailures.length, 2);
      } finally {
        await Promise.all(originalFileHandles.map(fileHandle => fileHandle.close()));

        if (snapshotDirectoryPath !== undefined) {
          await fs.remove(snapshotDirectoryPath);
        }
      }
    }),
  );

  it(
    'rejects a symbolic link that replaces a missing source during copy',
    withTemporaryDirectory('wire-log-export-replaced-source-link-', async (temporaryLogDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const sourceLogPath = path.join(temporaryLogDirectory, 'electron.log');
      const outsideLogPath = path.join(temporaryLogDirectory, 'outside.log');
      await fs.outputFile(sourceLogPath, 'original contents\n');
      await fs.outputFile(outsideLogPath, 'outside contents\n');
      const snapshotDependencies = createLogSnapshotFileSystemDependencies({
        async openSourceFile(filePath, flags) {
          fs.removeSync(filePath);
          fs.symlinkSync(outsideLogPath, filePath, 'file');
          const openFailure = Object.assign(new Error('source disappeared before open'), {
            code: 'ENOENT',
            path: filePath,
          });

          throw openFailure;
        },
      });

      await assert.rejects(
        createLogSnapshot(
          createSnapshotTestOptions({
            cleanup: runNoopCleanup,
            copyFile: snapshotDependencies.copyFile,
            createTemporaryDirectory: snapshotDependencies.createTemporaryDirectory,
            discoverLogFilePaths() {
              return ['electron.log'];
            },
            ensureDirectory: snapshotDependencies.ensureDirectory,
            getFileMetadata: snapshotDependencies.getFileMetadata,
            logDirectory: temporaryLogDirectory,
            maintenanceCoordinator: createTestMaintenanceCoordinator(),
            reportFailure: noop,
            removeDirectory: snapshotDependencies.removeDirectory,
            temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
          }),
        ),
        /no longer a regular file/,
      );

      assert.strictEqual((await fs.lstat(sourceLogPath)).isSymbolicLink(), true);
      assert.strictEqual(await fs.readFile(outsideLogPath, 'utf8'), 'outside contents\n');
      assert.strictEqual(
        (await fs.readdir(temporaryLogDirectory)).some(entryName => entryName.startsWith('snapshot-')),
        false,
      );
    }),
  );

  it(
    'preserves nested relative paths and skips symbolic links',
    withTemporaryDirectory('wire-log-export-paths-', async (temporaryLogDirectory: string) => {
      const currentLogRelativePath = '2026-08-27/accounts/account-id/console.log';
      const rotatedLogRelativePath = '2026-08-27/accounts/account-id/console.log.123-0.old';
      const legacyLogRelativePath = 'legacy.old';
      await fs.outputFile(path.join(temporaryLogDirectory, currentLogRelativePath), 'current\n');
      await fs.outputFile(path.join(temporaryLogDirectory, rotatedLogRelativePath), 'rotated\n');
      await fs.outputFile(path.join(temporaryLogDirectory, legacyLogRelativePath), 'legacy\n');
      const symbolicLinkTargetPath = path.join(temporaryLogDirectory, 'outside.log');
      const symbolicLinkPath = path.join(temporaryLogDirectory, 'linked.log');
      await fs.outputFile(symbolicLinkTargetPath, 'must not be copied\n');
      await fs.symlink(symbolicLinkTargetPath, symbolicLinkPath, 'file');
      const symbolicLinkDirectoryTargetPath = path.join(temporaryLogDirectory, 'outside-account');
      const symbolicLinkDirectoryPath = path.join(temporaryLogDirectory, 'linked-account');
      await fs.outputFile(path.join(symbolicLinkDirectoryTargetPath, 'console.log'), 'must not be copied\n');
      await fs.symlink(symbolicLinkDirectoryTargetPath, symbolicLinkDirectoryPath, 'dir');

      const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
      const snapshot = await createLogSnapshot(
        createSnapshotTestOptions({
          cleanup: runNoopCleanup,
          copyFile: snapshotFileSystemDependencies.copyFile,
          createTemporaryDirectory: snapshotFileSystemDependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            return [
              currentLogRelativePath,
              rotatedLogRelativePath,
              legacyLogRelativePath,
              'linked.log',
              'linked-account/console.log',
            ];
          },
          ensureDirectory: snapshotFileSystemDependencies.ensureDirectory,
          getFileMetadata: snapshotFileSystemDependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
          removeDirectory: snapshotFileSystemDependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );

      try {
        const actualRelativePaths = snapshot.files
          .map(file => {
            return file.relativePath;
          })
          .toSorted();
        const expectedRelativePaths = [
          currentLogRelativePath,
          legacyLogRelativePath,
          rotatedLogRelativePath,
        ].toSorted();

        assert.deepStrictEqual(actualRelativePaths, expectedRelativePaths);
        assert.strictEqual(await fs.pathExists(path.join(snapshot.directoryPath, 'linked.log')), false);
        assert.strictEqual(await fs.pathExists(path.join(snapshot.directoryPath, 'linked-account')), false);
      } finally {
        await fs.remove(snapshot.directoryPath);
      }
    }),
  );

  it(
    'rejects paths that escape the log and snapshot directories and removes the partial snapshot',
    withTemporaryDirectory('wire-log-export-safety-', async (temporaryLogDirectory: string) => {
      const outsideFileName = `${path.basename(temporaryLogDirectory)}-outside.log`;
      const outsideFilePath = path.join(path.dirname(temporaryLogDirectory), outsideFileName);
      const relativeEscapePath = path.join('..', outsideFileName);
      await fs.outputFile(outsideFilePath, 'must remain unchanged\n');
      const removedSnapshotDirectories: string[] = [];
      const defaultDependencies = createLogSnapshotFileSystemDependencies();
      const dependencies: LogSnapshotFileSystemDependencies = {
        async removeDirectory(directoryPath: string) {
          removedSnapshotDirectories.push(directoryPath);
          await defaultDependencies.removeDirectory(directoryPath);
        },
        copyFile: defaultDependencies.copyFile,
        createTemporaryDirectory: defaultDependencies.createTemporaryDirectory,
        ensureDirectory: defaultDependencies.ensureDirectory,
        getFileMetadata: defaultDependencies.getFileMetadata,
      };

      try {
        await assert.rejects(
          createLogSnapshot(
            createSnapshotTestOptions({
              cleanup: runNoopCleanup,
              copyFile: dependencies.copyFile,
              createTemporaryDirectory: dependencies.createTemporaryDirectory,
              discoverLogFilePaths() {
                return [relativeEscapePath];
              },
              ensureDirectory: dependencies.ensureDirectory,
              getFileMetadata: dependencies.getFileMetadata,
              logDirectory: temporaryLogDirectory,
              maintenanceCoordinator: createTestMaintenanceCoordinator(),
              reportFailure: noop,
              removeDirectory: dependencies.removeDirectory,
              temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
            }),
          ),
        );

        assert.strictEqual(await fs.readFile(outsideFilePath, 'utf8'), 'must remain unchanged\n');
        assert.strictEqual(removedSnapshotDirectories.length, 1);
        assert.strictEqual(await fs.pathExists(removedSnapshotDirectories[0]), false);
      } finally {
        await fs.remove(outsideFilePath);
      }
    }),
  );

  it(
    'allows normal writes to resume while ZIP streaming is still running',
    withTemporaryDirectory('wire-log-export-resume-', async (temporaryLogDirectory: string) => {
      await fs.outputFile(path.join(temporaryLogDirectory, 'electron.log'), 'before archive\n');
      const maintenanceCoordinator = createTestMaintenanceCoordinator();
      const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
      const snapshotPromise = createLogSnapshot(
        createSnapshotTestOptions({
          cleanup: runNoopCleanup,
          copyFile: snapshotFileSystemDependencies.copyFile,
          createTemporaryDirectory: snapshotFileSystemDependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            return ['electron.log'];
          },
          ensureDirectory: snapshotFileSystemDependencies.ensureDirectory,
          getFileMetadata: snapshotFileSystemDependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator,
          reportFailure: noop,
          removeDirectory: snapshotFileSystemDependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );
      const zipStarted = createDeferredCompletion();
      const zipCompletion = createDeferredCompletion();
      let exportCompleted = false;
      const exportPromise = exportLogFiles({
        async createSnapshot() {
          return snapshotPromise;
        },
        destinationPath: path.join(temporaryLogDirectory, 'logs.zip'),
        async removeSnapshotDirectory(directoryPath: string) {
          await fs.remove(directoryPath);
        },
        reportFailure: noop,
        async streamSnapshot() {
          zipStarted.resolve();
          await zipCompletion.promise;
        },
      }).then(() => {
        exportCompleted = true;
      });

      await zipStarted.promise;
      const writePromise = maintenanceCoordinator.runWrite(async (): Promise<void> => {
        await fs.outputFile(path.join(temporaryLogDirectory, 'electron.log'), 'during archive\n');
      });

      await writePromise;
      assert.strictEqual(exportCompleted, false);

      zipCompletion.resolve();
      await exportPromise;
      assert.strictEqual(exportCompleted, true);
    }),
  );

  it(
    'streams current, rotated, and legacy logs, including JSONL, into a valid archive',
    withTemporaryDirectory('wire-log-export-archive-', async (temporaryLogDirectory: string) => {
      const currentLogRelativePath = '2026-08-27/electron.log';
      const nestedLogRelativePath = '2026-08-27/accounts/account-id/console.log';
      const rotatedLogRelativePath = '2026-08-27/accounts/account-id/console.log.123-0.old';
      const ssoLogRelativePath = '2026-08-27/accounts/account-id/sso.log';
      const legacyLogRelativePath = 'legacy.old';
      const applicationLogRelativePath = '2026-08-27/accounts/account-id/application.jsonl';
      const rotatedApplicationLogRelativePath = `${applicationLogRelativePath}.123-1.old`;
      const applicationLogContent = '{"level":30,"time":42,"component":"Account","msg":"Connected"}\n';
      const sourceContents = new Map<string, string>([
        [currentLogRelativePath, 'current\n'],
        [nestedLogRelativePath, 'nested\n'],
        [rotatedLogRelativePath, 'rotated\n'],
        [legacyLogRelativePath, 'legacy\n'],
        [applicationLogRelativePath, applicationLogContent],
        [rotatedApplicationLogRelativePath, applicationLogContent],
        [ssoLogRelativePath, 'sso diagnostic\n'],
      ]);
      await fs.outputFile(path.join(temporaryLogDirectory, currentLogRelativePath), 'current\n');
      await fs.outputFile(path.join(temporaryLogDirectory, nestedLogRelativePath), 'nested\n');
      await fs.outputFile(path.join(temporaryLogDirectory, rotatedLogRelativePath), 'rotated\n');
      await fs.outputFile(path.join(temporaryLogDirectory, legacyLogRelativePath), 'legacy\n');
      await fs.outputFile(path.join(temporaryLogDirectory, applicationLogRelativePath), applicationLogContent);
      await fs.outputFile(path.join(temporaryLogDirectory, rotatedApplicationLogRelativePath), applicationLogContent);
      await fs.outputFile(path.join(temporaryLogDirectory, ssoLogRelativePath), 'sso diagnostic\n');
      protectLogDirectoryAtStartup(temporaryLogDirectory);
      const archivePath = path.join(temporaryLogDirectory, 'logs.zip');
      await fs.outputFile(archivePath, 'existing archive contents');
      await fs.chmod(archivePath, 0o644);
      const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
      const productionArchiveDependencies = createLogArchiveDependencies(noop);
      const archiveDependencies = {
        ...productionArchiveDependencies,
        async createTemporaryArchiveDirectory(destinationPath: string) {
          const directoryPath = await productionArchiveDependencies.createTemporaryArchiveDirectory(destinationPath);

          if (process.platform !== 'win32') {
            assert.strictEqual((await fs.stat(directoryPath)).mode & 0o777, 0o700);
          }

          return directoryPath;
        },
        createOutputStream(destinationPath: string) {
          const outputStream = productionArchiveDependencies.createOutputStream(destinationPath);

          if (process.platform !== 'win32') {
            assert.strictEqual(fs.statSync(destinationPath).mode & 0o777, 0o600);
          }

          return outputStream;
        },
      };
      const exportFireAndForgetInvoker = createFireAndForgetInvoker({reportFailure: noop});
      let createdSnapshot: Maybe<LogSnapshot> = Maybe.nothing<LogSnapshot>();

      const exportPromise = exportLogFiles({
        async createSnapshot() {
          const snapshot = await createLogSnapshot(
            createSnapshotTestOptions({
              cleanup: runNoopCleanup,
              copyFile: snapshotFileSystemDependencies.copyFile,
              createTemporaryDirectory: snapshotFileSystemDependencies.createTemporaryDirectory,
              discoverLogFilePaths() {
                return getLogFilenames({absolute: false, baseDirectory: temporaryLogDirectory});
              },
              ensureDirectory: snapshotFileSystemDependencies.ensureDirectory,
              getFileMetadata: snapshotFileSystemDependencies.getFileMetadata,
              logDirectory: temporaryLogDirectory,
              maintenanceCoordinator: createTestMaintenanceCoordinator(),
              reportFailure: noop,
              removeDirectory: snapshotFileSystemDependencies.removeDirectory,
              temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
            }),
          );
          createdSnapshot = Maybe.just(snapshot);

          return snapshot;
        },
        destinationPath: archivePath,
        removeSnapshotDirectory: snapshotFileSystemDependencies.removeDirectory,
        reportFailure: noop,
        async streamSnapshot({destinationPath, snapshotFiles}) {
          await streamLogFilesToZip({
            ...archiveDependencies,
            destinationPath,
            snapshotFiles,
          });
        },
      });
      exportFireAndForgetInvoker.fireAndForget(() => {
        return exportPromise;
      });
      await exportPromise;
      await exportFireAndForgetInvoker.waitUntilAllSettled();

      const createdSnapshotDirectoryPath = createdSnapshot.match({
        Just(snapshot) {
          return snapshot.directoryPath;
        },
        Nothing() {
          throw new Error('The export did not create a snapshot');
        },
      });

      assert.strictEqual(await fs.pathExists(createdSnapshotDirectoryPath), false);

      const archive = new AdmZip(archivePath);
      const actualEntryPaths = archive
        .getEntries()
        .map(archiveEntry => {
          return archiveEntry.entryName;
        })
        .toSorted();
      const expectedEntryPaths = [
        applicationLogRelativePath,
        currentLogRelativePath,
        legacyLogRelativePath,
        nestedLogRelativePath,
        rotatedApplicationLogRelativePath,
        rotatedLogRelativePath,
        ssoLogRelativePath,
      ].toSorted();

      assert.deepStrictEqual(actualEntryPaths, expectedEntryPaths);
      assert.strictEqual(getArchiveEntryContents(archive, currentLogRelativePath), 'current\n');
      assert.strictEqual(getArchiveEntryContents(archive, nestedLogRelativePath), 'nested\n');
      assert.strictEqual(getArchiveEntryContents(archive, rotatedLogRelativePath), 'rotated\n');
      assert.strictEqual(getArchiveEntryContents(archive, legacyLogRelativePath), 'legacy\n');
      assert.strictEqual(getArchiveEntryContents(archive, applicationLogRelativePath), applicationLogContent);
      assert.strictEqual(getArchiveEntryContents(archive, rotatedApplicationLogRelativePath), applicationLogContent);
      assert.strictEqual(getArchiveEntryContents(archive, ssoLogRelativePath), 'sso diagnostic\n');

      if (process.platform !== 'win32') {
        assert.strictEqual((await fs.stat(archivePath)).mode & 0o777, 0o600);

        for (const [relativePath, expectedContents] of sourceContents) {
          const sourcePath = path.join(temporaryLogDirectory, relativePath);
          const sourceMetadata = await fs.stat(sourcePath);

          assert.strictEqual(sourceMetadata.mode & 0o777, 0o600);
          assert.strictEqual(await fs.readFile(sourcePath, 'utf8'), expectedContents);
        }

        for (const directoryPath of ['2026-08-27', '2026-08-27/accounts', '2026-08-27/accounts/account-id']) {
          assert.strictEqual((await fs.stat(path.join(temporaryLogDirectory, directoryPath))).mode & 0o777, 0o700);
        }
      }

      const remainingEntries = await fs.readdir(temporaryLogDirectory);
      assert.strictEqual(
        remainingEntries.some(entryName => entryName.startsWith('.wire-log-export-')),
        false,
      );
    }),
  );

  it(
    'catches an archive error emitted immediately during finalization',
    withTemporaryDirectory('wire-log-export-archive-error-', async (temporaryLogDirectory: string) => {
      const archivePath = path.join(temporaryLogDirectory, 'logs.zip');
      const archiveFailure = new Error('archive failed during finalization');
      const archiveDependencies = createLogArchiveDependencies(noop);
      let outputStream: Maybe<Writable> = Maybe.nothing<Writable>();
      const failingArchiveDependencies = {
        createArchive() {
          const createdArchive = archiveDependencies.createArchive();
          createdArchive.on('error', noop);
          createdArchive.finalize = function finalize(): Promise<void> {
            createdArchive.emit('error', archiveFailure);
            outputStream.match({
              Just(createdOutputStream) {
                createdOutputStream.end();
              },
              Nothing() {
                throw new Error('The archive output stream was not created');
              },
            });

            return new Promise<void>(resolve => {
              setImmediate(resolve);
            });
          };

          return createdArchive;
        },
        createOutputStream(destinationPath: string) {
          const createdOutputStream = archiveDependencies.createOutputStream(destinationPath);
          outputStream = Maybe.just(createdOutputStream);

          return createdOutputStream;
        },
        createTemporaryArchiveDirectory: archiveDependencies.createTemporaryArchiveDirectory,
        commitArchive: archiveDependencies.commitArchive,
        removeDirectory: archiveDependencies.removeDirectory,
        reportFailure: archiveDependencies.reportFailure,
      };

      await assert.rejects(
        streamLogFilesToZip({
          ...failingArchiveDependencies,
          destinationPath: archivePath,
          snapshotFiles: [],
        }),
        archiveFailure,
      );
      assert.strictEqual(await fs.pathExists(archivePath), false);
    }),
  );

  it(
    'rejects a symbolic-link destination without writing through it',
    withTemporaryDirectory('wire-log-export-destination-link-', async (temporaryDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const existingFilePath = path.join(temporaryDirectory, 'existing.zip');
      const destinationPath = path.join(temporaryDirectory, 'selected.zip');
      await fs.writeFile(existingFilePath, 'existing destination contents\n');
      await fs.symlink(existingFilePath, destinationPath, 'file');
      const archiveDependencies = createLogArchiveDependencies(noop);

      await assert.rejects(
        streamLogFilesToZip({
          ...archiveDependencies,
          destinationPath,
          snapshotFiles: [],
        }),
        /regular file/,
      );

      assert.strictEqual((await fs.lstat(destinationPath)).isSymbolicLink(), true);
      assert.strictEqual(await fs.readFile(existingFilePath, 'utf8'), 'existing destination contents\n');
      assert.strictEqual(
        (await fs.readdir(temporaryDirectory)).some(name => name.startsWith('.wire-log-export-')),
        false,
      );
    }),
  );

  it(
    'rejects a read-only regular destination before preparing an archive replacement',
    withTemporaryDirectory('wire-log-export-read-only-destination-', async (temporaryDirectory: string) => {
      if (process.platform === 'win32' || process.getuid?.() === 0) {
        return;
      }

      const destinationPath = path.join(temporaryDirectory, 'selected.zip');
      const originalContents = 'preserve the selected file\n';
      await fs.writeFile(destinationPath, originalContents, {mode: 0o444});
      await fs.chmod(destinationPath, 0o444);
      const archiveDependencies = createLogArchiveDependencies(noop);

      await assert.rejects(
        streamLogFilesToZip({
          ...archiveDependencies,
          destinationPath,
          snapshotFiles: [],
        }),
        error => {
          return error instanceof Error && 'code' in error && (error.code === 'EACCES' || error.code === 'EPERM');
        },
      );

      assert.strictEqual(await fs.readFile(destinationPath, 'utf8'), originalContents);
      assert.strictEqual((await fs.stat(destinationPath)).mode & 0o777, 0o444);
      assert.strictEqual(
        (await fs.readdir(temporaryDirectory)).some(name => name.startsWith('.wire-log-export-')),
        false,
      );
    }),
  );

  it(
    'propagates output failure before archive finalization completes',
    withTemporaryDirectory('wire-log-export-output-error-', async (temporaryLogDirectory: string) => {
      const archivePath = path.join(temporaryLogDirectory, 'logs.zip');
      await fs.writeFile(archivePath, 'existing destination contents\n', {mode: 0o644});
      if (process.platform !== 'win32') {
        await fs.chmod(archivePath, 0o644);
      }
      const outputFailure = new Error('output failed before archive finalization');
      const archiveFinalization = createDeferredCompletion();
      const archiveDependencies = createLogArchiveDependencies(noop);
      let outputStream: Maybe<Writable> = Maybe.nothing<Writable>();
      const failingArchiveDependencies = {
        createArchive() {
          const createdArchive = archiveDependencies.createArchive();
          createdArchive.finalize = function finalize(): Promise<void> {
            outputStream.match({
              Just(createdOutputStream) {
                createdOutputStream.destroy(outputFailure);
              },
              Nothing() {
                throw new Error('The archive output stream was not created');
              },
            });
            setImmediate(archiveFinalization.resolve);

            return archiveFinalization.promise;
          };

          return createdArchive;
        },
        createOutputStream(destinationPath: string) {
          const createdOutputStream = archiveDependencies.createOutputStream(destinationPath);
          outputStream = Maybe.just(createdOutputStream);

          return createdOutputStream;
        },
        createTemporaryArchiveDirectory: archiveDependencies.createTemporaryArchiveDirectory,
        commitArchive: archiveDependencies.commitArchive,
        removeDirectory: archiveDependencies.removeDirectory,
        reportFailure: archiveDependencies.reportFailure,
      };

      await assert.rejects(
        streamLogFilesToZip({
          ...failingArchiveDependencies,
          destinationPath: archivePath,
          snapshotFiles: [],
        }),
        outputFailure,
      );
      assert.strictEqual(await fs.readFile(archivePath, 'utf8'), 'existing destination contents\n');

      if (process.platform !== 'win32') {
        assert.strictEqual((await fs.stat(archivePath)).mode & 0o777, 0o644);
      }
      assert.strictEqual(
        (await fs.readdir(temporaryLogDirectory)).some(name => name.startsWith('.wire-log-export-')),
        false,
      );
    }),
  );

  it(
    'removes the snapshot and partial destination after ZIP output failure',
    withTemporaryDirectory('wire-log-export-failure-', async (temporaryLogDirectory: string) => {
      await fs.outputFile(path.join(temporaryLogDirectory, 'electron.log'), 'archive failure\n');
      const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
      const archivePath = path.join(temporaryLogDirectory, 'logs.zip');
      const outputFailure = new Error('output failed');
      const snapshotPromise = createLogSnapshot(
        createSnapshotTestOptions({
          cleanup: runNoopCleanup,
          copyFile: snapshotFileSystemDependencies.copyFile,
          createTemporaryDirectory: snapshotFileSystemDependencies.createTemporaryDirectory,
          discoverLogFilePaths() {
            return ['electron.log'];
          },
          ensureDirectory: snapshotFileSystemDependencies.ensureDirectory,
          getFileMetadata: snapshotFileSystemDependencies.getFileMetadata,
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
          removeDirectory: snapshotFileSystemDependencies.removeDirectory,
          temporaryDirectoryPrefix: path.join(temporaryLogDirectory, 'snapshot-'),
        }),
      );
      let wrotePartialArchive = false;
      const archiveDependencies = createLogArchiveDependencies(noop);
      const failingArchiveDependencies = {
        createArchive: archiveDependencies.createArchive,
        createOutputStream(destinationPath: string) {
          return new Writable({
            write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error) => void): void {
              if (wrotePartialArchive === false) {
                wrotePartialArchive = true;
                fs.writeFileSync(destinationPath, chunk, {mode: 0o600});
              }

              callback(outputFailure);
            },
          });
        },
        createTemporaryArchiveDirectory: archiveDependencies.createTemporaryArchiveDirectory,
        commitArchive: archiveDependencies.commitArchive,
        removeDirectory: archiveDependencies.removeDirectory,
        reportFailure: archiveDependencies.reportFailure,
      };

      await assert.rejects(
        exportLogFiles({
          async createSnapshot() {
            return snapshotPromise;
          },
          destinationPath: archivePath,
          removeSnapshotDirectory: snapshotFileSystemDependencies.removeDirectory,
          reportFailure: noop,
          async streamSnapshot({destinationPath, snapshotFiles}) {
            await streamLogFilesToZip({
              ...failingArchiveDependencies,
              destinationPath,
              snapshotFiles,
            });
          },
        }),
        outputFailure,
      );

      const snapshot = await snapshotPromise;
      assert.strictEqual(wrotePartialArchive, true);
      assert.strictEqual(await fs.pathExists(archivePath), false);
      assert.strictEqual(await fs.pathExists(snapshot.directoryPath), false);
    }),
  );
});
