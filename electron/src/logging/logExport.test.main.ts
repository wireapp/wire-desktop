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
  createLogArchiveDependencies,
  createLogSnapshot,
  createLogSnapshotFileSystemDependencies,
  exportLogFiles,
  LogSnapshot,
  LogSnapshotFileSystemDependencies,
  streamLogFilesToZip,
} from './logExport';
import {getLogFilenames} from './logFiles';
import {createLogMaintenanceCoordinator} from './logMaintenance';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

type CreateSnapshotTestParameters = {
  cleanup: () => Promise<void>;
  dependencies: LogSnapshotFileSystemDependencies;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  maintenanceCoordinator: ReturnType<typeof createLogMaintenanceCoordinator>;
  reportFailure: (message: string, error: unknown) => void;
};

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

function createTestMaintenanceCoordinator() {
  const invoker = createFireAndForgetInvoker({
    reportFailure(): void {
      // The coordinator's public promises report expected operation failures.
    },
  });

  return createLogMaintenanceCoordinator({fireAndForget: invoker.fireAndForget});
}

function createSnapshotTestParameters(parameters: CreateSnapshotTestParameters) {
  return {
    cleanup: parameters.cleanup,
    dependencies: parameters.dependencies,
    discoverLogFilePaths: parameters.discoverLogFilePaths,
    logDirectory: parameters.logDirectory,
    reportFailure: parameters.reportFailure,
    runMaintenance: parameters.maintenanceCoordinator.runMaintenance,
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
      const snapshotPromise = createLogSnapshot(
        createSnapshotTestParameters({
          async cleanup(): Promise<void> {
            events.push('cleanup');
          },
          dependencies: createLogSnapshotFileSystemDependencies(),
          discoverLogFilePaths(): readonly string[] {
            events.push('discover');

            return ['electron.log'];
          },
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator,
          reportFailure: noop,
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
        ...defaultDependencies,
        async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
          copiedFiles.push({sourceFilePath, destinationFilePath});
          await defaultDependencies.copyFile(sourceFilePath, destinationFilePath);
        },
      };
      const snapshot = await createLogSnapshot(
        createSnapshotTestParameters({
          cleanup: runNoopCleanup,
          dependencies,
          discoverLogFilePaths(): readonly string[] {
            return ['electron.log'];
          },
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
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

      const snapshot = await createLogSnapshot(
        createSnapshotTestParameters({
          cleanup: runNoopCleanup,
          dependencies: createLogSnapshotFileSystemDependencies(),
          discoverLogFilePaths(): readonly string[] {
            return [
              currentLogRelativePath,
              rotatedLogRelativePath,
              legacyLogRelativePath,
              'linked.log',
              'linked-account/console.log',
            ];
          },
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
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
        ...defaultDependencies,
        async removeDirectory(directoryPath: string): Promise<void> {
          removedSnapshotDirectories.push(directoryPath);
          await defaultDependencies.removeDirectory(directoryPath);
        },
      };

      try {
        await assert.rejects(
          createLogSnapshot(
            createSnapshotTestParameters({
              cleanup: runNoopCleanup,
              dependencies,
              discoverLogFilePaths(): readonly string[] {
                return [relativeEscapePath];
              },
              logDirectory: temporaryLogDirectory,
              maintenanceCoordinator: createTestMaintenanceCoordinator(),
              reportFailure: noop,
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
      const snapshotPromise = createLogSnapshot(
        createSnapshotTestParameters({
          cleanup: runNoopCleanup,
          dependencies: createLogSnapshotFileSystemDependencies(),
          discoverLogFilePaths(): readonly string[] {
            return ['electron.log'];
          },
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator,
          reportFailure: noop,
        }),
      );
      const zipStarted = createDeferredCompletion();
      const zipCompletion = createDeferredCompletion();
      let exportCompleted = false;
      const exportPromise = exportLogFiles({
        async createSnapshot(): Promise<LogSnapshot> {
          return snapshotPromise;
        },
        destinationPath: path.join(temporaryLogDirectory, 'logs.zip'),
        async removeSnapshotDirectory(directoryPath: string): Promise<void> {
          await fs.remove(directoryPath);
        },
        reportFailure: noop,
        async streamSnapshot(): Promise<void> {
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
    'streams current, rotated, and legacy logs into a valid archive',
    withTemporaryDirectory('wire-log-export-archive-', async (temporaryLogDirectory: string) => {
      const currentLogRelativePath = '2026-08-27/electron.log';
      const nestedLogRelativePath = '2026-08-27/accounts/account-id/console.log';
      const rotatedLogRelativePath = '2026-08-27/accounts/account-id/console.log.123-0.old';
      const legacyLogRelativePath = 'legacy.old';
      await fs.outputFile(path.join(temporaryLogDirectory, currentLogRelativePath), 'current\n');
      await fs.outputFile(path.join(temporaryLogDirectory, nestedLogRelativePath), 'nested\n');
      await fs.outputFile(path.join(temporaryLogDirectory, rotatedLogRelativePath), 'rotated\n');
      await fs.outputFile(path.join(temporaryLogDirectory, legacyLogRelativePath), 'legacy\n');
      const archivePath = path.join(temporaryLogDirectory, 'logs.zip');
      let createdSnapshot: Maybe<LogSnapshot> = Maybe.nothing<LogSnapshot>();

      await exportLogFiles({
        async createSnapshot(): Promise<LogSnapshot> {
          const snapshot = await createLogSnapshot(
            createSnapshotTestParameters({
              cleanup: runNoopCleanup,
              dependencies: createLogSnapshotFileSystemDependencies(),
              discoverLogFilePaths(): readonly string[] {
                return getLogFilenames({absolute: false, baseDirectory: temporaryLogDirectory});
              },
              logDirectory: temporaryLogDirectory,
              maintenanceCoordinator: createTestMaintenanceCoordinator(),
              reportFailure: noop,
            }),
          );
          createdSnapshot = Maybe.just(snapshot);

          return snapshot;
        },
        destinationPath: archivePath,
        removeSnapshotDirectory: createLogSnapshotFileSystemDependencies().removeDirectory,
        reportFailure: noop,
        async streamSnapshot({destinationPath, snapshotFiles}): Promise<void> {
          await streamLogFilesToZip({
            destinationPath,
            snapshotFiles,
            dependencies: createLogArchiveDependencies(noop),
          });
        },
      });

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
        currentLogRelativePath,
        legacyLogRelativePath,
        nestedLogRelativePath,
        rotatedLogRelativePath,
      ].toSorted();

      assert.deepStrictEqual(actualEntryPaths, expectedEntryPaths);
      assert.strictEqual(getArchiveEntryContents(archive, currentLogRelativePath), 'current\n');
      assert.strictEqual(getArchiveEntryContents(archive, nestedLogRelativePath), 'nested\n');
      assert.strictEqual(getArchiveEntryContents(archive, rotatedLogRelativePath), 'rotated\n');
      assert.strictEqual(getArchiveEntryContents(archive, legacyLogRelativePath), 'legacy\n');
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
        createSnapshotTestParameters({
          cleanup: runNoopCleanup,
          dependencies: snapshotFileSystemDependencies,
          discoverLogFilePaths(): readonly string[] {
            return ['electron.log'];
          },
          logDirectory: temporaryLogDirectory,
          maintenanceCoordinator: createTestMaintenanceCoordinator(),
          reportFailure: noop,
        }),
      );
      let wrotePartialArchive = false;
      const archiveDependencies = createLogArchiveDependencies(noop);
      const failingArchiveDependencies = {
        ...archiveDependencies,
        createOutputStream(): Writable {
          return new Writable({
            write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error) => void): void {
              if (wrotePartialArchive === false) {
                wrotePartialArchive = true;
                fs.writeFileSync(archivePath, chunk);
              }

              callback(outputFailure);
            },
          });
        },
      };

      await assert.rejects(
        exportLogFiles({
          async createSnapshot(): Promise<LogSnapshot> {
            return snapshotPromise;
          },
          destinationPath: archivePath,
          removeSnapshotDirectory: snapshotFileSystemDependencies.removeDirectory,
          reportFailure: noop,
          async streamSnapshot({destinationPath, snapshotFiles}) {
            await streamLogFilesToZip({
              destinationPath,
              snapshotFiles,
              dependencies: failingArchiveDependencies,
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
