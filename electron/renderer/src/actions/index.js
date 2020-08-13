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

import {config} from '../../../dist/settings/config';
import {accountAction} from './AccountAction';
import {AccountSelector} from '../selector/AccountSelector';
import {generateUUID} from '../lib/util';

export const ActionType = {
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
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

export const addAccount = (withSession = true) => ({
  sessionID: withSession ? generateUUID() : undefined,
  type: ActionType.ADD_ACCOUNT,
});

export const initiateSSO = (id, ssoCode = undefined, withSession = true) => ({
  id,
  sessionID: withSession ? generateUUID() : undefined,
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
    // Note: It's not guaranteed that the dispatched action "deleteAccount" generates a new state without the deleted account
    const accounts = AccountSelector.getAccounts(getState()).filter(account => account.id !== id);
    const lastAccount = accounts[accounts.length - 1];

    dispatch(deleteAccount(id));

    if (lastAccount) {
      const accountIndex = AccountSelector.getAccountIndex(getState(), lastAccount.id);
      dispatch(accountAction.switchWebview(accountIndex));
    } else {
      dispatch(addAccount(false));
    }
  };
};

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
  const accountDataSchema = Joi.object({
    accentID: Joi.number(),
    availability: Joi.number().optional(),
    name: Joi.string(),
    picture: Joi.string().optional(),
    teamID: Joi.string().optional(),
    teamRole: Joi.string(),
    userID: Joi.string(),
    webappUrl: Joi.string(),
  }).unknown(true);

  return dispatch => {
    const validatedAccountData = accountDataSchema.validate(data);

    if (!validatedAccountData.error) {
      dispatch(updateAccount(id, validatedAccountData.value));
    } else {
      console.warn('Got invalid account data:', validatedAccountData.error);
    }
  };
};

export const updateAccountBadgeCount = (id, count) => {
  return (dispatch, getState) => {
    const accounts = getState().accounts;
    const account = getState().accounts.find(acc => acc.id === id);
    const accumulatedCount = accounts.reduce((accumulated, account) => {
      return accumulated + (account.id === id ? count : account.badgeCount);
    }, 0);
    const ignoreFlash = account.availability === Availability.Type.BUSY;

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

const actionRoot = {
  accountAction,
};

export default actionRoot;
