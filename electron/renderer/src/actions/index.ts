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

/* eslint-disable no-console */

import uuid from 'uuid/v4';

import {config} from '../../../dist/settings/config';
import {LIFECYCLE} from '../lib/eventType';
import {ThunkAction} from '../reducers';
import {AccountData} from '../reducers/accountReducer';

export enum ActionType {
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  HIDE_CONTEXT_MENUS = 'HIDE_CONTEXT_MENUS',
  INITIATE_SSO = 'INITIATE_SSO',
  RESET_IDENTITY = 'RESET_IDENTITY',
  SWITCH_ACCOUNT = 'SWITCH_ACCOUNT',
  TOGGLE_ADD_ACCOUNT_VISIBILITY = 'TOGGLE_ADD_ACCOUNT_VISIBILITY',
  TOGGLE_EDIT_ACCOUNT_VISIBILITY = 'TOGGLE_EDIT_ACCOUNT_VISIBILITY',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE',
  UPDATE_ACCOUNT_LIFECYCLE = 'UPDATE_ACCOUNT_LIFECYCLE',
}

export const addAccount = (withSession = true) => ({
  sessionID: withSession ? uuid() : undefined,
  type: ActionType.ADD_ACCOUNT,
});

export const initiateSSO = (id?: string, ssoCode: string | undefined = undefined, withSession = true) => ({
  id,
  sessionID: withSession ? uuid() : undefined,
  ssoCode,
  type: ActionType.INITIATE_SSO,
});

export const deleteAccount = (id: string) => ({
  id,
  type: ActionType.DELETE_ACCOUNT,
});

export const resetIdentity = (id: string | true = true) => ({
  id,
  type: ActionType.RESET_IDENTITY,
});

export const switchAccount = (id: string) => ({
  id,
  type: ActionType.SWITCH_ACCOUNT,
});

export const updateAccount = (id: string, data: AccountData) => ({
  data,
  id,
  type: ActionType.UPDATE_ACCOUNT,
});

export const updateAccountLifecycle = (id: string, channel: string) => ({
  data: channel,
  id,
  type: ActionType.UPDATE_ACCOUNT_LIFECYCLE,
});

export const updateAccountBadge = (id: string, count: number) => ({
  count,
  id,
  type: ActionType.UPDATE_ACCOUNT_BADGE,
});

export const setAccountContextHidden = () => ({
  type: ActionType.HIDE_CONTEXT_MENUS,
});

export const toggleEditAccountMenuVisibility = (
  centerX?: number,
  centerY?: number,
  accountId?: string,
  sessionId?: string,
  lifecycle?: LIFECYCLE,
  isAtLeastAdmin?: boolean,
) => ({
  payload: {
    accountId,
    isAtLeastAdmin,
    lifecycle,
    position: {centerX, centerY},
    sessionId,
  },
  type: ActionType.TOGGLE_EDIT_ACCOUNT_VISIBILITY,
});

export const abortAccountCreation = (id: string): ThunkAction => {
  return (dispatch, getState) => {
    dispatch(deleteAccount(id));

    const accounts = getState().accounts;
    const lastAccount = accounts[accounts.length - 1];

    if (lastAccount) {
      dispatch(switchAccount(lastAccount.id));
    } else {
      dispatch(addAccount(false));
    }
  };
};

export const addAccountWithSession = (): ThunkAction => {
  return (dispatch, getState) => {
    const hasReachedAccountLimit = getState().accounts.length >= config.maximumAccounts;

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};

export const updateAccountData = (id: string, data: AccountData): ThunkAction => {
  return dispatch => {
    dispatch(updateAccount(id, data));
  };
};

export const updateAccountBadgeCount = (id: string, count: number): ThunkAction => {
  return (dispatch, getState) => {
    const account = getState().accounts.find(acc => acc.id === id);

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
