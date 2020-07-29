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

import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import {EVENT_TYPE} from '../../dist/lib/eventType';
import App from './components/App';
import configureStore from './configureStore';
import actionRoot from './actions';

import './Index.css';

const store = configureStore({actions: actionRoot});

window.addEventListener(
  EVENT_TYPE.ACTION.SWITCH_ACCOUNT,
  event => store.dispatch(actionRoot.accountAction.switchWebview(event.detail.accountIndex)),
  false,
);
window.addEventListener(
  EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT,
  event => store.dispatch(actionRoot.accountAction.startSSO(event.detail.code)),
  false,
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
