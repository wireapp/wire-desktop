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

function createAccount(sessionID) {
  return {
    id: uuid(),
    teamID: undefined,
    userID: undefined,
    sessionID: sessionID,
    picture: undefined,
    name: undefined,
    visible: true,
    accentID: undefined,
    badgeCount: 0,
  };
}

const accounts = (state = [createAccount()], action) => {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return [
        ...state.map(account => ({ ...account, visible: false })),
        createAccount(action.sessionID),
      ];
    case 'UPDATE_ACCOUNT':
      return state.map(account => {
        return (account.id === action.id)
          ? { ...account, ...action.data }
          : account;
      });
    case 'UPDATE_ACCOUNT_BADGE':
      return state.map(account => {
        return (account.id === action.id)
          ? { ...account, badgeCount: action.count }
          : account;
      });
    case 'SWITCH_ACCOUNT':
      return state.map(account => {
        return {
          ...account,
          visible: account.id === action.id,
        };
      });
    case 'DELETE_ACCOUNT':
      return state.filter(account => account.id !== action.id);
    default:
      return state;
  }
};

export default accounts;
