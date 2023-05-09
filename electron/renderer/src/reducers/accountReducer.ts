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

import {ACCOUNT_ACTION} from '../actions/index';
import {AppAction} from '../index';
import {generateUUID} from '../lib/util';
import {Account, ConversationJoinData} from '../types/account';

type CreateAccountProps = {
  sessionID?: string;
  ssoCode?: string;
  visible?: boolean;
};

export const createAccount = ({sessionID, ssoCode, visible = true}: CreateAccountProps = {}): Account => ({
  accentID: undefined,
  availability: 0,
  badgeCount: 0,
  darkMode: true,
  id: generateUUID(),
  isAdding: true,
  lifecycle: undefined,
  name: undefined,
  picture: undefined,
  teamRole: '',
  accountIndex: 0,
  sessionID,
  ssoCode,
  teamID: undefined,
  userID: undefined,
  visible,
});

export interface AddAccount extends AppAction {
  readonly type: ACCOUNT_ACTION.ADD_ACCOUNT;
  readonly sessionID?: string;
}

export interface InitiateSSO extends AppAction {
  readonly type: ACCOUNT_ACTION.INITIATE_SSO;
  readonly ssoCode: string;
  readonly id?: string;
  readonly sessionID?: string;
}

export interface DeleteAccount extends AppAction {
  readonly type: ACCOUNT_ACTION.DELETE_ACCOUNT;
  readonly id: string;
}

export interface ResetIdentity extends AppAction {
  readonly type: ACCOUNT_ACTION.RESET_IDENTITY;
  readonly id: string;
}

export interface SwitchAccount extends AppAction {
  readonly type: ACCOUNT_ACTION.SWITCH_ACCOUNT;
  readonly id: string;
}

export interface UpdateAccount extends AppAction {
  readonly type: ACCOUNT_ACTION.UPDATE_ACCOUNT;
  readonly id: string;
  readonly data: Partial<Account>;
}

export interface UpdateAccountBadge extends AppAction {
  readonly type: ACCOUNT_ACTION.UPDATE_ACCOUNT_BADGE;
  readonly id: string;
  readonly count: number;
}

export interface UpdateAccountDarkMode extends AppAction {
  readonly type: ACCOUNT_ACTION.UPDATE_ACCOUNT_DARK_MODE;
  readonly id: string;
  readonly darkMode: boolean;
}

export interface UpdateAccountLifeCycle extends AppAction {
  readonly type: ACCOUNT_ACTION.UPDATE_ACCOUNT_LIFECYCLE;
  readonly id: string;
  readonly channel: string;
}

export interface SetConversationJoinData extends AppAction {
  readonly type: ACCOUNT_ACTION.SET_CONVERSATION_JOIN_DATA;
  readonly id: string;
  readonly data?: ConversationJoinData;
}

export type AccountActions =
  | AddAccount
  | InitiateSSO
  | DeleteAccount
  | ResetIdentity
  | SwitchAccount
  | UpdateAccount
  | UpdateAccountBadge
  | UpdateAccountDarkMode
  | UpdateAccountLifeCycle
  | SetConversationJoinData;

export default (state = [createAccount()], action: AccountActions): Account[] => {
  switch (action.type) {
    case ACCOUNT_ACTION.ADD_ACCOUNT: {
      const newState = state.map(account => ({...account, visible: false}));
      const newAccount = createAccount({sessionID: action.sessionID});
      return [...newState, newAccount];
    }

    case ACCOUNT_ACTION.INITIATE_SSO: {
      if (action.id) {
        // If an account is given, set the sso code
        return state.map(account => {
          const isMatchingAccount = account.id === action.id;
          return isMatchingAccount ? {...account, isAdding: true, ssoCode: action.ssoCode} : account;
        });
      }

      const newState = state.map(account => ({...account, visible: false}));
      const newAccount = createAccount({sessionID: action.sessionID, ssoCode: action.ssoCode});
      return [...newState, newAccount];
    }

    case ACCOUNT_ACTION.DELETE_ACCOUNT: {
      return state.filter(account => account.id !== action.id);
    }

    case ACCOUNT_ACTION.RESET_IDENTITY: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, teamID: undefined, userID: undefined} : account;
      });
    }

    case ACCOUNT_ACTION.SWITCH_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return {...account, visible: isMatchingAccount};
      });
    }

    case ACCOUNT_ACTION.UPDATE_ACCOUNT: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        // Note: If the current account has a webappUrl but the update does not
        // we keep the current webappUrl.
        // Without this the webappUrl would be overridden with an empty string
        if (account.webappUrl && !action.data.webappUrl) {
          delete action.data.webappUrl;
        }
        // Note: If the current account has a picture but the update does not
        // we remove the picture.
        if (account.picture && !action.data.picture) {
          delete account.picture;
        }
        return isMatchingAccount ? {...account, ...action.data, isAdding: false, ssoCode: undefined} : account;
      });
    }

    case ACCOUNT_ACTION.UPDATE_ACCOUNT_BADGE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, badgeCount: action.count} : account;
      });
    }

    case ACCOUNT_ACTION.UPDATE_ACCOUNT_DARK_MODE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, darkMode: action.darkMode} : account;
      });
    }

    case ACCOUNT_ACTION.UPDATE_ACCOUNT_LIFECYCLE: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, lifecycle: action.channel} : account;
      });
    }

    case ACCOUNT_ACTION.SET_CONVERSATION_JOIN_DATA: {
      return state.map(account => {
        const isMatchingAccount = account.id === action.id;
        return isMatchingAccount ? {...account, conversationJoinData: action.data} : account;
      });
    }

    default: {
      return state;
    }
  }
};
