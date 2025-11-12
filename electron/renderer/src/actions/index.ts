/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import * as Joi from '@hapi/joi';

import {Availability} from '@wireapp/protocol-messaging';

import {AccountAction, accountAction} from './AccountAction';

import {AppDispatch, State} from '../index';
import {generateUUID} from '../lib/util';
import {
  AddAccount,
  DeleteAccount,
  InitiateSSO,
  ResetIdentity,
  SetConversationJoinData,
  UpdateAccount,
  UpdateAccountBadge,
  UpdateAccountDarkMode,
  UpdateAccountLifeCycle,
} from '../reducers/accountReducer';
import {HideContextMenus, ToggleEditAccountVisibility} from '../reducers/contextMenuReducer';
import {AccountSelector} from '../selector/AccountSelector';
import {Account, ConversationJoinData} from '../types/account';
import {ContextMenuState} from '../types/contextMenuState';

export enum ACCOUNT_ACTION {
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  HIDE_CONTEXT_MENUS = 'HIDE_CONTEXT_MENUS',
  INITIATE_SSO = 'INITIATE_SSO',
  RESET_IDENTITY = 'RESET_IDENTITY',
  SET_CONVERSATION_JOIN_DATA = 'SET_CONVERSATION_JOIN_DATA',
  SWITCH_ACCOUNT = 'SWITCH_ACCOUNT',
  TOGGLE_ADD_ACCOUNT_VISIBILITY = 'TOGGLE_ADD_ACCOUNT_VISIBILITY',
  TOGGLE_EDIT_ACCOUNT_VISIBILITY = 'TOGGLE_EDIT_ACCOUNT_VISIBILITY',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE',
  UPDATE_ACCOUNT_DARK_MODE = 'UPDATE_ACCOUNT_DARK_MODE',
  UPDATE_ACCOUNT_LIFECYCLE = 'UPDATE_ACCOUNT_LIFECYCLE',
}

export const addAccount = (withSession = true): AddAccount => ({
  sessionID: withSession ? generateUUID() : undefined,
  type: ACCOUNT_ACTION.ADD_ACCOUNT,
});

export const initiateSSO = (id: string | undefined, ssoCode: string, withSession = true): InitiateSSO => ({
  id,
  sessionID: withSession ? generateUUID() : undefined,
  ssoCode,
  type: ACCOUNT_ACTION.INITIATE_SSO,
});

export const deleteAccount = (id: string): DeleteAccount => ({
  id,
  type: ACCOUNT_ACTION.DELETE_ACCOUNT,
});

export const resetIdentity = (id: string): ResetIdentity => ({
  id,
  type: ACCOUNT_ACTION.RESET_IDENTITY,
});

export const updateAccount = (id: string, data: Partial<Account>): UpdateAccount => ({
  data,
  id,
  type: ACCOUNT_ACTION.UPDATE_ACCOUNT,
});

export const updateAccountLifecycle = (id: string, channel: string): UpdateAccountLifeCycle => {
  return {
    channel,
    id,
    type: ACCOUNT_ACTION.UPDATE_ACCOUNT_LIFECYCLE,
  };
};

export const setConversationJoinData = (id: string, data?: ConversationJoinData): SetConversationJoinData => ({
  data,
  id,
  type: ACCOUNT_ACTION.SET_CONVERSATION_JOIN_DATA,
});

export const updateAccountBadge = (id: string, count: number): UpdateAccountBadge => ({
  count,
  id,
  type: ACCOUNT_ACTION.UPDATE_ACCOUNT_BADGE,
});

export const updateAccountDarkMode = (id: string, darkMode: boolean): UpdateAccountDarkMode => ({
  darkMode,
  id,
  type: ACCOUNT_ACTION.UPDATE_ACCOUNT_DARK_MODE,
});

export const setAccountContextHidden = (): HideContextMenus => ({
  type: ACCOUNT_ACTION.HIDE_CONTEXT_MENUS,
});

export const toggleEditAccountMenuVisibility = (payload: ContextMenuState): ToggleEditAccountVisibility => ({
  payload,
  type: ACCOUNT_ACTION.TOGGLE_EDIT_ACCOUNT_VISIBILITY,
});

export const abortAccountCreation = (id: string) => {
  return (dispatch: AppDispatch, getState: () => State) => {
    // Note: It's not guaranteed that the dispatched action "deleteAccount" generates a new state without the deleted account
    const accounts = AccountSelector.getAccounts(getState()).filter(account => account.id !== id);
    const lastAccount = accounts[accounts.length - 1];

    dispatch(deleteAccount(id));

    if (lastAccount) {
      const accountIndex = AccountSelector.getAccountIndex(getState(), lastAccount.id);
      // @ts-ignore
      dispatch(accountAction.switchWebview(accountIndex));
    } else {
      dispatch(addAccount(false));
    }
  };
};

export const addAccountWithSession = () => {
  return (dispatch: AppDispatch, getState: () => State) => {
    const hasReachedAccountLimit = AccountSelector.hasReachedLimitOfAccounts(getState());
    const unboundAccount = AccountSelector.getUnboundAccount(getState());

    if (!!unboundAccount) {
      const unboundAccountIndex = AccountSelector.getAccountIndex(getState(), unboundAccount.id);
      // @ts-ignore
      dispatch(accountAction.switchWebview(unboundAccountIndex));
      return;
    }

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};

export const updateAccountData = (id: string, data: Partial<Account>) => {
  const accountDataSchema = Joi.object({
    accentID: Joi.number(),
    availability: Joi.number().optional(),
    darkMode: Joi.boolean().optional(),
    name: Joi.string(),
    picture: Joi.string().optional(),
    teamID: Joi.string().optional(),
    teamRole: Joi.string(),
    userID: Joi.string(),
    webappUrl: Joi.string(),
  }).unknown(true);

  return (dispatch: AppDispatch) => {
    const validatedAccountData = accountDataSchema.validate(data);

    if (!validatedAccountData.error) {
      dispatch(updateAccount(id, validatedAccountData.value));
    } else {
      console.warn('Got invalid account data:', validatedAccountData.error);
    }
  };
};

export const updateAccountBadgeCount = (id: string, count: number) => {
  return (dispatch: AppDispatch, getState: () => State) => {
    const accounts = getState().accounts;
    const account = getState().accounts.find(acc => acc.id === id);
    const accumulatedCount = accounts.reduce((accumulated, account) => {
      return accumulated + (account.id === id ? count : account.badgeCount);
    }, 0);
    const ignoreFlash = account?.availability === Availability.Type.BUSY;

    window.sendBadgeCount(accumulatedCount, ignoreFlash);

    if (account) {
      const countHasChanged = account.badgeCount !== count;
      if (countHasChanged) {
        dispatch(updateAccountBadge(id, count));
      }
    } else {
      console.warn('Missing account when updating badge count');
    }
  };
};

export interface ActionRoot {
  accountAction: AccountAction;
}

const actionRoot: ActionRoot = {
  accountAction,
};

export default actionRoot;
