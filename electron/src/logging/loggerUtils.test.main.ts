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

import {gatherLogs, getLogFilenames} from './loggerUtils';

describe('loggerUtils', () => {
  let temporaryLogDirectory: string;

  beforeEach(async () => {
    temporaryLogDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-desktop-logs-'));
  });

  afterEach(async () => {
    await fs.remove(temporaryLogDirectory);
  });

  it('finds nested regular log and old files without following symbolic links', async () => {
    const nestedLogFilePath = path.join(temporaryLogDirectory, 'account', 'console.log');
    const nestedOldFilePath = path.join(temporaryLogDirectory, 'account', 'previous.old');
    const ignoredTextFilePath = path.join(temporaryLogDirectory, 'account', 'ignored.txt');
    const symbolicLinkPath = path.join(temporaryLogDirectory, 'linked.log');

    await fs.outputFile(nestedLogFilePath, 'log content');
    await fs.outputFile(nestedOldFilePath, 'old content');
    await fs.outputFile(ignoredTextFilePath, 'ignored content');
    await fs.ensureSymlink(nestedLogFilePath, symbolicLinkPath);

    const actualRelativeLogFiles = getLogFilenames(temporaryLogDirectory).sort();
    const expectedRelativeLogFiles = [path.join('account', 'console.log'), path.join('account', 'previous.old')];

    assert.deepStrictEqual(actualRelativeLogFiles, expectedRelativeLogFiles);
  });

  it('returns absolute paths when requested', async () => {
    const nestedLogFilePath = path.join(temporaryLogDirectory, 'account', 'console.log');
    const nestedOldFilePath = path.join(temporaryLogDirectory, 'account', 'previous.old');

    await fs.outputFile(nestedLogFilePath, 'log content');
    await fs.outputFile(nestedOldFilePath, 'old content');

    const actualAbsoluteLogFiles = getLogFilenames(temporaryLogDirectory, true).sort();
    const expectedAbsoluteLogFiles = [nestedLogFilePath, nestedOldFilePath].sort();

    assert.deepStrictEqual(actualAbsoluteLogFiles, expectedAbsoluteLogFiles);
  });

  it('preserves nested relative paths when gathering logs for export', async () => {
    const nestedLogFilePath = path.join(temporaryLogDirectory, 'account', 'console.log');
    const nestedOldFilePath = path.join(temporaryLogDirectory, 'account', 'previous.old');

    await fs.outputFile(nestedLogFilePath, 'log content');
    await fs.outputFile(nestedOldFilePath, 'old content');

    const actualLogFiles = await gatherLogs(temporaryLogDirectory);
    const expectedLogFiles = {
      [path.join('account', 'console.log')]: Buffer.from('log content'),
      [path.join('account', 'previous.old')]: Buffer.from('old content'),
    };

    assert.deepStrictEqual(actualLogFiles, expectedLogFiles);
  });
});
