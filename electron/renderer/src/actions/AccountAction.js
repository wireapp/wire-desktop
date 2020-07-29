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

import {ActionType, initiateSSO} from './';
import {config} from '../../../dist/settings/config';
import {EVENT_TYPE} from '../../../dist/lib/eventType';
import {AccountSelector} from '../selector/AccountSelector';

/**
 * Don't use this method directly, use `switchWebview` instead.
 *
 * @param {string} id - Account ID
 * @returns {{id: string, type: ActionType.SWITCH_ACCOUNT}} - Account switch action
 */
export const switchAccount = id => ({
  id,
  type: ActionType.SWITCH_ACCOUNT,
});

export class AccountAction {
  startSSO = ssoCode => {
    return async (dispatch, getState, {actions: {accountAction}}) => {
      try {
        const accounts = AccountSelector.getAccounts(getState());
        const loggedOutWebviews = accounts.filter(account => account.userID === undefined);

        if (loggedOutWebviews.length > 0) {
          dispatch(accountAction.switchWebview(accounts.indexOf(loggedOutWebviews[0])));

          const accountId = loggedOutWebviews[0].id;
          dispatch(initiateSSO(accountId, ssoCode, accounts.length == 1));
        } else {
          if (accounts.length >= config.maximumAccounts) {
            return window.dispatchEvent(
              new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE, {
                detail: {
                  reachedMaximumAccounts: true,
                },
              }),
            );
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

  switchWebview = accountIndex => {
    return async (dispatch, getState) => {
      const account = AccountSelector.getAccounts(getState())[Math.max(accountIndex, 0)];
      dispatch(switchAccount(account.id));

      // Note: We need to focus window first to properly set focus
      // on the webview with shortcuts like Cmd+1/2/3
      window.blur();
      window.focus();

      const webview = document.querySelector(`.Webview[data-accountid="${account.id}"]`);
      if (webview) {
        webview.blur();
        webview.focus();
      }
    };
  };
}

export const accountAction = new AccountAction();
