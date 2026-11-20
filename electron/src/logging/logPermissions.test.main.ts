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
import * as os from 'os';
import * as path from 'path';

import {BoundedLogWriterDependencies, createBoundedLogWriter} from './boundedLogWriter';
import {createLogMaintenanceCoordinator} from './logMaintenance';
import {
  appendPrivateLogFile,
  ensurePrivateLogDirectory,
  logFileIdentityChangedErrorCode,
  protectLogDirectoryAtStartup,
  protectPrivateFile,
} from './logPermissions';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

function getPermissionBits(filePath: string): Promise<number> {
  return fs.stat(filePath).then(fileStatistics => fileStatistics.mode & 0o777);
}

function createPrivateWriterDependencies(logDirectory: string): BoundedLogWriterDependencies {
  return {
    async appendFile(filePath: string, content: string) {
      await appendPrivateLogFile(filePath, content);
    },
    async ensureDirectory(directoryPath: string) {
      await ensurePrivateLogDirectory(logDirectory, directoryPath);
    },
    getCurrentTimeMilliseconds() {
      return 42;
    },
    async getFileSize(filePath: string) {
      try {
        const fileMetadata = await fs.lstat(filePath);

        if (fileMetadata.isSymbolicLink() || !fileMetadata.isFile() || fileMetadata.nlink > 1) {
          throw new Error(`Unsafe log file: ${filePath}`);
        }

        await protectPrivateFile(filePath);

        return fileMetadata.size;
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return 0;
        }

        throw error;
      }
    },
    async moveFile(sourceFilePath: string, destinationFilePath: string) {
      await fs.rename(sourceFilePath, destinationFilePath);
    },
    async pathExists(filePath: string) {
      return fs.pathExists(filePath);
    },
  };
}

describe('desktop log filesystem permissions', () => {
  it(
    'hardens existing permissive managed paths without changing their contents or the profile parent',
    withTemporaryDirectory('wire-log-permissions-existing-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(profileDirectory, 'logs');
      const accountDirectory = path.join(logDirectory, '2026-11-20', 'accounts', 'test-account');
      const existingLogFiles = new Map<string, string>([
        [path.join(logDirectory, 'electron.log'), 'native log contents\n'],
        [path.join(accountDirectory, 'console.log'), 'console log contents\n'],
        [path.join(accountDirectory, 'application.jsonl'), '{"level":30}\n'],
        [path.join(accountDirectory, 'sso.log'), 'sso log contents\n'],
        [path.join(accountDirectory, 'console.log.123-0.old'), 'rotated log contents\n'],
      ]);

      for (const [filePath, contents] of existingLogFiles) {
        await fs.outputFile(filePath, contents, {mode: 0o666});
        await fs.chmod(filePath, 0o666);
      }

      const unrelatedFilePath = path.join(logDirectory, 'notes.txt');
      await fs.outputFile(unrelatedFilePath, 'unmanaged data\n', {mode: 0o666});
      await fs.chmod(unrelatedFilePath, 0o666);
      const outsideTargetPath = path.join(profileDirectory, 'outside.log');
      const symbolicLogPath = path.join(logDirectory, 'linked.log');
      await fs.outputFile(outsideTargetPath, 'outside target\n', {mode: 0o666});
      await fs.symlink(outsideTargetPath, symbolicLogPath, 'file');
      await fs.chmod(profileDirectory, 0o755);
      await fs.chmod(logDirectory, 0o777);
      await fs.chmod(path.join(logDirectory, '2026-11-20'), 0o777);
      await fs.chmod(path.join(logDirectory, '2026-11-20', 'accounts'), 0o777);
      await fs.chmod(accountDirectory, 0o777);

      protectLogDirectoryAtStartup(logDirectory);

      for (const [filePath, contents] of existingLogFiles) {
        assert.strictEqual(await getPermissionBits(filePath), 0o600);
        assert.strictEqual(await fs.readFile(filePath, 'utf8'), contents);
      }

      for (const directoryPath of [
        logDirectory,
        path.join(logDirectory, '2026-11-20'),
        path.join(logDirectory, '2026-11-20', 'accounts'),
        accountDirectory,
      ]) {
        assert.strictEqual(await getPermissionBits(directoryPath), 0o700);
      }

      assert.strictEqual(await getPermissionBits(profileDirectory), 0o755);
      assert.strictEqual(await getPermissionBits(unrelatedFilePath), 0o666);
      assert.strictEqual(await fs.readFile(outsideTargetPath, 'utf8'), 'outside target\n');
      assert.strictEqual((await fs.lstat(symbolicLogPath)).isSymbolicLink(), true);
    }),
  );

  it(
    'creates private directories and files and keeps appending functional',
    withTemporaryDirectory('wire-log-permissions-new-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(profileDirectory, 'logs');
      const accountDirectory = path.join(logDirectory, '2026-11-20', 'accounts', 'test-account');
      await ensurePrivateLogDirectory(logDirectory, accountDirectory);
      const filePath = path.join(accountDirectory, 'application.jsonl');

      await appendPrivateLogFile(filePath, '{"level":30}\n');
      await appendPrivateLogFile(filePath, '{"level":40}\n');

      assert.strictEqual(await getPermissionBits(filePath), 0o600);
      assert.strictEqual(await fs.readFile(filePath, 'utf8'), '{"level":30}\n{"level":40}\n');

      for (const directoryPath of [
        logDirectory,
        path.join(logDirectory, '2026-11-20'),
        path.join(logDirectory, '2026-11-20', 'accounts'),
        accountDirectory,
      ]) {
        assert.strictEqual(await getPermissionBits(directoryPath), 0o700);
      }
    }),
  );

  it(
    'preserves concurrent first appends when another writer creates the file first',
    withTemporaryDirectory('wire-log-permissions-concurrent-first-write-', async (profileDirectory: string) => {
      const logDirectory = path.join(profileDirectory, 'logs');
      const accountDirectory = path.join(logDirectory, '2026-11-20', 'accounts', 'test-account');
      const logFilePath = path.join(accountDirectory, 'application.jsonl');
      await ensurePrivateLogDirectory(logDirectory, accountDirectory);

      await Promise.all([
        appendPrivateLogFile(logFilePath, '{"message":"first writer"}\n'),
        appendPrivateLogFile(logFilePath, '{"message":"second writer"}\n'),
      ]);

      const actualLines = (await fs.readFile(logFilePath, 'utf8')).trimEnd().split('\n').toSorted();
      const expectedLines = ['{"message":"first writer"}', '{"message":"second writer"}'].toSorted();

      assert.deepStrictEqual(actualLines, expectedLines);

      if (process.platform !== 'win32') {
        assert.strictEqual(await getPermissionBits(logFilePath), 0o600);
      }
    }),
  );

  it(
    'rejects hard-linked and symbolic-link files before changing or appending to their targets',
    withTemporaryDirectory('wire-log-permissions-links-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const originalFilePath = path.join(profileDirectory, 'original.log');
      const hardLinkPath = path.join(profileDirectory, 'hard-link.log');
      const symbolicLinkPath = path.join(profileDirectory, 'symbolic-link.log');
      await fs.writeFile(originalFilePath, 'unchanged contents\n', {mode: 0o644});
      await fs.link(originalFilePath, hardLinkPath);
      await fs.symlink(originalFilePath, symbolicLinkPath, 'file');

      await assert.rejects(protectPrivateFile(originalFilePath), /multiple hard links/);
      await assert.rejects(appendPrivateLogFile(originalFilePath, 'must not be appended\n'), /multiple hard links/);
      await assert.rejects(
        appendPrivateLogFile(symbolicLinkPath, 'must not be appended\n'),
        /unexpected filesystem type/,
      );

      assert.strictEqual(await getPermissionBits(originalFilePath), 0o644);
      assert.strictEqual(await fs.readFile(originalFilePath, 'utf8'), 'unchanged contents\n');

      const logDirectory = path.join(profileDirectory, 'logs');
      const hardLinkedLogPath = path.join(logDirectory, 'electron.log');
      const hardLinkedOutsidePath = path.join(profileDirectory, 'outside-alias.log');
      await fs.outputFile(hardLinkedLogPath, 'legacy hard-linked log\n', {mode: 0o644});
      await fs.link(hardLinkedLogPath, hardLinkedOutsidePath);

      assert.throws(() => protectLogDirectoryAtStartup(logDirectory), /multiple hard links/);
      assert.strictEqual(await getPermissionBits(hardLinkedLogPath), 0o644);
      assert.strictEqual(await fs.readFile(hardLinkedOutsidePath, 'utf8'), 'legacy hard-linked log\n');
    }),
  );

  it(
    'marks a safe replacement opened after metadata inspection as file identity churn',
    withTemporaryDirectory('wire-log-permissions-open-replacement-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logFilePath = path.join(profileDirectory, 'electron.log');
      await fs.writeFile(logFilePath, 'original contents\n', {mode: 0o644});
      await fs.chmod(logFilePath, 0o644);
      const originalFileHandle = await fs.promises.open(logFilePath, 'r');

      try {
        await assert.rejects(
          protectPrivateFile(logFilePath, async (filePath, flags) => {
            fs.removeSync(filePath);
            fs.writeFileSync(filePath, 'replacement contents\n', {mode: 0o644});

            return fs.promises.open(filePath, flags);
          }),
          error => {
            return error instanceof Error && 'code' in error && error.code === logFileIdentityChangedErrorCode;
          },
        );

        assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), 'replacement contents\n');
        assert.strictEqual(await getPermissionBits(logFilePath), 0o644);
      } finally {
        await originalFileHandle.close();
      }
    }),
  );

  it(
    'detects a file replacement after the opened file metadata is inspected',
    withTemporaryDirectory('wire-log-permissions-post-open-replacement-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logFilePath = path.join(profileDirectory, 'electron.log');
      const rotatedFilePath = `${logFilePath}.rotated.old`;
      await fs.writeFile(logFilePath, 'original contents\n', {mode: 0o600});
      await fs.chmod(logFilePath, 0o600);

      await assert.rejects(
        protectPrivateFile(logFilePath, async (filePath, flags) => {
          const openedFileHandle = await fs.promises.open(filePath, flags);

          return new Proxy(openedFileHandle, {
            get(target, property) {
              if (property === 'stat') {
                return async () => {
                  const openedFileMetadata = await target.stat();
                  await fs.rename(filePath, rotatedFilePath);
                  await fs.writeFile(filePath, 'replacement contents\n', {mode: 0o644});
                  await fs.chmod(filePath, 0o644);

                  return openedFileMetadata;
                };
              }

              const propertyValue = Reflect.get(target, property, target);

              return typeof propertyValue === 'function' ? propertyValue.bind(target) : propertyValue;
            },
          });
        }),
        error => {
          return error instanceof Error && 'code' in error && error.code === logFileIdentityChangedErrorCode;
        },
      );

      assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), 'replacement contents\n');
      assert.strictEqual(await getPermissionBits(logFilePath), 0o644);
      assert.strictEqual(await fs.readFile(rotatedFilePath, 'utf8'), 'original contents\n');
      assert.strictEqual(await getPermissionBits(rotatedFilePath), 0o600);
    }),
  );

  it(
    'keeps rotated and newly active files private and refuses to rotate a hard link',
    withTemporaryDirectory('wire-log-permissions-rotation-', async (profileDirectory: string) => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(profileDirectory, 'logs');
      const logFilePath = path.join(logDirectory, '2026-11-20', 'electron.log');
      const fireAndForgetInvoker = createFireAndForgetInvoker({reportFailure() {}});
      const maintenanceCoordinator = createLogMaintenanceCoordinator({
        fireAndForget: fireAndForgetInvoker.fireAndForget,
      });
      const logWriter = createBoundedLogWriter({
        afterWrite: async () => undefined,
        dependencies: createPrivateWriterDependencies(logDirectory),
        maintenanceCoordinator,
        maximumFileSizeBytes: 8,
      });

      await logWriter.write({logFilePath, message: 'first'});
      await logWriter.write({logFilePath, message: 'second'});

      const rotatedFilePath = `${logFilePath}.42-0.old`;
      assert.strictEqual(await fs.readFile(rotatedFilePath, 'utf8'), `first${os.EOL}`);
      assert.strictEqual(await fs.readFile(logFilePath, 'utf8'), `second${os.EOL}`);
      assert.strictEqual(await getPermissionBits(rotatedFilePath), 0o600);
      assert.strictEqual(await getPermissionBits(logFilePath), 0o600);

      const linkedFilePath = path.join(logDirectory, '2026-11-20', 'linked.log');
      const linkedAliasPath = path.join(profileDirectory, 'linked-alias.log');
      await fs.writeFile(linkedFilePath, 'linked contents\n');
      await fs.link(linkedFilePath, linkedAliasPath);
      const linkedWriter = createBoundedLogWriter({
        afterWrite: async () => undefined,
        dependencies: createPrivateWriterDependencies(logDirectory),
        maintenanceCoordinator,
        maximumFileSizeBytes: 1,
      });

      await assert.rejects(linkedWriter.write({logFilePath: linkedFilePath, message: 'trigger'}), /Unsafe log file/);
      assert.strictEqual(await fs.readFile(linkedAliasPath, 'utf8'), 'linked contents\n');
      assert.strictEqual(await fs.pathExists(`${linkedFilePath}.42-0.old`), false);
    }),
  );
});
