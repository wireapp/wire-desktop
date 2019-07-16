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

import React from 'react';
import {connect} from 'react-redux';

import {config} from '../../../dist/settings/config';
import {initiateSSO, switchAccount, updateAccount} from '../actions/';
import WebviewsContainer from '../containers/WebviewsContainer';
import {ACTION} from '../lib/eventType';
import {RootState} from '../reducers';
import {AccountData} from '../reducers/accountReducer';
import './App.css';
import IsOnline, {Props as IsOnlineProps} from './IsOnline';
import Sidebar from './Sidebar';

export interface AccountEvent {
  accountIndex: number;
}

export interface SSOEvent {
  code?: string;
}

export type Props = React.HTMLProps<IsOnlineProps>;

export interface ConnectedProps {
  accounts: AccountData[];
  accountIds: string[];
  isAddingAccount: boolean;
}

export interface DispatchProps {
  switchAccount: typeof switchAccount;
  initiateSSO: typeof initiateSSO;
  updateAccount: typeof updateAccount;
}

class App extends React.Component<Props & ConnectedProps & DispatchProps> {
  componentDidMount() {
    window.addEventListener(ACTION.SWITCH_ACCOUNT, this.switchAccount as any, false);
    window.addEventListener(ACTION.CREATE_SSO_ACCOUNT, this.initiateSSO as any, false);
  }

  componentWillUnmount() {
    window.removeEventListener(ACTION.SWITCH_ACCOUNT, this.switchAccount as any);
    window.removeEventListener(ACTION.CREATE_SSO_ACCOUNT, this.initiateSSO as any);
  }

  switchAccount = (event: CustomEvent<AccountEvent>) => {
    const {accountIndex} = event.detail;
    const accountId = this.props.accountIds[accountIndex];
    if (accountId) {
      this.props.switchAccount(accountId);
    }
  };

  initiateSSO = (event: CustomEvent<SSOEvent>) => {
    const loggedOutWebviews = this.props.accounts.filter(account => account.userID === undefined);
    const ssoCode = event.detail.code;

    if (loggedOutWebviews.length > 0) {
      const accountId = loggedOutWebviews[0].id;
      this.props.switchAccount(accountId);
      this.props.initiateSSO(accountId, ssoCode, this.props.accounts.length == 1);
    } else {
      if (this.props.accounts.length >= config.maximumAccounts) {
        return window.dispatchEvent(
          new CustomEvent(ACTION.CREATE_SSO_ACCOUNT_RESPONSE, {
            detail: {
              reachedMaximumAccounts: true,
            },
          }),
        );
      }
      // All accounts are logged in, create a new one
      this.props.initiateSSO(undefined, ssoCode, true);
    }
    return window.dispatchEvent(new CustomEvent(ACTION.CREATE_SSO_ACCOUNT_RESPONSE));
  };

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

export default connect(
  ({accounts}: RootState) => ({
    accountIds: accounts.map((account: AccountData) => account.id),
    accounts,
    isAddingAccount: !!accounts.length && accounts.some((account: AccountData) => account.userID === undefined),
  }),
  {initiateSSO, switchAccount, updateAccount},
)(App);
