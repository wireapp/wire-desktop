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

import {gatherLogFiles} from './logExport';
import {createLogMaintenanceCoordinator} from './logMaintenance';

import {withTemporaryDirectory} from '../../test/withTemporaryDirectory';
import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

function createDeferredCompletion(): {promise: Promise<void>; resolve: () => void} {
  let resolvePromise: () => void = () => {
    // The resolver is replaced by the Promise constructor.
  };
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

describe('desktop log export', () => {
  it(
    'waits for pending writes before cleanup and gathering files',
    withTemporaryDirectory('wire-log-export-', async (temporaryLogDirectory: string) => {
      const logFilePath = path.join(temporaryLogDirectory, 'electron.log');
      const writeCompletion = createDeferredCompletion();
      const maintenanceCoordinator = createTestMaintenanceCoordinator();
      const writePromise = maintenanceCoordinator.runWrite(async (): Promise<void> => {
        await writeCompletion.promise;
        await fs.outputFile(logFilePath, 'complete entry\n');
      });
      const events: string[] = [];
      const exportPromise = gatherLogFiles({
        async cleanup(): Promise<void> {
          events.push('cleanup');
        },
        discoverLogFilePaths(): readonly string[] {
          events.push('discover');

          return ['electron.log'];
        },
        logDirectory: temporaryLogDirectory,
        async readFile(filePath: string): Promise<Uint8Array> {
          events.push('read');

          return fs.readFile(filePath);
        },
        reportReadFailure(): void {
          events.push('read-failed');
        },
        runMaintenance: maintenanceCoordinator.runMaintenance,
      });

      await Promise.resolve();
      assert.deepStrictEqual(events, []);

      writeCompletion.resolve();
      await writePromise;
      const actualLogFiles = await exportPromise;

      assert.deepStrictEqual(events, ['cleanup', 'discover', 'read']);
      assert.strictEqual(Buffer.from(actualLogFiles['electron.log']).toString(), 'complete entry\n');
    }),
  );
});
