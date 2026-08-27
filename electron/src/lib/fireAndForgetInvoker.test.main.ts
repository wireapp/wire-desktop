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

import {createFireAndForgetInvoker} from './fireAndForgetInvoker';

describe('fire-and-forget invoker', () => {
  it('invokes an asynchronous action without waiting for it', () => {
    let actionInvocationCount = 0;
    const invoker = createFireAndForgetInvoker({
      reportFailure(): void {
        // The action is expected to resolve.
      },
    });

    invoker.fireAndForget(async (): Promise<void> => {
      actionInvocationCount += 1;
    });

    assert.strictEqual(actionInvocationCount, 1);
  });

  it('reports synchronous action failures', async () => {
    const failures: unknown[] = [];
    const expectedFailure = new Error('synchronous failure');
    const invoker = createFireAndForgetInvoker({
      reportFailure(error: unknown): void {
        failures.push(error);
      },
    });

    invoker.fireAndForget(() => {
      throw expectedFailure;
    });
    await invoker.waitUntilAllSettled();

    assert.deepStrictEqual(failures, [expectedFailure]);
  });

  it('reports rejected asynchronous actions', async () => {
    const failures: unknown[] = [];
    const expectedFailure = new Error('asynchronous failure');
    const invoker = createFireAndForgetInvoker({
      reportFailure(error: unknown): void {
        failures.push(error);
      },
    });

    invoker.fireAndForget(async (): Promise<void> => {
      throw expectedFailure;
    });
    await invoker.waitUntilAllSettled();

    assert.deepStrictEqual(failures, [expectedFailure]);
  });

  it('waits for active actions to settle', async () => {
    let resolveFirstAction: () => void = () => {
      // The resolver is replaced by the Promise constructor.
    };
    let resolveSecondAction: () => void = () => {
      // The resolver is replaced by the Promise constructor.
    };
    const invoker = createFireAndForgetInvoker({
      reportFailure(): void {
        // The actions are expected to resolve.
      },
    });
    const firstAction = new Promise<void>(resolve => {
      resolveFirstAction = resolve;
    });
    const secondAction = new Promise<void>(resolve => {
      resolveSecondAction = resolve;
    });
    let hasWaitFinished = false;

    invoker.fireAndForget(async (): Promise<void> => {
      await firstAction;
    });
    invoker.fireAndForget(async (): Promise<void> => {
      await secondAction;
    });

    async function waitForActionsToSettle(): Promise<void> {
      await invoker.waitUntilAllSettled();

      hasWaitFinished = true;
    }

    const waitPromise = waitForActionsToSettle();
    await Promise.resolve();

    assert.strictEqual(hasWaitFinished, false);

    resolveFirstAction();
    await Promise.resolve();

    assert.strictEqual(hasWaitFinished, false);

    resolveSecondAction();
    await waitPromise;

    assert.strictEqual(hasWaitFinished, true);
  });
});
