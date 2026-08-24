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

import {getLogFilenames} from './logFiles';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';

describe('desktop log file discovery', () => {
  it(
    'discovers nested log and old files without following symbolic links',
    withTemporaryDirectory('wire-log-files-', async (temporaryLogDirectory: string) => {
      await fs.outputFile(path.join(temporaryLogDirectory, 'electron.log'), 'main');
      await fs.outputFile(path.join(temporaryLogDirectory, 'account', 'console.log'), 'webview');
      await fs.outputFile(path.join(temporaryLogDirectory, 'account', 'console.old'), 'legacy');
      await fs.outputFile(path.join(temporaryLogDirectory, 'account', 'notes.txt'), 'ignore');

      const symbolicLinkTarget = path.join(temporaryLogDirectory, 'account');
      const symbolicLinkPath = path.join(temporaryLogDirectory, 'linked-account');
      await fs.symlink(symbolicLinkTarget, symbolicLinkPath, 'dir');

      const actualPaths = getLogFilenames({absolute: false, baseDirectory: temporaryLogDirectory}).sort();
      const expectedPaths = ['account/console.log', 'account/console.old', 'electron.log'];

      assert.deepStrictEqual(actualPaths, expectedPaths);
    }),
  );
});
