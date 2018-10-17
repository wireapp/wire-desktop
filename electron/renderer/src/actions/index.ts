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

import * as uuid from 'uuid/v4';
import {Action, ActionCreator, ActionFunction} from '../../interfaces/';
import {verifyObjectProperties} from '../lib/verifyObjectProperties';

export const addAccount = (withSession = true): Action => ({
  sessionID: withSession ? uuid() : undefined,
  type: ActionCreator.ADD_ACCOUNT,
});

export const deleteAccount = (id: string): Action => ({
  id,
  type: ActionCreator.DELETE_ACCOUNT,
});

export const switchAccount = (id: string): Action => ({
  id,
  type: ActionCreator.SWITCH_ACCOUNT,
});

export const updateAccount = (id: string, data: any): Action => ({
  data,
  id,
  type: ActionCreator.UPDATE_ACCOUNT,
});

export const updateAccountLifecycle = (id: string, data: any): Action => ({
  data,
  id,
  type: ActionCreator.UPDATE_ACCOUNT_LIFECYCLE,
});

export const updateAccountBadge = (id: string, count: number): Action => ({
  count,
  id,
  type: ActionCreator.UPDATE_ACCOUNT_BADGE,
});

export const setAccountContextHidden = (): Action => ({
  type: ActionCreator.HIDE_CONTEXT_MENUS,
});

export const toggleEditAccountMenuVisibility = (
  x: number,
  y: number,
  accountId: string,
  sessionId: string,
  lifecycle,
  isAtLeastAdmin
): Action => ({
  payload: {
    accountId,
    isAtLeastAdmin,
    lifecycle,
    position: {x, y},
    sessionId,
  },
  type: ActionCreator.TOGGLE_EDIT_ACCOUNT_VISIBILITY,
});

export const abortAccountCreation = (id: string): ActionFunction => {
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

export const addAccountWithSession = (): ActionFunction => {
  return (dispatch, getState): void => {
    const hasReachedAccountLimit = getState().accounts.length >= 3;

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};

export const updateAccountData = (id: string, data: any): ActionFunction => {
  return (dispatch): void => {
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

export const updateAccountBadgeCount = (id: string, count: number): ActionFunction => {
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
