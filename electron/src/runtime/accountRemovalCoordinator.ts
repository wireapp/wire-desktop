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

import {Maybe} from 'true-myth';

export type AccountRemovalCoordinator = {
  isAccountRemovalInProgress(accountId: string): boolean;
  runAccountRemoval(accountId: string, removeAccount: () => Promise<void>): Promise<void>;
};

export function createAccountRemovalCoordinator(): AccountRemovalCoordinator {
  const removalsByAccountId = new Map<string, Promise<void>>();

  return {
    isAccountRemovalInProgress(accountId) {
      return Maybe.of(removalsByAccountId.get(accountId)).isJust;
    },
    runAccountRemoval(accountId, removeAccount) {
      const existingRemoval = Maybe.of(removalsByAccountId.get(accountId));
      if (existingRemoval.isJust) {
        return existingRemoval.value;
      }

      async function completeAccountRemoval(): Promise<void> {
        // Register the in-progress state before invoking callbacks that may reenter.
        await Promise.resolve();
        try {
          await removeAccount();
        } finally {
          removalsByAccountId.delete(accountId);
        }
      }

      const removal = completeAccountRemoval();
      removalsByAccountId.set(accountId, removal);

      return removal;
    },
  };
}
