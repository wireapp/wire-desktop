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

import {ActionType} from '../actions';
import {LIFECYCLE} from '../lib/eventType';

export interface AccountData {
  accentID?: number;
  badgeCount: number;
  id: string;
  isAdding: boolean;
  lifecycle?: LIFECYCLE;
  name?: string;
  picture?: string;
  sessionID?: string;
  ssoCode?: string;
  teamID?: string;
  teamRole?: string;
  userID?: string;
  visible: boolean;
}

const createAccount = (sessionID?: string, ssoCode: string | undefined = undefined): AccountData => ({
  accentID: undefined,
  badgeCount: 0,
  id: uuid(),
  isAdding: true,
  lifecycle: undefined,
  name: undefined,
  picture: undefined,
  sessionID,
  ssoCode,
  teamID: undefined,
  userID: undefined,
  visible: true,
});

const initialState = [createAccount()];

const accountReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case ActionType.ADD_ACCOUNT: {
      const newState = state.map(account => ({...account, visible: false}));
      newState.push(createAccount(action.sessionID));
      return newState;
    }

    case ActionType.INITIATE_SSO: {
      let newState;
      if (action.id) {
        // If an account is given, set the sso code
        newState = state.map(account => {
          const isMatchingAccount = account.id === action.id;
          return isMatchingAccount ? {...account, isAdding: true, ssoCode: action.ssoCode} : account;
        });
      } else {
        newState = state.map(account => ({...account, visible: false}));
        newState.push(createAccount(action.sessionID, action.ssoCode));
      }
      return newState;
    }

    case ActionType.DELETE_ACCOUNT: {
      return state.filter(account => account.id !== action.id);
    }

    case ActionType.RESET_IDENTITY: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, teamID: undefined, userID: undefined} : account;
      });
    }

    case ActionType.SWITCH_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return {...account, visible: isMatchingAccount};
      });
    }

    case ActionType.UPDATE_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, ...action.data, isAdding: false, ssoCode: undefined} : account;
      });
    }

    case ActionType.UPDATE_ACCOUNT_BADGE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, badgeCount: action.count} : account;
      });
    }

    case ActionType.UPDATE_ACCOUNT_LIFECYCLE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, lifecycle: action.data} : account;
      });
    }

    default: {
      return state;
    }
  }
};

export default accountReducer;
