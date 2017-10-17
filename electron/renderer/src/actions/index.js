/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

export const ADD_ACCOUNT = 'ADD_ACCOUNT';
export const SWITCH_ACCOUNT = 'SWITCH_ACCOUNT';
export const UPDATE_ACCOUNT = 'UPDATE_ACCOUNT';
export const UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE';
export const DELETE_ACCOUNT = 'DELETE_ACCOUNT';

export const addAccount = (withSession = true) => {
  const sessionID = withSession ? uuid() : undefined;
  return {
    sessionID: sessionID,
    type: ADD_ACCOUNT,
  };
};

export const updateAccount = (id, data) => {
  return {
    data,
    id,
    type: UPDATE_ACCOUNT,
  };
};

export const switchAccount = id => {
  return {
    id,
    type: SWITCH_ACCOUNT,
  };
};

export const updateAccountBadge = (id, count) => {
  return {
    count,
    id,
    type: UPDATE_ACCOUNT_BADGE,
  };
};

export const deleteAccount = id => {
  return {
    id,
    type: DELETE_ACCOUNT,
  };
};

export const setAccountContextHidden = () => {
  return {
    type: 'HIDE_CONTEXT_MENUS',
  };
};

export const toggleAddAccountMenuVisibility = (x, y) => {
  return {
    payload: {position: {x, y}},
    type: 'TOGGLE_ADD_ACCOUNT_VISIBILITY',
  };
};

export const toggleEditAccountMenuVisibility = (x, y, accountId, sessionId, isAtLeastAdmin) => {
  return {
    payload: {accountId, isAtLeastAdmin, position: {x, y}, sessionId},
    type: 'TOGGLE_EDIT_ACCOUNT_VISIBILITY',
  };
};

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

export const updateAccountData = (id, data) => {
  return (dispatch, getState) => {
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

export const addAccountWithSession = () => {
  return (dispatch, getState) => {
    const hasReachedAccountLimit = getState().accounts.length >= 3;

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};
