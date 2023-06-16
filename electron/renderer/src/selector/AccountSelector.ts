/*
 * Wire
 * Copyright (C) 2023 Wire Swiss GmbH
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

import {config as CONFIG} from '../../../src/settings/config';
import {State} from '../index';

export class AccountSelector {
  static getAccounts = (state: State) => state.accounts;
  static getSelectedAccount = (state: State) => AccountSelector.getAccounts(state).find(account => account.visible);
  static getAccountIndex = (state: State, accountId: string) =>
    AccountSelector.getAccounts(state).findIndex(account => account.id === accountId);
  static getSelectedAccountAccentId = (state: State) => AccountSelector.getSelectedAccount(state)?.accentID;
  static getSelectedAccountDarkMode = (state: State) => AccountSelector.getSelectedAccount(state)?.darkMode;
  static isAddingAccount = (state: State) => !!AccountSelector.getUnboundAccount(state);
  static getUnboundAccount = (state: State) =>
    !!AccountSelector.getAccounts(state).length &&
    AccountSelector.getAccounts(state).find(account => account.userID === undefined);
  static hasReachedLimitOfAccounts = (state: State) =>
    AccountSelector.getAccounts(state).length >= CONFIG.maximumAccounts;
  static hasCreatedAccount = (state: State) =>
    AccountSelector.getAccounts(state).some(account => account.userID !== undefined);
  static getAccountById = (state: State, accountId: string) =>
    AccountSelector.getAccounts(state).find(account => account.id === accountId);
  static getAccountLifecycle = (state: State, accountId: string) =>
    AccountSelector.getAccountById(state, accountId)?.lifecycle;
  static getConversationJoinData = (state: State, accountId: string) =>
    AccountSelector.getAccountById(state, accountId)?.conversationJoinData;
}
