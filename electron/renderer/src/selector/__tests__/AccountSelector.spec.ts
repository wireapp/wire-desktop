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

import {config} from '../../../../src/settings/config';
import {State} from '../../index';
import {generateUUID} from '../../lib/util';
import {createAccount} from '../../reducers/accountReducer';
import {AccountSelector} from '../AccountSelector';

const createState = (createdAccounts: number, unboundAccounts = 0): State => ({
  accounts: [
    ...Array.from({length: createdAccounts}, () => ({...createAccount({id: generateUUID()}), userID: generateUUID()})),
    ...Array.from({length: unboundAccounts}, () => createAccount({id: generateUUID()})),
  ],
  contextMenuState: {} as State['contextMenuState'],
});

describe('AccountSelector', () => {
  describe('getNumberOfAccountsAboveLimit', () => {
    it('returns 0 when within the limit', () => {
      expect(AccountSelector.getNumberOfAccountsAboveLimit(createState(config.maximumAccounts))).toEqual(0);
    });

    it('returns how many created accounts exceed the limit', () => {
      expect(AccountSelector.getNumberOfAccountsAboveLimit(createState(config.maximumAccounts + 2))).toEqual(2);
    });

    it('ignores accounts that are not created yet', () => {
      expect(AccountSelector.getNumberOfAccountsAboveLimit(createState(config.maximumAccounts, 1))).toEqual(0);
    });
  });

  describe('getCreatedAccounts', () => {
    it('only returns accounts with a user', () => {
      expect(AccountSelector.getCreatedAccounts(createState(2, 1)).length).toEqual(2);
    });
  });
});
