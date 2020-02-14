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

import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {StyledApp} from '@wireapp/react-ui-kit';

import {config} from '../../../dist/settings/config';
import {initiateSSO, switchAccount, updateAccount} from '../actions';
import * as EVENT_TYPE from '../lib/eventType';
import IsOnline from './IsOnline';
import Sidebar from './Sidebar';
import WebviewList from './WebviewList';

const App = ({accounts, switchAccount, initiateSSO}) => {
  useEffect(() => {
    window.addEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, switchWebview, false);
    window.addEventListener(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, startSSO, false);

    // Note: This is switching to the last visible webview in order to set the focus and cursor in the webview
    setTimeout(() => {
      const selectedAccount = accounts.find(account => account.visible === true);
      switchWebview({detail: {accountIndex: accounts.indexOf(selectedAccount)}});
    }, 1000);
    return () => {
      window.removeEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, switchWebview);
      window.removeEventListener(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, startSSO);
    };
  }, []);

  const switchWebview = event => {
    const {accountIndex} = event.detail;
    const account = accounts[Math.max(accountIndex, 0)];
    if (account?.id) {
      switchAccount(account.id);

      // Note: We need to focus window first to properly set focus
      // on the webview with shortcuts like Cmd+1/2/3
      window.blur();
      window.focus();

      const webview = document.querySelector(`.Webview[data-accountid="${account.id}"]`);
      webview.blur();
      webview.focus();
    }
  };

  const startSSO = event => {
    const loggedOutWebviews = accounts.filter(account => account.userID === undefined);
    const ssoCode = event.detail.code;

    if (loggedOutWebviews.length > 0) {
      const accountId = loggedOutWebviews[0].id;
      switchAccount(accountId);
      initiateSSO(accountId, ssoCode, accounts.length == 1);
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
      initiateSSO(undefined, ssoCode, true);
    }
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE));
  };

  return (
    <StyledApp style={{height: '100%'}}>
      <IsOnline>
        <div style={{display: 'flex', height: '100%', width: '100%'}}>
          <Sidebar />
          <WebviewList />
        </div>
      </IsOnline>
    </StyledApp>
  );
};

export default connect(
  ({accounts}) => ({
    accounts,
    isAddingAccount: !!accounts.length && accounts.some(account => account.userID === undefined),
  }),
  {initiateSSO, switchAccount, updateAccount},
)(App);
