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
  it('completes initial cleanup before scheduling periodic cleanup', async () => {
    const events: string[] = [];
    const cleanupCompletion = createDeferredCompletion();
    const startup = initializeDesktopLogLifecycle({
      reportCleanupFailure() {
        events.push('cleanup-failed');
      },
      async runInitialCleanup() {
        events.push('cleanup-started');
        await cleanupCompletion.promise;
        events.push('cleanup-completed');
      },
      schedulePeriodicCleanup() {
        events.push('schedule-cleanup');
      },
    });

    await Promise.resolve();

    assert.deepStrictEqual(events, ['cleanup-started']);

    cleanupCompletion.resolve();
    await startup;

    assert.deepStrictEqual(events, ['cleanup-started', 'cleanup-completed', 'schedule-cleanup']);
  });

  it('reports cleanup failure and continues startup', async () => {
    const events: string[] = [];
    const cleanupFailure = new Error('cleanup failed');

    await initializeDesktopLogLifecycle({
      reportCleanupFailure(error: unknown) {
        assert.strictEqual(error, cleanupFailure);
        events.push('cleanup-failed');
      },
      async runInitialCleanup() {
        throw cleanupFailure;
      },
      schedulePeriodicCleanup() {
        events.push('schedule-cleanup');
      },
    });

    assert.deepStrictEqual(events, ['cleanup-failed', 'schedule-cleanup']);
  });
});
