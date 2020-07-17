/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {config as CONFIG} from '../../../dist/settings/config';

export class AccountSelector {
  static getAccounts = state => state.accounts;
  static getSelectedAccount = state => AccountSelector.getAccounts(state).find(account => account.visible === true);
  static getAccountIndex = (state, accountId) =>
    AccountSelector.getAccounts(state).findIndex(account => account.id === accountId);
  static getSelectedAccountAccentId = state => AccountSelector.getSelectedAccount(state)?.accentID;
  static isAddingAccount = state =>
    !!AccountSelector.getAccounts(state).length &&
    AccountSelector.getAccounts(state).some(account => account.userID === undefined);
  static hasReachedLimitOfAccounts = state => AccountSelector.getAccounts(state).length >= CONFIG.maximumAccounts;
  static hasCreatedAccount = state => AccountSelector.getAccounts(state).some(account => account.userID !== undefined);
}
