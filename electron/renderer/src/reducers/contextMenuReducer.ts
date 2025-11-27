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

import {ACCOUNT_ACTION} from '../actions';
import {AppAction} from '../index';
import {ContextMenuState} from '../types/contextMenuState';

export interface HideContextMenus extends AppAction {
  readonly type: ACCOUNT_ACTION.HIDE_CONTEXT_MENUS;
}

export interface ToggleAddAccountVisibility extends AppAction {
  readonly type: ACCOUNT_ACTION.TOGGLE_ADD_ACCOUNT_VISIBILITY;
  readonly payload: {
    position: {
      centerX: number;
      centerY: number;
    };
  };
}

export interface ToggleEditAccountVisibility extends AppAction {
  readonly type: ACCOUNT_ACTION.TOGGLE_EDIT_ACCOUNT_VISIBILITY;
  readonly payload: ContextMenuState;
}

export type ContextMenuActions = HideContextMenus | ToggleAddAccountVisibility | ToggleEditAccountVisibility;

export const initialState: ContextMenuState = {
  accountId: '',
  isAtLeastAdmin: false,
  isEditAccountMenuVisible: false,
  lifecycle: undefined,
  position: {
    centerX: 0,
    centerY: 0,
  },
  sessionID: '',
  shouldAutoFocus: false,
};

export default (state = initialState, action: ContextMenuActions): ContextMenuState => {
  switch (action.type) {
    case ACCOUNT_ACTION.HIDE_CONTEXT_MENUS: {
      return {...initialState};
    }

    case ACCOUNT_ACTION.TOGGLE_ADD_ACCOUNT_VISIBILITY: {
      return {
        ...state,
        isEditAccountMenuVisible: false,
        position: action.payload.position,
      };
    }

    case ACCOUNT_ACTION.TOGGLE_EDIT_ACCOUNT_VISIBILITY: {
      return {
        ...state,
        accountId: action.payload.accountId,
        isAtLeastAdmin: action.payload.isAtLeastAdmin,
        isEditAccountMenuVisible: !state.isEditAccountMenuVisible,
        lifecycle: action.payload.lifecycle,
        position: action.payload.position,
        sessionID: action.payload.sessionID,
        shouldAutoFocus: action.payload.shouldAutoFocus ?? false,
      };
    }

    default: {
      return state;
    }
  }
};
