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

import {connect} from 'react-redux';
import {RootState, ThunkDispatch} from '../reducers/';

import {
  abortAccountCreation,
  switchAccount,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
} from '../actions';
import Webviews from '../components/Webviews';

export interface DispatchProps {
  abortAccountCreation: (id: string) => void;
  switchAccount: (id: string) => void;
  updateAccountBadgeCount: (id: string, count: number) => void;
  updateAccountData: (id: string, data: Partial<Account>) => void;
  updateAccountLifecycle: (id: string, channel: string) => void;
}

const WebviewsContainer = connect(
  (state: RootState) => ({accounts: state.accounts}),
  (dispatch: ThunkDispatch): DispatchProps => ({
    abortAccountCreation: (id: string) => dispatch(abortAccountCreation(id)),
    switchAccount: (id: string) => dispatch(switchAccount(id)),
    updateAccountBadgeCount: (id: string, count: number) => dispatch(updateAccountBadgeCount(id, count)),
    updateAccountData: (id: string, data: Partial<Account>) => dispatch(updateAccountData(id, data)),
    updateAccountLifecycle: (id: string, channel: string) => dispatch(updateAccountLifecycle(id, channel)),
  })
)(Webviews);

export default WebviewsContainer;
