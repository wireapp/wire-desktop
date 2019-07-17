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

import throttle from 'lodash/throttle';
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import {Provider} from 'react-redux';
import {Middleware, applyMiddleware, createStore} from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import {config} from '../../dist/settings/config';
import App from './components/App';
import './Index.css';
import {loadState, saveState} from './lib/localStorage';
import appStore from './reducers';

declare global {
  interface Window {
    locStrings: Record<string, string>;
    locStringsDefault: Record<string, string>;
    sendBadgeCount: (count: number) => void;
    sendDeleteAccount: (accountId: string, sessionId?: string) => Promise<void>;
    sendLogoutAccount: (accountId: string) => void;
  }
}

window.locStrings = window.locStrings || {};
window.locStringsDefault = window.locStringsDefault || {};

const persistedState = loadState();
const middleware: Middleware[] = [thunk];

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
  }, 500),
);

const render = (Component: any) =>
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Component />
      </Provider>
    </AppContainer>,
    document.getElementById('root'),
  );

function runApp() {
  render(App);
  if (module.hot) {
    module.hot.accept('./components/App', () => {
      const NextApp = require('./components/App').default;
      render(NextApp);
    });
  }
}

runApp();
