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

import {renameWebViewLogFiles} from './logMigration';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';

describe('desktop log migration', () => {
  it(
    'renames every discovered log file to the existing old extension',
    withTemporaryDirectory('wire-log-migration-', async (temporaryLogDirectory: string) => {
      const currentLogPath = path.join(temporaryLogDirectory, 'account', 'console.log');
      const currentMainLogPath = path.join(temporaryLogDirectory, 'electron.log');
      await fs.outputFile(currentLogPath, 'webview');
      await fs.outputFile(currentMainLogPath, 'main');

      function ignoreLogMessage(_message: string): void {}

      const logger = {
        error: ignoreLogMessage,
        log: ignoreLogMessage,
      };
      renameWebViewLogFiles(temporaryLogDirectory, logger);

      assert.strictEqual(await fs.pathExists(currentLogPath), false);
      assert.strictEqual(await fs.pathExists(currentMainLogPath), false);
      assert.strictEqual(await fs.pathExists(currentLogPath.replace('.log', '.old')), true);
      assert.strictEqual(await fs.pathExists(currentMainLogPath.replace('.log', '.old')), true);
    }),
  );
});
