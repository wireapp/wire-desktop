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

import {createAccountRemovalCoordinator} from './accountRemovalCoordinator';

const accountId = '11111111-1111-4111-8111-111111111111';
const otherAccountId = '22222222-2222-4222-8222-222222222222';

describe('account removal coordinator', () => {
  it('coalesces concurrent removal requests and exposes the live account gate', async () => {
    const coordinator = createAccountRemovalCoordinator();
    const removalCompletion = Promise.withResolvers<void>();
    let removalCount = 0;
    const removeAccount = async (): Promise<void> => {
      removalCount += 1;
      await removalCompletion.promise;
    };

    const firstRemoval = coordinator.runAccountRemoval(accountId, removeAccount);
    const overlappingRemoval = coordinator.runAccountRemoval(accountId, removeAccount);

    assert.strictEqual(firstRemoval, overlappingRemoval);
    assert.strictEqual(coordinator.isAccountRemovalInProgress(accountId), true);
    assert.strictEqual(coordinator.isAccountRemovalInProgress(otherAccountId), false);
    assert.strictEqual(removalCount, 0);

    await Promise.resolve();
    assert.strictEqual(removalCount, 1);
    removalCompletion.resolve();
    await firstRemoval;
    assert.strictEqual(coordinator.isAccountRemovalInProgress(accountId), false);
  });

  it('clears the live account gate when removal rejects and accepts a later request', async () => {
    const coordinator = createAccountRemovalCoordinator();
    let shouldFail = true;
    let removalCount = 0;

    async function removeAccount(): Promise<void> {
      removalCount += 1;
      if (shouldFail) {
        throw new Error('Account removal failed');
      }
    }

    await assert.rejects(coordinator.runAccountRemoval(accountId, removeAccount), /Account removal failed/);
    assert.strictEqual(coordinator.isAccountRemovalInProgress(accountId), false);

    shouldFail = false;
    await coordinator.runAccountRemoval(accountId, removeAccount);
    assert.strictEqual(removalCount, 2);
  });
});
