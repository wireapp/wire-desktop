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

import './Index.css';

import throttle from 'lodash/throttle';
import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import {config} from '../../dist/settings/config';
import App from './components/App';
import {loadState, saveState} from './lib/localStorage';
import appStore from './reducers';

const HALF_SECOND = 500;

const persistedState = loadState();

const middleware = [thunk];

if (config.environment !== 'production') {
  middleware.push(logger);
}

const store = createStore(appStore, persistedState, applyMiddleware(...middleware));

store.subscribe(
  throttle(() => {
    saveState({
      accounts: store.getState().accounts.map(account => {
        // no need to store badge count
        return {
          ...account,
          badgeCount: 0,
          lifecycle: undefined,
        };
      }),
    });
  }, HALF_SECOND),
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
