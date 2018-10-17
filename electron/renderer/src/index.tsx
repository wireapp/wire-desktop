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

import throttle = require('lodash/throttle');
import * as React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import {Account} from '../interfaces';
import App from './components/App';
import {loadState, saveState} from './lib/localStorage';
import appStore, {RootState} from './reducers/';

import './Index.css';

const persistedState = loadState();

const middleware = [thunk];

if (process.env.NODE_ENV !== 'production') {
  middleware.push(logger);
}

const store = createStore<Partial<RootState>>(appStore, persistedState, applyMiddleware(...middleware));

store.subscribe(
  throttle(() => {
    saveState({
      accounts: store.getState().accounts.map((account: Account) => {
        // no need to store badge count
        return {
          ...account,
          badgeCount: 0,
          lifecycle: undefined,
        };
      }),
    });
  }, 500)
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
