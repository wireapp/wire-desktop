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

import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import {Action} from 'redux';

import actionRoot, {addAccountWithSession} from './actions';
import App from './components/App/App';
import {configureStore} from './configureStore';
import './Index.css';
import {Account} from './types/account';
import {ContextMenuState} from './types/contextMenuState';

import {EVENT_TYPE} from '../../src/lib/eventType';

export type State = {
  accounts: Account[];
  contextMenuState: ContextMenuState;
};

export interface AppAction extends Action {
  type: string;
}

interface EventDetail extends Event {
  detail: {
    accountIndex: number;
    code: string;
  };
}

const store = configureStore({actions: actionRoot});

export type AppDispatch = typeof store.dispatch;

globalThis.addEventListener(
  EVENT_TYPE.ACTION.SWITCH_ACCOUNT,
  event => {
    // @ts-ignore
    store.dispatch(actionRoot.accountAction.switchWebview((event as EventDetail).detail.accountIndex));
  },
  false,
);
globalThis.addEventListener(
  EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT,
  event => {
    // @ts-ignore
    store.dispatch(actionRoot.accountAction.startSSO((event as EventDetail).detail.code));
  },
  false,
);

globalThis.addEventListener(
  EVENT_TYPE.ACTION.START_LOGIN,
  event => {
    // @ts-ignore
    store.dispatch(addAccountWithSession());
  },
  false,
);

const container = document.getElementById('root');

if (!container) {
  throw new Error('container not found.');
}

const root = createRoot(container);

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
