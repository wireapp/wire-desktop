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

import {scheduleLogCleanup, UnrefableInterval} from './logCleanupScheduler';

import {createFireAndForgetInvoker} from '../lib/fireAndForgetInvoker';

describe('desktop log cleanup scheduler', () => {
  it('schedules an unrefed hourly cleanup interval', async () => {
    let scheduledCallback: () => void = () => {};
    let scheduledIntervalMilliseconds = 0;
    let wasUnrefed = false;
    let cleanupRunCount = 0;
    const interval: UnrefableInterval = {
      unref: (): void => {
        wasUnrefed = true;
      },
    };
    const invoker = createFireAndForgetInvoker({
      reportFailure(error: unknown): void {
        throw error;
      },
    });

    scheduleLogCleanup({
      fireAndForget: invoker.fireAndForget,
      intervalMilliseconds: 60_000,
      async runCleanup(): Promise<void> {
        cleanupRunCount += 1;
      },
      setInterval: (callback: () => void, intervalMilliseconds: number): UnrefableInterval => {
        scheduledCallback = callback;
        scheduledIntervalMilliseconds = intervalMilliseconds;

        return interval;
      },
    });

    scheduledCallback();
    await new Promise<void>(resolve => {
      setImmediate(resolve);
    });

    assert.strictEqual(scheduledIntervalMilliseconds, 60_000);
    assert.strictEqual(wasUnrefed, true);
    assert.strictEqual(cleanupRunCount, 1);
  });
});
