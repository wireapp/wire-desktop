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

import actionRoot from '../actions';
import IsOnline from './IsOnline';
import Sidebar from './Sidebar';
import WebviewList from './WebviewList';
import {AccountSelector} from '../selector/AccountSelector';

const App = ({accounts, switchWebview}) => {
  useEffect(() => {
    // Note: This is switching to the last visible webview in order to set the focus and cursor in the webview
    setTimeout(() => {
      const selectedAccount = accounts.find(account => account.visible === true);
      switchWebview(accounts.indexOf(selectedAccount));
    }, 1000);
  }, []);

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
  state => ({
    accounts: AccountSelector.getAccounts(state),
  }),
  {switchWebview: actionRoot.accountAction.switchWebview},
)(App);
