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

import IsOnline from './IsOnline';
import React from 'react';
import {connect} from 'react-redux';
import Sidebar from './Sidebar';
import WebviewsContainer from '../containers/WebviewsContainer';
import {addAccountWithSession, switchAccount} from '../actions';
import * as EVENT_TYPE from '../lib/eventType';
import {MAXIMUM_ACCOUNTS} from '../../../dist/js/config';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.switchAccount = this.switchAccount.bind(this);
    this.addAccountWithSession = this.addAccountWithSession.bind(this);
  }

  componentDidMount() {
    window.addEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount, false);
    window.addEventListener(EVENT_TYPE.ACTION.CREATE_ACCOUNT, this.addAccountWithSession, false);
  }

  componentWillUnmount() {
    window.removeEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount);
    window.removeEventListener(EVENT_TYPE.ACTION.CREATE_ACCOUNT, this.addAccountWithSession);
  }

  switchAccount(event) {
    const {accountIndex} = event.detail;
    const accountId = this.props.accountIds[accountIndex];
    if (accountId) {
      this.props.switchAccount(accountId);
    }
  }

  addAccountWithSession(event) {
    const loggedOutWebviews = this.props.accounts.filter(account => account.userID === undefined);
    if (loggedOutWebviews.length > 0) {
      // Make the first account we see that is not logged in as visible
      this.props.switchAccount(loggedOutWebviews[0].id);
    } else {
      // All accounts are logged in, create a new one
      if (this.props.accounts.length >= MAXIMUM_ACCOUNTS) {
        return window.dispatchEvent(
          new CustomEvent(EVENT_TYPE.ACTION.CREATE_ACCOUNT_RESPONSE, {
            detail: {
              reachedMaximumAccounts: true,
            },
          })
        );
      }
      this.props.addAccountWithSession();
    }
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_ACCOUNT_RESPONSE));
  }

  render() {
    return (
      <IsOnline>
        <div className="App">
          <Sidebar />
          <WebviewsContainer />
        </div>
      </IsOnline>
    );
  }
}

function mapStateToProps(state) {
  const {accounts} = state;
  return {
    accountIds: accounts.map(account => account.id),
    accounts: accounts,
    isAddingAccount: !!accounts.length && accounts.some(account => account.userID === undefined),
  };
}

function mapDispatchToProps(dispatch) {
  return {addAccountWithSession, switchAccount};
}

export default connect(
  mapStateToProps,
  mapDispatchToProps()
)(App);
