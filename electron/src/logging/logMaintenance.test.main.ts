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

import {createLogMaintenanceCoordinator} from './logMaintenance';

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

describe('desktop log maintenance coordination', () => {
  it('waits for active writes and blocks writes requested after maintenance', async () => {
    const coordinator = createTestMaintenanceCoordinator();
    const firstWriteCompletion = createDeferredCompletion();
    let writeCount = 0;
    let maintenanceCount = 0;

    const firstWrite = coordinator.runWrite(async (): Promise<void> => {
      writeCount += 1;
      await firstWriteCompletion.promise;
    });
    const maintenance = coordinator.runMaintenance(async (): Promise<void> => {
      maintenanceCount += 1;
    });
    const queuedWrite = coordinator.runWrite(async (): Promise<void> => {
      writeCount += 1;
    });

    await Promise.resolve();
    await Promise.resolve();

    assert.strictEqual(writeCount, 1);
    assert.strictEqual(maintenanceCount, 0);

    firstWriteCompletion.resolve();
    await firstWrite;
    await maintenance;
    await queuedWrite;

    assert.strictEqual(writeCount, 2);
    assert.strictEqual(maintenanceCount, 1);
  });

  it('keeps normal writes to different files concurrent', async () => {
    const coordinator = createTestMaintenanceCoordinator();
    const firstWriteCompletion = createDeferredCompletion();
    const secondWriteCompletion = createDeferredCompletion();
    let activeWriteCount = 0;
    let maximumActiveWriteCount = 0;

    const writeFirstFile = coordinator.runWrite(async (): Promise<void> => {
      activeWriteCount += 1;
      maximumActiveWriteCount = Math.max(maximumActiveWriteCount, activeWriteCount);
      await firstWriteCompletion.promise;
      activeWriteCount -= 1;
    });
    const writeSecondFile = coordinator.runWrite(async (): Promise<void> => {
      activeWriteCount += 1;
      maximumActiveWriteCount = Math.max(maximumActiveWriteCount, activeWriteCount);
      await secondWriteCompletion.promise;
      activeWriteCount -= 1;
    });

    await Promise.resolve();

    assert.strictEqual(maximumActiveWriteCount, 2);

    firstWriteCompletion.resolve();
    secondWriteCompletion.resolve();
    await Promise.all([writeFirstFile, writeSecondFile]);
  });

  it('releases queued writes when maintenance fails', async () => {
    const coordinator = createTestMaintenanceCoordinator();
    const maintenance = coordinator.runMaintenance(async (): Promise<void> => {
      throw new Error('maintenance failed');
    });
    const queuedWrite = coordinator.runWrite(async (): Promise<void> => {
      // The test only verifies that the queued write resumes.
    });
    let maintenanceFailure: unknown;

    try {
      await maintenance;
    } catch (error) {
      maintenanceFailure = error;
    }

    await queuedWrite;

    assert.strictEqual(maintenanceFailure instanceof Error, true);
  });

  it('serializes concurrent maintenance operations', async () => {
    const coordinator = createTestMaintenanceCoordinator();
    const firstMaintenanceCompletion = createDeferredCompletion();
    let activeMaintenanceCount = 0;
    let maximumActiveMaintenanceCount = 0;

    const firstMaintenance = coordinator.runMaintenance(async (): Promise<void> => {
      activeMaintenanceCount += 1;
      maximumActiveMaintenanceCount = Math.max(maximumActiveMaintenanceCount, activeMaintenanceCount);
      await firstMaintenanceCompletion.promise;
      activeMaintenanceCount -= 1;
    });
    const secondMaintenance = coordinator.runMaintenance(async (): Promise<void> => {
      activeMaintenanceCount += 1;
      maximumActiveMaintenanceCount = Math.max(maximumActiveMaintenanceCount, activeMaintenanceCount);
      activeMaintenanceCount -= 1;
    });

    await Promise.resolve();
    await Promise.resolve();

    assert.strictEqual(maximumActiveMaintenanceCount, 1);

    firstMaintenanceCompletion.resolve();
    await Promise.all([firstMaintenance, secondMaintenance]);
  });
});
