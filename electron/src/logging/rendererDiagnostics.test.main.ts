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
import {EventEmitter} from 'events';
import * as path from 'path';

import {getLogger} from './getLogger';
import {getLogDirectory, getMainProcessLogPath} from './logPaths';
import {registerRendererDiagnostics, RendererDiagnosticsWebContents} from './rendererDiagnostics';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';

type FakeWebContents = EventEmitter & {
  getType(): string;
};

function createFakeWebContents(): FakeWebContents {
  return Object.assign(new EventEmitter(), {
    getType(): string {
      return 'window';
    },
  });
}

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

describe('desktop renderer diagnostics logging', () => {
  it(
    'writes structured wrapper renderer diagnostics to electron.log without message or source contents',
    withTemporaryDirectory('wire-wrapper-renderer-diagnostics-', async (temporaryDirectory: string) => {
      const originalUserDataDirectory = app.getPath('userData');

      try {
        await fs.ensureDir(temporaryDirectory);
        app.setPath('userData', temporaryDirectory);

        const privateMessage = 'OIDC response for Alice contained a private session with no labeled token fields';
        const privateSourcePath = '/Users/person/private/preload.js';
        const wrapperWebContents = createFakeWebContents();
        const logger = getLogger('renderer-diagnostics-regression');
        const currentDate = new Date();
        const logFilePath = getMainProcessLogPath({date: currentDate, logDirectory: getLogDirectory()});
        const expectedLogFilePath = path.join(
          temporaryDirectory,
          'logs',
          currentDate.toISOString().slice(0, 10),
          'electron.log',
        );

        registerRendererDiagnostics({
          app,
          logger,
          reloadMainWindow(): void {},
          reportReloadFailure(): void {},
          wrapperWebContents: wrapperWebContents as unknown as RendererDiagnosticsWebContents,
        });
        wrapperWebContents.emit('console-message', {
          level: 'error',
          lineNumber: 37,
          message: `${privateMessage} ${privateSourcePath} https://customer.example.test/path?state=private-state`,
          sourceId: 'https://customer.example.test/identity-provider.js',
        });

        const actualLogContents = await waitForLogMessage(logFilePath, 'event=desktop-wrapper-console-error');

        assert.strictEqual(logFilePath, expectedLogFilePath);
        assert.strictEqual(
          actualLogContents.includes('event=desktop-wrapper-console-error severity=error line=37'),
          true,
        );
        assert.strictEqual(actualLogContents.includes(privateMessage), false);
        assert.strictEqual(actualLogContents.includes(privateSourcePath), false);
        assert.strictEqual(actualLogContents.includes('customer.example.test'), false);
        assert.strictEqual(actualLogContents.includes('private-state'), false);
        assert.strictEqual(actualLogContents.includes('Alice'), false);
      } finally {
        app.setPath('userData', originalUserDataDirectory);
      }
    }),
  );
});
