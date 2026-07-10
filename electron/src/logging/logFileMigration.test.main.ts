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
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import {LogFileMigrationLogger, renameWebviewLogFiles} from './logFileMigration';

describe('logFileMigration', () => {
  let temporaryLogDirectory: string;

  beforeEach(async () => {
    temporaryLogDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-desktop-log-migration-'));
  });

  afterEach(async () => {
    await fs.remove(temporaryLogDirectory);
  });

  it('renames nested log files to old files at startup', async () => {
    const nestedLogFilePath = path.join(temporaryLogDirectory, 'account', 'console.log');
    const nestedOldFilePath = path.join(temporaryLogDirectory, 'account', 'previous.old');
    const migrationLogger: LogFileMigrationLogger = {
      error: () => undefined,
      log: () => undefined,
    };

    await fs.outputFile(nestedLogFilePath, 'log content');
    await fs.outputFile(nestedOldFilePath, 'old content');

    renameWebviewLogFiles(temporaryLogDirectory, migrationLogger);

    const actualLogFileExists = await fs.pathExists(nestedLogFilePath);
    const actualRenamedFileContent = await fs.readFile(path.join(temporaryLogDirectory, 'account', 'console.old'), 'utf8');
    const actualExistingOldFileContent = await fs.readFile(nestedOldFilePath, 'utf8');

    assert.strictEqual(actualLogFileExists, false);
    assert.strictEqual(actualRenamedFileContent, 'log content');
    assert.strictEqual(actualExistingOldFileContent, 'old content');
  });
});
