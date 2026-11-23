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

import {app} from 'electron';
import * as fs from 'fs-extra';

import * as assert from 'assert';
import * as path from 'path';

import {createBoundedLogWriter} from './boundedLogWriter';
import {writeBoundedLogMessage} from './desktopLogWriter';
import {createLogMaintenanceCoordinator} from './logMaintenance';
import {
  appendPrivateLogFile,
  ensurePrivateLogDirectory,
  getPrivateLogFileSize,
  protectLogDirectoryAtStartup,
} from './logPermissions';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

function createPermissionTestWriter(logDirectory: string, currentTimeMilliseconds: number) {
  const invoker = createFireAndForgetInvoker({reportFailure: () => undefined});

  return createBoundedLogWriter({
    afterWrite: async () => undefined,
    dependencies: {
      async appendFile(filePath: string, content: string) {
        await appendPrivateLogFile(filePath, content);
      },
      async ensureDirectory(directoryPath: string) {
        await ensurePrivateLogDirectory(logDirectory, directoryPath);
      },
      getCurrentTimeMilliseconds() {
        return currentTimeMilliseconds;
      },
      async getFileSize(filePath: string) {
        try {
          return await getPrivateLogFileSize(filePath);
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return 0;
          }

          throw error;
        }
      },
      async moveFile(sourceFilePath: string, destinationFilePath: string) {
        await fs.move(sourceFilePath, destinationFilePath, {overwrite: false});
      },
      async pathExists(filePath: string) {
        return fs.pathExists(filePath);
      },
    },
    maintenanceCoordinator: createLogMaintenanceCoordinator({fireAndForget: invoker.fireAndForget}),
    maximumFileSizeBytes: 6,
  });
}

function getPermissionMode(filePath: string): Promise<number> {
  return fs.stat(filePath).then(fileStatistics => fileStatistics.mode & 0o7777);
}

describe('desktop log filesystem permissions', () => {
  it(
    'restricts retained logs without changing their contents or following symbolic links',
    withTemporaryDirectory('wire-log-permissions-migration-', async temporaryDirectory => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(temporaryDirectory, 'logs');
      const accountLogDirectory = path.join(logDirectory, '2026-11-23', 'accounts', 'account-id');
      const retainedLogPath = path.join(accountLogDirectory, 'console.log');
      const externalLogDirectory = path.join(temporaryDirectory, 'external');
      const externalLogPath = path.join(externalLogDirectory, 'retained.log');
      const linkedLogPath = path.join(accountLogDirectory, 'linked.log');
      const linkedDirectoryPath = path.join(logDirectory, 'linked-directory');
      const retainedLogContent = 'existing log content\n';

      await fs.ensureDir(accountLogDirectory);
      await fs.ensureDir(externalLogDirectory);
      await fs.outputFile(retainedLogPath, retainedLogContent);
      await fs.outputFile(externalLogPath, 'external content\n');
      await fs.chmod(logDirectory, 0o777);
      await fs.chmod(accountLogDirectory, 0o755);
      await fs.chmod(retainedLogPath, 0o644);
      await fs.chmod(externalLogPath, 0o644);
      await fs.symlink(externalLogPath, linkedLogPath, 'file');
      await fs.symlink(externalLogDirectory, linkedDirectoryPath, 'dir');

      protectLogDirectoryAtStartup(logDirectory);

      assert.strictEqual(await fs.readFile(retainedLogPath, 'utf8'), retainedLogContent);
      assert.strictEqual(await getPermissionMode(logDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(accountLogDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(retainedLogPath), 0o600);
      assert.strictEqual(await getPermissionMode(externalLogPath), 0o644);
      assert.strictEqual((await fs.lstat(linkedLogPath)).isSymbolicLink(), true);
      assert.strictEqual((await fs.lstat(linkedDirectoryPath)).isSymbolicLink(), true);
    }),
  );

  it(
    'rejects a symbolic-link log root during writes after startup migration skips it',
    withTemporaryDirectory('wire-log-permissions-root-link-', async temporaryDirectory => {
      if (process.platform === 'win32') {
        return;
      }

      const externalLogDirectory = path.join(temporaryDirectory, 'external');
      const logDirectory = path.join(temporaryDirectory, 'logs');
      const externalLogPath = path.join(externalLogDirectory, 'electron.log');

      await fs.ensureDir(externalLogDirectory);
      await fs.outputFile(externalLogPath, 'leave this file alone\n');
      await fs.chmod(externalLogPath, 0o644);
      await fs.symlink(externalLogDirectory, logDirectory, 'dir');

      protectLogDirectoryAtStartup(logDirectory);

      const boundedLogWriter = createPermissionTestWriter(logDirectory, 123);

      await assert.rejects(
        boundedLogWriter.write({
          logFilePath: path.join(logDirectory, '2026-11-23', 'electron.log'),
          message: 'blocked',
        }),
      );
      assert.strictEqual(await fs.readFile(externalLogPath, 'utf8'), 'leave this file alone\n');
      assert.strictEqual(await getPermissionMode(externalLogPath), 0o644);
    }),
  );

  it(
    'creates private logs, restricts existing directories, and keeps appending and rotation working',
    withTemporaryDirectory('wire-log-permissions-writer-', async temporaryDirectory => {
      if (process.platform === 'win32') {
        return;
      }

      const logDirectory = path.join(temporaryDirectory, 'logs');
      const activeDirectory = path.join(logDirectory, '2026-11-23');
      const activeLogPath = path.join(activeDirectory, 'electron.log');
      const lateDirectory = path.join(logDirectory, '2026-11-24');
      const lateLogPath = path.join(lateDirectory, 'electron.log');
      const boundedLogWriter = createPermissionTestWriter(logDirectory, 123);

      await boundedLogWriter.write({logFilePath: activeLogPath, message: 'first'});
      assert.strictEqual(await getPermissionMode(logDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(activeDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(activeLogPath), 0o600);

      await fs.chmod(activeDirectory, 0o755);
      await fs.chmod(activeLogPath, 0o644);
      protectLogDirectoryAtStartup(logDirectory);
      assert.strictEqual(await fs.readFile(activeLogPath, 'utf8'), 'first\n');
      assert.strictEqual(await getPermissionMode(activeDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(activeLogPath), 0o600);

      await boundedLogWriter.write({logFilePath: activeLogPath, message: 'next'});
      assert.strictEqual(await fs.readFile(activeLogPath, 'utf8'), 'next\n');
      assert.strictEqual(await fs.readFile(`${activeLogPath}.123-0.old`, 'utf8'), 'first\n');
      assert.strictEqual(await getPermissionMode(`${activeLogPath}.123-0.old`), 0o600);
      assert.strictEqual(await getPermissionMode(activeLogPath), 0o600);

      await fs.ensureDir(lateDirectory);
      await fs.chmod(lateDirectory, 0o755);
      await boundedLogWriter.write({logFilePath: lateLogPath, message: 'late'});
      assert.strictEqual(await getPermissionMode(lateDirectory), 0o700);
      assert.strictEqual(await getPermissionMode(lateLogPath), 0o600);
    }),
  );

  it(
    'writes queued entries under the private profile captured when the writes were submitted',
    withTemporaryDirectory('wire-log-permissions-profile-switch-', async temporaryDirectory => {
      if (process.platform === 'win32') {
        return;
      }

      const originalUserDataPath = app.getPath('userData');
      const firstUserDataPath = path.join(temporaryDirectory, 'first-profile');
      const secondUserDataPath = path.join(temporaryDirectory, 'second-profile');
      const firstLogDirectory = path.join(firstUserDataPath, 'logs');
      const secondLogDirectory = path.join(secondUserDataPath, 'logs');
      const firstLogPath = path.join(firstLogDirectory, '2026-11-23', 'electron.log');
      app.setPath('userData', firstUserDataPath);

      try {
        const firstWritePromise = writeBoundedLogMessage({
          logFilePath: firstLogPath,
          message: 'first queued entry',
        });
        const secondWritePromise = writeBoundedLogMessage({
          logFilePath: firstLogPath,
          message: 'second queued entry',
        });

        app.setPath('userData', secondUserDataPath);
        await Promise.all([firstWritePromise, secondWritePromise]);

        const actualLogContents = await fs.readFile(firstLogPath, 'utf8');
        const expectedLogContents = 'first queued entry\nsecond queued entry\n';

        assert.strictEqual(actualLogContents, expectedLogContents);
        assert.strictEqual(await getPermissionMode(firstLogDirectory), 0o700);
        assert.strictEqual(await getPermissionMode(path.dirname(firstLogPath)), 0o700);
        assert.strictEqual(await getPermissionMode(firstLogPath), 0o600);
        assert.strictEqual(await fs.pathExists(path.join(secondLogDirectory, '2026-11-23', 'electron.log')), false);
      } finally {
        app.setPath('userData', originalUserDataPath);
      }
    }),
  );
});
