/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {EVENT_TYPE} from '../../../src/lib/eventType';
import {config} from '../../../src/settings/config';
import {AppDispatch, State} from '../index';
import {SwitchAccount} from '../reducers/accountReducer';
import {AccountSelector} from '../selector/AccountSelector';

import {ACCOUNT_ACTION, initiateSSO} from './index';

type WebviewTag = Electron.WebviewTag;

/**
 * Don't use this method directly, use `switchWebview` instead.
 *
 * @param {string} id - Account ID
 * @returns {{id: string, type: ACCOUNT_ACTION.SWITCH_ACCOUNT}} - Account switch action
 */
export const switchAccount = (id: string): SwitchAccount => ({
  id,
  type: ACCOUNT_ACTION.SWITCH_ACCOUNT,
});

export type AccountActionTypes = {
  startSSO: (ssoCode: string) => void;
  switchWebview: (accountIndex: number) => Promise<void>;
};

export class AccountAction {
  startSSO = (ssoCode: string) => {
    return async (
      dispatch: AppDispatch,
      getState: () => State,
      {actions: {accountAction}}: {actions: {accountAction: AccountActionTypes}},
    ) => {
      try {
        const accounts = AccountSelector.getAccounts(getState());
        const loggedOutWebviews = accounts.filter(account => account.userID === undefined);

        if (loggedOutWebviews.length > 0) {
          await accountAction.switchWebview(accounts.indexOf(loggedOutWebviews[0]));

          const accountId = loggedOutWebviews[0].id;
          dispatch(initiateSSO(accountId, ssoCode, accounts.length == 1));
        } else {
          if (accounts.length >= config.maximumAccounts) {
            window.dispatchEvent(
              new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE, {
                detail: {
                  reachedMaximumAccounts: true,
                },
              }),
            );

            return;
          }
          // All accounts are logged in, create a new one
          dispatch(initiateSSO(undefined, ssoCode, true));
        }
        window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE));
      } catch (error) {
        throw error;
      }
    };
  };

  switchWebview = (accountIndex: number) => {
    return async (dispatch: AppDispatch, getState: () => State) => {
      const account = AccountSelector.getAccounts(getState())[Math.max(accountIndex, 0)];
      if (!account.id) {
        return;
      }

      dispatch(switchAccount(account.id));

      // Note: We need to focus window first to properly set focus
      // on the webview with shortcuts like Cmd+1/2/3
      window.blur();
      window.focus();

      const webview = document.querySelector(`.Webview[data-accountid='${account.id}']`) as WebviewTag;
      if (webview) {
        webview.blur();
        webview.focus();
      }
    };
  };
}

export const accountAction = new AccountAction();
