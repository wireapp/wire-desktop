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

import './App.css';

import React from 'react';
import {connect} from 'react-redux';
import {StyledApp} from '@wireapp/react-ui-kit';

import {config} from '../../../dist/settings/config';
import {initiateSSO, switchAccount, updateAccount} from '../actions';
import * as EVENT_TYPE from '../lib/eventType';
import IsOnline from './IsOnline';
import Sidebar from './Sidebar';
import WebviewList from './WebviewList';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    window.addEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount, false);
    window.addEventListener(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, this.initiateSSO, false);

    // Workaround: Switch to first webview after startup
    setTimeout(() => {
      this.switchAccount({detail: {accountIndex: 0}});
    }, 1000);
  }

  componentWillUnmount() {
    window.removeEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount);
    window.removeEventListener(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, this.initiateSSO);
  }

  switchAccount = event => {
    const {accountIndex} = event.detail;
    const accountId = this.props.accountIds[accountIndex];
    if (accountId) {
      this.props.switchAccount(accountId);

      // Note: We need to focus window first to properly set focus
      // on the webview with shortcuts like Cmd+1/2/3
      window.blur();
      window.focus();

      const webview = document.querySelector(`.Webview[data-accountid="${accountId}"]`);
      webview.blur();
      webview.focus();
    }
  };

  initiateSSO = event => {
    const loggedOutWebviews = this.props.accounts.filter(account => account.userID === undefined);
    const ssoCode = event.detail.code;

    if (loggedOutWebviews.length > 0) {
      const accountId = loggedOutWebviews[0].id;
      this.props.switchAccount(accountId);
      this.props.initiateSSO(accountId, ssoCode, this.props.accounts.length == 1);
    } else {
      if (this.props.accounts.length >= config.maximumAccounts) {
        return window.dispatchEvent(
          new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE, {
            detail: {
              reachedMaximumAccounts: true,
            },
          }),
        );
      }
      // All accounts are logged in, create a new one
      this.props.initiateSSO(undefined, ssoCode, true);
    }
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE));
  };

  render() {
    return (
      <StyledApp style={{height: '100%'}}>
        <IsOnline>
          <div className="App">
            <Sidebar />
            <WebviewList />
          </div>
        </IsOnline>
      </StyledApp>
    );
  }
}

function mapStateToProps(state) {
  const {accounts} = state;
  return {
    accountIds: accounts.map(account => account.id),
    accounts,
    isAddingAccount: !!accounts.length && accounts.some(account => account.userID === undefined),
  };
}

function mapDispatchToProps() {
  return {initiateSSO, switchAccount, updateAccount};
}

export default connect(mapStateToProps, mapDispatchToProps())(App);
