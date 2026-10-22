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

import {getLogger} from './getLogger';
import {getLogDirectory, getMainProcessLogPath} from './logPaths';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {config} from '../settings/config';

async function waitForLogMessage(logFilePath: string, expectedMessage: string): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await fs.pathExists(logFilePath)) {
      const logContents = await fs.readFile(logFilePath, 'utf8');

      if (logContents.includes(expectedMessage)) {
        return logContents;
      }
    }

    await new Promise<void>(resolve => {
      setTimeout(resolve, 10);
    });
  }

  throw new Error(`Expected log message was not written to "${logFilePath}".`);
}

describe('desktop application logger', () => {
  it(
    'writes a production log without CLI opt-in',
    withTemporaryDirectory('wire-desktop-logger-', async (temporaryDirectory: string) => {
      const originalUserDataDirectory = app.getPath('userData');
      const originalEnvironment = config.environment;

      try {
        await fs.ensureDir(temporaryDirectory);
        app.setPath('userData', temporaryDirectory);
        config.environment = 'production';

        const expectedMessage = `always-enabled-logger-${Date.now()}`;
        const logger = getLogger('logger-regression');
        const currentDate = new Date();
        const logFilePath = getMainProcessLogPath({
          date: currentDate,
          logDirectory: getLogDirectory(),
        });
        const expectedLogFilePath = path.join(
          temporaryDirectory,
          'logs',
          currentDate.toISOString().slice(0, 10),
          'electron.log',
        );

        logger.info(expectedMessage);

        const actualLogContents = await waitForLogMessage(logFilePath, expectedMessage);

        assert.strictEqual(logFilePath, expectedLogFilePath);
        assert.strictEqual(actualLogContents.includes(expectedMessage), true);
      } finally {
        config.environment = originalEnvironment;
        app.setPath('userData', originalUserDataDirectory);
      }
    }),
  );
});
