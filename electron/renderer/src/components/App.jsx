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
import * as EVENT_TYPE from '../lib/eventType';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.switchAccount = this.switchAccount.bind(this);
  }

  componentDidMount() {
    window.addEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount, false);
  }

  componentWillUnmount() {
    window.removeEventListener(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, this.switchAccount);
  }

  switchAccount(event) {
    const {accountIndex} = event.detail;
    const accountId = this.props.accountIds[accountIndex];
    if (accountId) {
      this.props.switchAccount(accountId);
    }
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
  };
}

function mapDispatchToProps(dispatch) {
  return {switchAccount};
}

export default connect(
  mapStateToProps,
  mapDispatchToProps()
)(App);
