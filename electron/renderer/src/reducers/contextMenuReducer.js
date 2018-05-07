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

import * as ActionCreator from '../actions';

const DEFAULT_STATE = {
  accountId: '',
  isAddAccountMenuVisible: false,
  isAtLeastAdmin: false,
  isEditAccountMenuVisible: false,
  lifecycle: false,
  position: {x: 0, y: 0},
  sessionId: '',
};

const contextMenuReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    case ActionCreator.HIDE_CONTEXT_MENUS: {
      return {...DEFAULT_STATE};
    }

    case ActionCreator.TOGGLE_ADD_ACCOUNT_VISIBILITY: {
      return {
        ...state,
        isAddAccountMenuVisible: !state.isAddAccountMenuVisible,
        isEditAccountMenuVisible: false,
        position: action.payload.position,
      };
    }

    case ActionCreator.TOGGLE_EDIT_ACCOUNT_VISIBILITY: {
      return {
        ...state,
        accountId: action.payload.accountId,
        isAddAccountMenuVisible: false,
        isAtLeastAdmin: action.payload.isAtLeastAdmin,
        isEditAccountMenuVisible: !state.isEditAccountMenuVisible,
        lifecycle: action.payload.lifecycle,
        position: action.payload.position,
        sessionId: action.payload.sessionId,
      };
    }

    default:
      return state;
  }
};

export default contextMenuReducer;
