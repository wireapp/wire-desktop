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
import {switchAccount} from '../actions';

import './App.css';

const App = props => (
  <IsOnline>
    <div
      className="App"
      onKeyDown={event => {
        const modKeyPressed = (window.isMac && event.metaKey) || event.ctrlKey;
        const isValidKey = ['1', '2', '3'].includes(event.key);
        const accountIndex = parseInt(event.key, 10) - 1;
        const accountId = props.accountIds[accountIndex];
        if (modKeyPressed && isValidKey && accountId) {
          props.switchAccount(accountId);
        }
      }}
    >
      <Sidebar />
      <WebviewsContainer />
    </div>
  </IsOnline>
);

export default connect(
  ({accounts}) => ({accountIds: accounts.map(account => account.id)}),
  {switchAccount}
)(App);
