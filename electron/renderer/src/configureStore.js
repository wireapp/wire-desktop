/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {applyMiddleware, createStore} from 'redux';
import {createLogger} from 'redux-logger';
import thunk from 'redux-thunk';
import throttle from 'lodash/throttle';

import {loadState, saveState} from './lib/localStorage';
import reducers from './reducers';

const HALF_SECOND = 500;
const persistedState = loadState();

export const configureStore = (thunkArguments = {}) => {
  const store = createStore(reducers, persistedState, createMiddleware(thunkArguments));

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
  return store;
};

const createMiddleware = thunkArguments => {
  const middlewares = [];
  middlewares.push(thunk.withExtraArgument(thunkArguments));
  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(
      createLogger({
        collapsed: true,
        diff: true,
        duration: true,
        level: {
          action: 'info',
          nextState: 'info',
          prevState: false,
        },
      }),
    );
  }
  return applyMiddleware(...middlewares);
};

export default configureStore;
