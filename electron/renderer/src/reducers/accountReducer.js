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
import * as ActionCreator from '../actions';

const createAccount = (sessionID, ssoCode = undefined) => ({
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

const accountReducer = (state = [createAccount()], action) => {
  switch (action.type) {
    case ActionCreator.ADD_ACCOUNT: {
      const newState = state.map(account => ({...account, visible: false}));
      newState.push(createAccount(action.sessionID));
      return newState;
    }

    case ActionCreator.INITIATE_SSO: {
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

    case ActionCreator.DELETE_ACCOUNT: {
      return state.filter(account => account.id !== action.id);
    }

    case ActionCreator.RESET_IDENTITY: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, teamID: undefined, userID: undefined} : account;
      });
    }

    case ActionCreator.SWITCH_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return {...account, visible: isMatchingAccount};
      });
    }

    case ActionCreator.UPDATE_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, ...action.data, isAdding: false, ssoCode: undefined} : account;
      });
    }

    case ActionCreator.UPDATE_ACCOUNT_BADGE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, badgeCount: action.count} : account;
      });
    }

    case ActionCreator.UPDATE_ACCOUNT_LIFECYCLE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, lifecycle: action.data} : account;
      });
    }

    default:
      return state;
  }
};

export default accountReducer;
