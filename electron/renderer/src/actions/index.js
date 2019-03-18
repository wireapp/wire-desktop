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

import uuid from 'uuid/v4';

import verifyObjectProperties from '../lib/verifyObjectProperties';
import {MAXIMUM_ACCOUNTS} from '../../../dist/settings/config';

export const ADD_ACCOUNT = 'ADD_ACCOUNT';
export const INITIATE_SSO = 'INITIATE_SSO';
export const DELETE_ACCOUNT = 'DELETE_ACCOUNT';
export const RESET_IDENTITY = 'RESET_IDENTITY';
export const SWITCH_ACCOUNT = 'SWITCH_ACCOUNT';
export const UPDATE_ACCOUNT = 'UPDATE_ACCOUNT';
export const UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE';
export const UPDATE_ACCOUNT_LIFECYCLE = 'UPDATE_ACCOUNT_LIFECYCLE';

export const addAccount = (withSession = true) => ({
  sessionID: withSession ? uuid() : undefined,
  type: ADD_ACCOUNT,
});

export const initiateSSO = (id, ssoCode = undefined, withSession = true) => ({
  id,
  sessionID: withSession ? uuid() : undefined,
  ssoCode,
  type: INITIATE_SSO,
});

export const deleteAccount = id => ({
  id,
  type: DELETE_ACCOUNT,
});

export const resetIdentity = (id = true) => ({
  id,
  type: RESET_IDENTITY,
});

export const switchAccount = id => ({
  id,
  type: SWITCH_ACCOUNT,
});

export const updateAccount = (id, data) => ({
  data,
  id,
  type: UPDATE_ACCOUNT,
});

export const updateAccountLifecycle = (id, channel) => ({
  data: channel,
  id,
  type: UPDATE_ACCOUNT_LIFECYCLE,
});

export const updateAccountBadge = (id, count) => ({
  count,
  id,
  type: UPDATE_ACCOUNT_BADGE,
});

export const HIDE_CONTEXT_MENUS = 'HIDE_CONTEXT_MENUS';
export const TOGGLE_ADD_ACCOUNT_VISIBILITY = 'TOGGLE_ADD_ACCOUNT_VISIBILITY';
export const TOGGLE_EDIT_ACCOUNT_VISIBILITY = 'TOGGLE_EDIT_ACCOUNT_VISIBILITY';

export const setAccountContextHidden = () => ({
  type: HIDE_CONTEXT_MENUS,
});

export const toggleEditAccountMenuVisibility = (x, y, accountId, sessionId, lifecycle, isAtLeastAdmin) => ({
  payload: {
    accountId,
    isAtLeastAdmin,
    lifecycle,
    position: {x, y},
    sessionId,
  },
  type: TOGGLE_EDIT_ACCOUNT_VISIBILITY,
});

export const abortAccountCreation = id => {
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

export const addAccountWithSession = () => {
  return (dispatch, getState) => {
    const hasReachedAccountLimit = getState().accounts.length >= MAXIMUM_ACCOUNTS;

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
      name: 'String',
      picture: 'String',
      teamID: 'String',
      teamRole: 'String',
      userID: 'String',
    });

    if (validatedAccountData) {
      dispatch(updateAccount(id, validatedAccountData));
    } else {
      console.warn(`Got invalid account data ${JSON.stringify(data)}`);
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
