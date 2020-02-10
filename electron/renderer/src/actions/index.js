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

import {config} from '../../../dist/settings/config';
import {verifyObjectProperties} from '../lib/verifyObjectProperties';

export const ActionType = {
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  DISMISS_THIRD_PARTY_NOTICE: 'DISMISS_THIRD_PARTY_NOTICE',
  HIDE_CONTEXT_MENUS: 'HIDE_CONTEXT_MENUS',
  INITIATE_SSO: 'INITIATE_SSO',
  RESET_IDENTITY: 'RESET_IDENTITY',
  SWITCH_ACCOUNT: 'SWITCH_ACCOUNT',
  TOGGLE_ADD_ACCOUNT_VISIBILITY: 'TOGGLE_ADD_ACCOUNT_VISIBILITY',
  TOGGLE_EDIT_ACCOUNT_VISIBILITY: 'TOGGLE_EDIT_ACCOUNT_VISIBILITY',
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  UPDATE_ACCOUNT_BADGE: 'UPDATE_ACCOUNT_BADGE',
  UPDATE_ACCOUNT_LIFECYCLE: 'UPDATE_ACCOUNT_LIFECYCLE',
};

export const addAccount = () => ({
  type: ActionType.ADD_ACCOUNT,
});

export const initiateSSO = (id, ssoCode = undefined) => ({
  id,
  ssoCode,
  type: ActionType.INITIATE_SSO,
});

export const deleteAccount = id => ({
  id,
  type: ActionType.DELETE_ACCOUNT,
});

export const resetIdentity = (id = true) => ({
  id,
  type: ActionType.RESET_IDENTITY,
});

export const switchAccount = id => ({
  id,
  type: ActionType.SWITCH_ACCOUNT,
});

export const dismissThirdPartyNotice = id => ({
  id,
  type: ActionType.DISMISS_THIRD_PARTY_NOTICE,
});

export const updateAccount = (id, data) => ({
  data,
  id,
  type: ActionType.UPDATE_ACCOUNT,
});

export const updateAccountLifecycle = (id, channel) => ({
  data: channel,
  id,
  type: ActionType.UPDATE_ACCOUNT_LIFECYCLE,
});

export const updateAccountBadge = (id, count) => ({
  count,
  id,
  type: ActionType.UPDATE_ACCOUNT_BADGE,
});

export const setAccountContextHidden = () => ({
  type: ActionType.HIDE_CONTEXT_MENUS,
});

export const toggleEditAccountMenuVisibility = (centerX, centerY, accountId, sessionId, lifecycle, isAtLeastAdmin) => ({
  payload: {
    accountId,
    isAtLeastAdmin,
    lifecycle,
    position: {centerX, centerY},
    sessionId,
  },
  type: ActionType.TOGGLE_EDIT_ACCOUNT_VISIBILITY,
});

export const abortAccountCreation = id => {
  return (dispatch, getState) => {
    dispatch(deleteAccount(id));

    const accounts = getState().accounts;
    const lastAccount = accounts[accounts.length - 1];

    if (lastAccount) {
      dispatch(switchAccount(lastAccount.id));
    } else {
      dispatch(addAccount());
    }
  };
};

export const addAccountWithCustomBackend = backendOptions => ({
  backendOptions,
  type: ActionType.ADD_ACCOUNT,
});

export const addAccountWithSession = () => {
  return (dispatch, getState) => {
    const hasReachedAccountLimit = getState().accounts.length >= config.maximumAccounts;

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};

export const updateAccountData = (id, data) => {
  return dispatch => {
    const validatedAccountData = verifyObjectProperties(data, {
      accentID: 'Number',
      backendOptions: 'Object',
      name: 'String',
      picture: 'String',
      teamID: 'String',
      teamRole: 'String',
      userID: 'String',
    });

    if (validatedAccountData) {
      dispatch(updateAccount(id, validatedAccountData));
    } else {
      console.warn('Got invalid account data:', data);
    }
  };
};

export const updateAccountBadgeCount = (id, count) => {
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
