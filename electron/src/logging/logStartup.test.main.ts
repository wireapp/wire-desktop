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

import {initializeDesktopLogLifecycle} from './logStartup';

function createDeferredCompletion(): {promise: Promise<void>; resolve: () => void} {
  let resolvePromise: () => void = () => {
    // The resolver is replaced by the Promise constructor.
  };
  const promise = new Promise<void>(resolve => {
    resolvePromise = resolve;
  });

  return {promise, resolve: resolvePromise};
}

describe('desktop log startup', () => {
  it('completes cleanup before scheduling and initializing webview logging', async () => {
    const events: string[] = [];
    const cleanupCompletion = createDeferredCompletion();
    const startup = initializeDesktopLogLifecycle({
      async initializeWebviewLogging(): Promise<void> {
        events.push('initialize-webview-logging');
      },
      reportCleanupFailure(): void {
        events.push('cleanup-failed');
      },
      async runInitialCleanup(): Promise<void> {
        events.push('cleanup-started');
        await cleanupCompletion.promise;
        events.push('cleanup-completed');
      },
      schedulePeriodicCleanup(): void {
        events.push('schedule-cleanup');
      },
    });

    await Promise.resolve();

    assert.deepStrictEqual(events, ['cleanup-started']);

    cleanupCompletion.resolve();
    await startup;

    assert.deepStrictEqual(events, [
      'cleanup-started',
      'cleanup-completed',
      'schedule-cleanup',
      'initialize-webview-logging',
    ]);
  });

  it('reports cleanup failure and continues startup', async () => {
    const events: string[] = [];
    const cleanupFailure = new Error('cleanup failed');

    await initializeDesktopLogLifecycle({
      async initializeWebviewLogging(): Promise<void> {
        events.push('initialize-webview-logging');
      },
      reportCleanupFailure(error: unknown): void {
        assert.strictEqual(error, cleanupFailure);
        events.push('cleanup-failed');
      },
      async runInitialCleanup(): Promise<void> {
        throw cleanupFailure;
      },
      schedulePeriodicCleanup(): void {
        events.push('schedule-cleanup');
      },
    });

    assert.deepStrictEqual(events, ['cleanup-failed', 'schedule-cleanup', 'initialize-webview-logging']);
  });
});
