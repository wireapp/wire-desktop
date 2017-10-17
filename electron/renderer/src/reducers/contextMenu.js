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

const defaultState = {
  accountId: '',
  isAddAccountMenuVisible: false,
  isAtLeastAdmin: false,
  isEditAccountMenuVisible: false,
  position: {x: 0, y: 0},
  sessionId: '',
};

const accounts = (state = defaultState, action) => {
  switch (action.type) {
    case 'HIDE_CONTEXT_MENUS':
      return {
        ...defaultState,
      };
    case 'TOGGLE_ADD_ACCOUNT_VISIBILITY':
      return {
        ...state,
        isAddAccountMenuVisible: !state.isAddAccountMenuVisible,
        isEditAccountMenuVisible: false,
        position: action.payload.position,
      };
    case 'TOGGLE_EDIT_ACCOUNT_VISIBILITY':
      return {
        ...state,
        accountId: action.payload.accountId,
        isAddAccountMenuVisible: false,
        isAtLeastAdmin: action.payload.isAtLeastAdmin,
        isEditAccountMenuVisible: !state.isEditAccountMenuVisible,
        position: action.payload.position,
        sessionId: action.payload.sessionId,
      };
    default:
      return state;
  }
};

export default accounts;
