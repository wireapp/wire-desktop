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

import * as React from 'react';
import {connect} from 'react-redux';
import {switchAccount} from '../actions/';
import WebviewsContainer from '../containers/WebviewsContainer';
import {RootState, ThunkDispatch} from '../reducers/';
import IsOnline from './IsOnline';
import Sidebar from './Sidebar';

import './App.css';

export interface Props {
  accountIds: string[];
}

export interface DispatchProps {
  switchAccount: (accountId: string) => void;
}

export type CombinedProps = Props & DispatchProps;

const App = (props: CombinedProps) => (
  <IsOnline>
    <div
      className="App"
      onKeyDown={event => {
        const modKeyPressed = (window.isMac && event.metaKey) || event.ctrlKey;
        const isValidKey = ['1', '2', '3'].includes(event.key);
        if (modKeyPressed && isValidKey && props.accountIds[event.keyCode - 1]) {
          props.switchAccount(props.accountIds[event.keyCode - 1]);
        }
      }}
    >
      <Sidebar />
      <WebviewsContainer />
    </div>
  </IsOnline>
);

export default connect(
  (state: RootState) => ({accountIds: state.accounts.map(account => account.id)}),
  (dispatch: ThunkDispatch): DispatchProps => ({
    switchAccount: (accountId: string) => dispatch(switchAccount(accountId)),
  })
)(App);
