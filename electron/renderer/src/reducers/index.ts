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

import {combineReducers} from 'redux';
import {ThunkAction as ReduxThunkAction, ThunkDispatch as ReduxThunkDispatch} from 'redux-thunk';

import {Action} from '../../interfaces';
import accountReducer, {AccountState} from './accountReducer';
import contextMenuReducer, {ContextMenuState} from './contextMenuReducer';

export interface RootState {
  accounts: AccountState;
  contextMenuState: ContextMenuState;
}

export type ThunkAction<T = void> = ReduxThunkAction<T, RootState, void, Action>;
export type ThunkDispatch = ReduxThunkDispatch<RootState, void, Action>;

const store = combineReducers<RootState>({
  accounts: accountReducer,
  contextMenuState: contextMenuReducer,
});

export default store;
