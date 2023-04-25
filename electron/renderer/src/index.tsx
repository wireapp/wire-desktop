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

import actionRoot, {addAccountWithSession} from './actions';
import App from './components/App/App';
import {configureStore} from './configureStore';
import './Index.css';

import {EVENT_TYPE} from '../../src/lib/eventType';

const store = configureStore({actions: actionRoot});

interface EventDetail extends Event {
  detail: {
    accountIndex: number;
    code: string;
  };
}

window.addEventListener(
  EVENT_TYPE.ACTION.SWITCH_ACCOUNT,
  event => store.dispatch(actionRoot.accountAction.switchWebview((event as EventDetail).detail.accountIndex)),
  false,
);
window.addEventListener(
  EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT,
  event => store.dispatch(actionRoot.accountAction.startSSO((event as EventDetail).detail.code)),
  false,
);
window.addEventListener(EVENT_TYPE.ACTION.START_LOGIN, event => store.dispatch(addAccountWithSession()), false);

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
